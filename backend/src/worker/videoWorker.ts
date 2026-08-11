import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { veoService } from '../services/veoService.js';
import { geminiService } from '../services/geminiService.js';
import { ffmpegService } from '../services/ffmpegService.js';

const POLL_INTERVAL_MS = 5000;   // 5 seconds between status checks
const MAX_POLLS = 60;            // Max 5 minutes per scene (60 × 5s)

export async function runWorkerLoop() {
  console.log('[VideoWorker] Node.js Asynchronous Multi-Scene Worker Loop Started.');

  while (true) {
    try {
      // 1. Fetch oldest queued or in-progress job
      const jobResult = await query(
        `SELECT id, user_id, project_id, prompt, model, status, progress_percentage, total_scenes, completed_scenes 
         FROM video_jobs 
         WHERE status IN ('Queued', 'Planning', 'Generating', 'Downloading', 'Normalizing', 'Merging') 
         ORDER BY created_at ASC LIMIT 1`
      );

      if (jobResult.rows.length > 0) {
        const job = jobResult.rows[0];
        console.log(`[VideoWorker] Processing Job ID: ${job.id} | Status: ${job.status}`);
        await processJob(job);
      }
    } catch (err) {
      console.error('[VideoWorker Loop Exception]', err);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }
}

async function processJob(job: Record<string, unknown>) {
  const jobId = job.id as string;

  try {
    const storageBaseDir = path.resolve(process.cwd(), 'storage');
    const rawScenesDir = path.join(storageBaseDir, 'scenes');
    const normScenesDir = path.join(storageBaseDir, 'normalized');
    const videosDir = path.join(storageBaseDir, 'videos');
    const thumbsDir = path.join(storageBaseDir, 'thumbnails');

    fs.mkdirSync(rawScenesDir, { recursive: true });
    fs.mkdirSync(normScenesDir, { recursive: true });
    fs.mkdirSync(videosDir, { recursive: true });
    fs.mkdirSync(thumbsDir, { recursive: true });

    // ─── STAGE 1: PLANNING (Gemini AI Director) ───────────────────────────────
    const sceneCheck = await query(`SELECT id FROM scenes WHERE video_job_id = $1`, [jobId]);
    if (sceneCheck.rows.length === 0 || job.status === 'Queued' || job.status === 'Planning') {
      await query(
        `UPDATE video_jobs SET status = 'Planning', progress_percentage = 10, started_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [jobId]
      );

      try {
        const directorRes = await geminiService.orchestrateDirector({ idea: job.prompt as string });
        const scenePlans = directorRes.storyboard.scenes;
        const defaultProjectId = job.project_id || '22222222-2222-2222-2222-222222222222';

        for (const sc of scenePlans) {
          const sceneId = uuidv4();
          await query(
            `INSERT INTO scenes (id, project_id, video_job_id, scene_number, duration, prompt, camera_movement, lighting_style, status, width, height, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', 1080, 1920, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO NOTHING`,
            [sceneId, defaultProjectId, jobId, sc.sceneNumber, sc.duration, sc.prompt, sc.cameraMovement, sc.lightingStyle]
          );
        }

        await query(
          `UPDATE video_jobs SET total_scenes = $1, completed_scenes = 0, status = 'Generating', progress_percentage = 20 WHERE id = $2`,
          [scenePlans.length, jobId]
        );
        console.log(`[VideoWorker] Planning complete: ${scenePlans.length} scenes for Job ${jobId}`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[VideoWorker] Planning failed for Job ${jobId}:`, errMsg);
        await query(
          `UPDATE video_jobs SET status = 'Failed', error_message = $1 WHERE id = $2`,
          [errMsg, jobId]
        );
        return;
      }
    }

    // ─── STAGE 2 & 3: GENERATE + DOWNLOAD + NORMALIZE EACH SCENE ─────────────
    const scenesResult = await query(
      `SELECT * FROM scenes WHERE video_job_id = $1 ORDER BY scene_number ASC`, [jobId]
    );
    const scenes = scenesResult.rows;

    let completedCount = 0;

    for (const sc of scenes) {
      if (sc.status === 'ReadyForMerge' || sc.status === 'Merged') {
        completedCount++;
        continue;
      }

      if (sc.status === 'Pending' || sc.status === 'Generating') {
        await query(
          `UPDATE scenes SET status = 'Generating', started_at = CURRENT_TIMESTAMP WHERE id = $1`, [sc.id]
        );

        try {
          // Step A: Start generation
          const veoRes = await veoService.startGeneration({
            prompt: sc.prompt,
            model: (job.model as string) || 'veo-2.0-generate-001',
            aspectRatio: '9:16',
            durationSeconds: Math.round(sc.duration) || 8,
          });

          const opId = veoRes.operationId;
          await query(`UPDATE scenes SET operation_id = $1 WHERE id = $2`, [opId, sc.id]);

          // Step B: Poll for completion
          let isDone = false;
          let videoUrl: string | null = null;
          let polls = MAX_POLLS;
          let lastError: string | undefined;

          while (!isDone && polls > 0) {
            await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
            const st = await veoService.checkStatus(opId);
            isDone = st.isDone;
            videoUrl = st.videoUrl;
            lastError = st.errorMessage;
            polls--;

            // Update progress during polling
            const pct = 20 + Math.round((1 - polls / MAX_POLLS) * 30);
            await query(
              `UPDATE video_jobs SET progress_percentage = $1 WHERE id = $2`, [pct, jobId]
            );
          }

          if (!isDone || !videoUrl) {
            throw new Error(lastError || 'Video generation timed out or no URL returned');
          }

          // Step C: Download video to disk
          const rawPath = path.join(rawScenesDir, `scene-${sc.id}.mp4`);
          console.log(`[VideoWorker] Downloading Scene ${sc.scene_number} from: ${videoUrl.substring(0, 80)}`);

          const downloaded = await veoService.downloadVideoToFile(videoUrl, rawPath);

          if (!downloaded || !fs.existsSync(rawPath)) {
            throw new Error(`Failed to download video for Scene ${sc.scene_number}`);
          }

          await query(
            `UPDATE scenes SET status = 'Downloaded', video_path = $1 WHERE id = $2`,
            [rawPath, sc.id]
          );
          sc.video_path = rawPath;
          sc.status = 'Downloaded';

        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(`[VideoWorker] Scene ${sc.scene_number} generation failed:`, errMsg);
          await query(
            `UPDATE scenes SET status = 'Failed', error_message = $1 WHERE id = $2`,
            [errMsg, sc.id]
          );
          // Continue to next scene — don't crash the whole job
          continue;
        }
      }

      // Step D: Normalize
      if (sc.status === 'Downloaded' || sc.status === 'Generated') {
        const inputPath = sc.video_path || path.join(rawScenesDir, `scene-${sc.id}.mp4`);
        const normPath = path.join(normScenesDir, `scene-${sc.id}.normalized.mp4`);

        const normalized = await ffmpegService.normalizeVideo(inputPath, normPath);
        if (normalized && fs.existsSync(normPath)) {
          await query(
            `UPDATE scenes SET status = 'ReadyForMerge', normalized_path = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [normPath, sc.id]
          );
          sc.status = 'ReadyForMerge';
          sc.normalized_path = normPath;
          completedCount++;
        }
      }
    }

    // Update completed_scenes count
    const readyCount = (await query(
      `SELECT COUNT(*) as cnt FROM scenes WHERE video_job_id = $1 AND status IN ('ReadyForMerge', 'Merged')`,
      [jobId]
    )).rows[0]?.cnt || 0;

    await query(
      `UPDATE video_jobs SET completed_scenes = $1 WHERE id = $2`,
      [readyCount, jobId]
    );

    // ─── STAGE 4: FFMPEG MERGE ─────────────────────────────────────────────────
    const readyScenesResult = await query(
      `SELECT * FROM scenes WHERE video_job_id = $1 AND status IN ('ReadyForMerge', 'Merged') ORDER BY scene_number ASC`,
      [jobId]
    );
    const readyScenes = readyScenesResult.rows;
    const totalScenes = scenes.length;

    if (readyScenes.length === 0) {
      console.warn(`[VideoWorker] No scenes ready to merge for Job ${jobId}`);
      await query(`UPDATE video_jobs SET status = 'Failed', error_message = 'No scenes completed successfully' WHERE id = $1`, [jobId]);
      return;
    }

    if (readyScenes.length >= totalScenes || readyScenes.length > 0) {
      await query(`UPDATE video_jobs SET status = 'Merging', progress_percentage = 90 WHERE id = $1`, [jobId]);

      const concatListFile = path.join(normScenesDir, `concat-list-${jobId}.txt`);
      let concatContent = '';

      for (const sc of readyScenes) {
        const p = sc.normalized_path || sc.video_path || '';
        const safePath = p.replace(/\\/g, '/').replace(/'/g, "'\\''");
        concatContent += `file '${safePath}'\n`;
      }

      fs.writeFileSync(concatListFile, concatContent, 'utf-8');
      const finalVideoPath = path.join(videosDir, `final-${jobId}.mp4`);
      await ffmpegService.concatVideos(concatListFile, finalVideoPath);

      if (!fs.existsSync(finalVideoPath)) {
        // Fallback: copy first ready scene
        const firstPath = readyScenes[0].normalized_path || readyScenes[0].video_path;
        if (firstPath && fs.existsSync(firstPath)) {
          fs.copyFileSync(firstPath, finalVideoPath);
        }
      }

      // ─── STAGE 5: THUMBNAIL & COMPLETION ──────────────────────────────────────
      const thumbnailPath = path.join(thumbsDir, `final-${jobId}.jpg`);
      await ffmpegService.generateThumbnail(finalVideoPath, thumbnailPath);

      await query(`UPDATE scenes SET status = 'Merged' WHERE video_job_id = $1`, [jobId]);
      await query(
        `UPDATE video_jobs SET status = 'Completed', progress_percentage = 100, 
         video_path = $1, final_video_path = $1, thumbnail_path = $2, completed_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [finalVideoPath, thumbnailPath, jobId]
      );

      console.log(`[VideoWorker] ✅ Job ${jobId} completed! ${readyScenes.length}/${totalScenes} scenes merged.`);
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[VideoWorker Fatal Job Error] Job ${jobId} failed unexpectedly:`, errMsg);
    await query(
      `UPDATE video_jobs SET status = 'Failed', error_message = $1 WHERE id = $2`,
      [errMsg, jobId]
    ).catch((e) => console.error('[Failed DB Update Error]', e));
  }
}
