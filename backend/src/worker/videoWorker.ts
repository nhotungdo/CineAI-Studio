import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { veoService } from '../services/veoService.js';
import { geminiService } from '../services/geminiService.js';
import { ffmpegService } from '../services/ffmpegService.js';
import { sseService } from '../services/sseService.js';
import { ttsService } from '../services/ttsService.js';
import { subtitleService } from '../services/subtitleService.js';

const POLL_INTERVAL_MS = 4000;   // 4 seconds status check
const MAX_POLLS = 60;            // Max 4 minutes per scene

export async function runWorkerLoop() {
  console.log('[VideoWorker] Node.js Asynchronous Pipeline Orchestrator Started.');

  while (true) {
    try {
      // Fetch oldest job needing processing
      const jobResult = await query(
        `SELECT id, user_id, project_id, prompt, model, video_type, duration, aspect_ratio, visual_style, language, status, progress_percentage, total_scenes, completed_scenes, script, bg_music_id, voiceover_id, subtitle_style 
         FROM video_jobs 
         WHERE status IN ('Planning', 'Generating', 'Downloading', 'Normalizing', 'Merging') 
         ORDER BY created_at ASC LIMIT 1`
      );

      if (jobResult.rows.length > 0) {
        const job = jobResult.rows[0];
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

    // ─── STAGE 1: PLANNING (Gemini 3.1 Pro AI Director) ────────────────────────
    if (job.status === 'Planning') {
      console.log(`[VideoWorker] Stage 1 (AI Director) for Job ${jobId}`);

      try {
        const directorRes = await geminiService.orchestrateDirector({
          idea: job.prompt as string,
          targetDuration: Number(job.duration) || 30,
          aspectRatio: (job.aspect_ratio as string) || '16:9',
          style: (job.visual_style as string) || 'Cinematic',
          language: (job.language as string) || 'English'
        });

        const defaultProjectId = job.project_id || '22222222-2222-2222-2222-222222222222';

        // Update Job metadata with AI Director plan
        await query(
          `UPDATE video_jobs SET 
            title = $1, concept = $2, script = $3, visual_style = $4, characters_data = $5,
            total_scenes = $6, status = 'DraftStoryboard', progress_percentage = 20
           WHERE id = $7`,
          [
            directorRes.title,
            directorRes.concept,
            JSON.stringify(directorRes.script),
            directorRes.visualStyle,
            JSON.stringify(directorRes.characters),
            directorRes.scenes.length,
            jobId
          ]
        );

        // Delete any existing scenes if re-planning
        await query(`DELETE FROM scenes WHERE video_job_id = $1`, [jobId]);

        // Insert planned scenes into database
        for (const sc of directorRes.scenes) {
          const sceneId = uuidv4();
          await query(
            `INSERT INTO scenes (
              id, project_id, video_job_id, scene_number, title, description, prompt, duration, camera_movement, lighting_style, visual_style, characters, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Pending', CURRENT_TIMESTAMP)`,
            [
              sceneId,
              defaultProjectId,
              jobId,
              sc.sceneNumber,
              sc.title || `Scene ${sc.sceneNumber}`,
              sc.description || '',
              sc.prompt,
              sc.duration || 6,
              sc.cameraMovement || 'dolly in',
              sc.lightingStyle || 'neon contrast',
              sc.visualStyle || directorRes.visualStyle,
              JSON.stringify(sc.characters || [])
            ]
          );
        }

        sseService.broadcastToJob(jobId, 'job_status_change', { jobId, status: 'DraftStoryboard', progress: 20 });
        console.log(`[VideoWorker] Planning complete: Created ${directorRes.scenes.length} scenes for Job ${jobId}. Awaiting User Review.`);
        return; // Pause execution for User Review!
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[VideoWorker] AI Director Planning failed for Job ${jobId}:`, errMsg);
        await query(`UPDATE video_jobs SET status = 'Failed', error_message = $1 WHERE id = $2`, [errMsg, jobId]);
        sseService.broadcastToJob(jobId, 'job_status_change', { jobId, status: 'Failed', error: errMsg });
        return;
      }
    }

    // ─── STAGE 2 & 3: GENERATE + DOWNLOAD + FFMPEG NORMALIZE SCENES ───────────
    if (job.status === 'Generating') {
      const scenesResult = await query(`SELECT * FROM scenes WHERE video_job_id = $1 ORDER BY scene_number ASC`, [jobId]);
      const scenes = scenesResult.rows;

      for (const sc of scenes) {
        if (sc.status === 'ReadyForMerge' || sc.status === 'Merged') {
          continue;
        }

        if (sc.status === 'Pending' || sc.status === 'Generating') {
          await query(`UPDATE scenes SET status = 'Generating', started_at = CURRENT_TIMESTAMP WHERE id = $1`, [sc.id]);
          sseService.broadcastToJob(jobId, 'scene_status_change', { jobId, sceneId: sc.id, sceneNumber: sc.scene_number, status: 'Generating' });

          try {
            // Step A: Start Veo video generation
            const veoRes = await veoService.startGeneration({
              prompt: sc.prompt,
              model: (job.model as string) || 'google/veo-3.1-fast',
              aspectRatio: (job.aspect_ratio as string) || '16:9',
              durationSeconds: Math.round(sc.duration) || 6,
            });

            const opId = veoRes.operationId;
            await query(`UPDATE scenes SET operation_id = $1 WHERE id = $2`, [opId, sc.id]);

            // Step B: Poll for operation completion
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
            }

            if (!isDone || !videoUrl) {
              throw new Error(lastError || `Scene ${sc.scene_number} video generation timed out`);
            }

            // Step C: Download clip
            const rawPath = path.join(rawScenesDir, `scene-${sc.id}.mp4`);
            console.log(`[VideoWorker] Downloading Scene ${sc.scene_number} clip...`);

            const downloaded = await veoService.downloadVideoToFile(videoUrl, rawPath);
            if (!downloaded || !fs.existsSync(rawPath)) {
              throw new Error(`Failed to download raw video clip for Scene ${sc.scene_number}`);
            }

            await query(`UPDATE scenes SET status = 'Downloaded', video_path = $1 WHERE id = $2`, [rawPath, sc.id]);
            sc.video_path = rawPath;
            sc.status = 'Downloaded';
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            console.error(`[VideoWorker] Scene ${sc.scene_number} failed:`, errMsg);
            await query(`UPDATE scenes SET status = 'Failed', error_message = $1 WHERE id = $2`, [errMsg, sc.id]);
            sseService.broadcastToJob(jobId, 'scene_status_change', { jobId, sceneId: sc.id, sceneNumber: sc.scene_number, status: 'Failed', error: errMsg });
            continue; // Failure isolation: do not stop remaining scenes!
          }
        }

        // Step D: Normalize with FFmpeg
        if (sc.status === 'Downloaded') {
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
            sseService.broadcastToJob(jobId, 'scene_status_change', { jobId, sceneId: sc.id, sceneNumber: sc.scene_number, status: 'ReadyForMerge' });
          }
        }
      }

      // Update completed scene count & total progress
      const readyRes = await query(
        `SELECT COUNT(*) as cnt FROM scenes WHERE video_job_id = $1 AND status IN ('ReadyForMerge', 'Merged')`,
        [jobId]
      );
      const readyCount = parseInt(readyRes.rows[0]?.cnt || '0', 10);
      const totalCount = scenes.length || 1;
      const pct = 20 + Math.round((readyCount / totalCount) * 65);

      await query(`UPDATE video_jobs SET completed_scenes = $1, progress_percentage = $2 WHERE id = $3`, [readyCount, pct, jobId]);
      sseService.broadcastToJob(jobId, 'progress_update', { jobId, completedScenes: readyCount, totalScenes: totalCount, progressPercentage: pct });

      // Check if all scenes are ready to merge
      if (readyCount >= totalCount) {
        await query(`UPDATE video_jobs SET status = 'Merging', progress_percentage = 85 WHERE id = $1`, [jobId]);
      }
    }

    // ─── STAGE 4: FFMPEG CONCAT MERGING ───────────────────────────────────────
    if (job.status === 'Merging') {
      console.log(`[VideoWorker] Stage 4 (FFmpeg Merge) for Job ${jobId}`);

      const readyScenesResult = await query(
        `SELECT * FROM scenes WHERE video_job_id = $1 AND status IN ('ReadyForMerge', 'Merged') ORDER BY scene_number ASC`,
        [jobId]
      );
      const readyScenes = readyScenesResult.rows;

      if (readyScenes.length === 0) {
        await query(`UPDATE video_jobs SET status = 'Failed', error_message = 'No ready scenes found for merging' WHERE id = $1`, [jobId]);
        return;
      }

      const concatListFile = path.join(normScenesDir, `concat-list-${jobId}.txt`);
      let concatContent = '';

      for (const sc of readyScenes) {
        const p = sc.normalized_path || sc.video_path || '';
        const safePath = p.replace(/\\/g, '/').replace(/'/g, "'\\''");
        concatContent += `file '${safePath}'\n`;
      }

      fs.writeFileSync(concatListFile, concatContent, 'utf-8');
      
      const mergedVideoPath = path.join(videosDir, `merged-${jobId}.mp4`);
      await ffmpegService.concatVideos(concatListFile, mergedVideoPath);

      if (!fs.existsSync(mergedVideoPath)) {
        // Fallback: copy first clip
        const firstPath = readyScenes[0].normalized_path || readyScenes[0].video_path;
        if (firstPath && fs.existsSync(firstPath)) {
          fs.copyFileSync(firstPath, mergedVideoPath);
        }
      }

      // --- Phase 2: Audio & Subtitle Generation ---
      const finalVideoPath = path.join(videosDir, `final-${jobId}.mp4`);
      let voiceoverPath: string | undefined;
      let subtitlePath: string | undefined;
      let bgMusicPath: string | undefined;
      
      // Look up background music from DB if present
      if (job.bg_music_id) {
        const bgmResult = await query(`SELECT file_path FROM audio_tracks WHERE id = $1`, [job.bg_music_id]);
        if (bgmResult.rows.length > 0) bgMusicPath = bgmResult.rows[0].file_path;
      }

      // Generate Voiceover if script exists
      const scriptData = job.script ? String(job.script) : '';
      if (scriptData && scriptData.length > 10) {
         try {
           const ttsResult = await ttsService.generateVoiceover(scriptData);
           voiceoverPath = ttsResult.audioPath;
           
           if (job.subtitle_style !== 'None') {
             subtitlePath = await subtitleService.generateSubtitles(scriptData, ttsResult.duration);
           }
         } catch (e) {
           console.error('[VideoWorker] Phase 2 TTS/Subtitle Error:', e);
         }
      }

      // Merge video with audio and subtitles
      const mixResult = await ffmpegService.mergeWithAudioAndSubtitles(mergedVideoPath, finalVideoPath, {
        bgMusicPath,
        voiceoverPath,
        subtitlePath
      });
      
      // Cleanup intermediate merge if final exists
      if (mixResult && fs.existsSync(finalVideoPath) && fs.existsSync(mergedVideoPath)) {
        fs.unlinkSync(mergedVideoPath);
      } else if (!fs.existsSync(finalVideoPath)) {
        fs.copyFileSync(mergedVideoPath, finalVideoPath);
      }

      // Generate thumbnail
      const thumbnailPath = path.join(thumbsDir, `final-${jobId}.jpg`);
      await ffmpegService.generateThumbnail(finalVideoPath, thumbnailPath);

      await query(`UPDATE scenes SET status = 'Merged' WHERE video_job_id = $1`, [jobId]);
      await query(
        `UPDATE video_jobs SET status = 'Completed', progress_percentage = 100, 
         video_path = $1, final_video_path = $1, thumbnail_path = $2, completed_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [finalVideoPath, thumbnailPath, jobId]
      );

      sseService.broadcastToJob(jobId, 'job_completed', {
        jobId,
        status: 'Completed',
        finalVideoUrl: `http://localhost:5000/storage/videos/${path.basename(finalVideoPath)}`,
        thumbnailUrl: `http://localhost:5000/storage/thumbnails/${path.basename(thumbnailPath)}`
      });

      console.log(`[VideoWorker] ✅ Job ${jobId} Completed Successfully!`);
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[VideoWorker Fatal Exception] Job ${jobId} error:`, errMsg);
    await query(`UPDATE video_jobs SET status = 'Failed', error_message = $1 WHERE id = $2`, [errMsg, jobId]).catch(() => {});
  }
}
