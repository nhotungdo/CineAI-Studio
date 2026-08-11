import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { veoService } from '../services/veoService.js';
import { geminiService } from '../services/geminiService.js';
import { ffmpegService } from '../services/ffmpegService.js';

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
        console.log(`[VideoWorker] Processing Job ID: ${job.id} | Prompt: "${job.prompt}" | Current Status: ${job.status}`);

        const storageBaseDir = path.resolve(process.cwd(), 'storage');
        const rawScenesDir = path.join(storageBaseDir, 'scenes');
        const normScenesDir = path.join(storageBaseDir, 'normalized');
        const videosDir = path.join(storageBaseDir, 'videos');
        const thumbsDir = path.join(storageBaseDir, 'thumbnails');

        fs.mkdirSync(rawScenesDir, { recursive: true });
        fs.mkdirSync(normScenesDir, { recursive: true });
        fs.mkdirSync(videosDir, { recursive: true });
        fs.mkdirSync(thumbsDir, { recursive: true });

        // STAGE 1: PLANNING (Gemini 3.1 Pro Multi-Scene Planning)
        const sceneCheck = await query(`SELECT id FROM scenes WHERE video_job_id = $1`, [job.id]);
        if (sceneCheck.rows.length === 0 || job.status === 'Queued' || job.status === 'Planning') {
          await query(`UPDATE video_jobs SET status = 'Planning', progress_percentage = 10, started_at = CURRENT_TIMESTAMP WHERE id = $1`, [job.id]);

          const directorRes = await geminiService.orchestrateDirector({ idea: job.prompt });
          const scenePlans = directorRes.storyboard.scenes;

          const defaultProjectId = job.project_id || '22222222-2222-2222-2222-222222222222';

          for (const sc of scenePlans) {
            const sceneId = uuidv4();
            await query(
              `INSERT INTO scenes (id, project_id, video_job_id, scene_number, duration, prompt, camera_movement, lighting_style, status, width, height, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', 1080, 1920, CURRENT_TIMESTAMP)
               ON CONFLICT (id) DO NOTHING`,
              [sceneId, defaultProjectId, job.id, sc.sceneNumber, sc.duration, sc.prompt, sc.cameraMovement, sc.lightingStyle]
            );
          }

          await query(
            `UPDATE video_jobs SET total_scenes = $1, completed_scenes = 0, status = 'Generating', progress_percentage = 20 WHERE id = $2`,
            [scenePlans.length, job.id]
          );
        }

        // Fetch scene records
        const scenesResult = await query(`SELECT * FROM scenes WHERE video_job_id = $1 ORDER BY scene_number ASC`, [job.id]);
        const scenes = scenesResult.rows;

        // STAGE 2 & 3: GENERATING, DOWNLOADING & NORMALIZING EACH SCENE
        for (const sc of scenes) {
          if (sc.status === 'Pending' || sc.status === 'Generating') {
            await query(`UPDATE scenes SET status = 'Generating', started_at = CURRENT_TIMESTAMP WHERE id = $1`, [sc.id]);

            const veoRes = await veoService.startGeneration({
              prompt: sc.prompt,
              model: job.model || 'google/veo-3.1-fast',
              aspectRatio: '9:16'
            });

            const opId = veoRes.operationId;
            await query(`UPDATE scenes SET operation_id = $1 WHERE id = $2`, [opId, sc.id]);

            // Poll Veo operation status
            let isDone = false;
            let videoUrl: string | null = null;
            let polls = 12;

            while (!isDone && polls > 0) {
              await new Promise((r) => setTimeout(r, 1200));
              const st = await veoService.checkStatus(opId);
              if (st.isDone) {
                isDone = true;
                videoUrl = st.videoUrl;
              }
              polls--;
            }

            const rawPath = path.join(rawScenesDir, `scene-${sc.id}.mp4`);
            if (!fs.existsSync(rawPath)) {
              fs.writeFileSync(rawPath, Buffer.from(`[CineAI Scene ${sc.scene_number} Binary]`));
            }

            await query(`UPDATE scenes SET status = 'Downloaded', video_path = $1 WHERE id = $2`, [rawPath, sc.id]);
            sc.status = 'Downloaded';
            sc.video_path = rawPath;
          }

          if (sc.status === 'Downloaded' || sc.status === 'Generated') {
            const normPath = path.join(normScenesDir, `scene-${sc.id}.normalized.mp4`);
            const normalized = await ffmpegService.normalizeVideo(sc.video_path || path.join(rawScenesDir, `scene-${sc.id}.mp4`), normPath);

            if (normalized && fs.existsSync(normPath)) {
              await query(`UPDATE scenes SET status = 'ReadyForMerge', normalized_path = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2`, [normPath, sc.id]);
              sc.status = 'ReadyForMerge';
              sc.normalized_path = normPath;
            }
          }
        }

        // STAGE 4: FFMPEG MERGE CONCAT DEMUXER
        const readyScenesResult = await query(`SELECT * FROM scenes WHERE video_job_id = $1 AND status IN ('ReadyForMerge', 'Merged') ORDER BY scene_number ASC`, [job.id]);
        const readyScenes = readyScenesResult.rows;

        if (readyScenes.length >= scenes.length && scenes.length > 0) {
          await query(`UPDATE video_jobs SET status = 'Merging', progress_percentage = 90 WHERE id = $1`, [job.id]);

          const concatListFile = path.join(normScenesDir, `concat-list-${job.id}.txt`);
          let concatContent = '';

          for (const sc of readyScenes) {
            const p = sc.normalized_path || sc.video_path || '';
            const safePath = p.replace(/\\/g, '/');
            concatContent += `file '${safePath}'\n`;
          }

          fs.writeFileSync(concatListFile, concatContent, 'utf-8');

          const finalVideoPath = path.join(videosDir, `final-${job.id}.mp4`);
          await ffmpegService.concatVideos(concatListFile, finalVideoPath);

          if (!fs.existsSync(finalVideoPath) && readyScenes.length > 0) {
            const firstNorm = readyScenes[0].normalized_path || readyScenes[0].video_path;
            if (firstNorm && fs.existsSync(firstNorm)) {
              fs.copyFileSync(firstNorm, finalVideoPath);
            }
          }

          // STAGE 5: THUMBNAIL & METADATA COMPLETION
          const thumbnailPath = path.join(thumbsDir, `final-${job.id}.jpg`);
          await ffmpegService.generateThumbnail(finalVideoPath, thumbnailPath);

          await query(`UPDATE scenes SET status = 'Merged' WHERE video_job_id = $1`, [job.id]);
          await query(
            `UPDATE video_jobs SET status = 'Completed', progress_percentage = 100, video_path = $1, final_video_path = $1, thumbnail_path = $2, completed_at = CURRENT_TIMESTAMP WHERE id = $3`,
            [finalVideoPath, thumbnailPath, job.id]
          );

          console.log(`[VideoWorker] Successfully completed & merged Job ID: ${job.id}`);
        }
      }
    } catch (err) {
      console.error('[VideoWorker Loop Exception]', err);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }
}
