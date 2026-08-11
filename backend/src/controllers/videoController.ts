import { Request, Response } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { veoService } from '../services/veoService.js';
import { geminiService } from '../services/geminiService.js';
import { sseService } from '../services/sseService.js';

async function ensureDefaultUserAndProject() {
  const defaultUserId = '11111111-1111-1111-1111-111111111111';
  const defaultProjectId = '22222222-2222-2222-2222-222222222222';
  try {
    await query(
      `INSERT INTO users (id, email, password_hash, full_name)
       VALUES ($1, 'demo@cineai.studio', 'hashed_pass_placeholder', 'CineAI Studio Demo User')
       ON CONFLICT (id) DO NOTHING`,
      [defaultUserId]
    );
    await query(
      `INSERT INTO projects (id, user_id, title, description, aspect_ratio, style, target_duration)
       VALUES ($1, $2, 'Hanoi After Dark', 'Demo Project', '9:16', 'cinematic', 30)
       ON CONFLICT (id) DO NOTHING`,
      [defaultProjectId, defaultUserId]
    );
  } catch (err) {
    console.error('[ensureDefaultUserAndProject Error]', err);
  }
}

/**
 * POST /api/Video/create-pipeline
 * Step 3: Initialize Video Creation in 'Planning' status
 */
export async function createPipeline(req: Request, res: Response) {
  try {
    const {
      prompt,
      videoType = 'cinematic',
      duration = 30,
      aspectRatio = '16:9',
      resolution = '1080p',
      visualStyle = 'Cinematic',
      language = 'English'
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ message: 'Prompt is required for video generation.' });
    }

    await ensureDefaultUserAndProject();

    const jobId = uuidv4();
    const defaultUserId = '11111111-1111-1111-1111-111111111111';
    const defaultProjectId = '22222222-2222-2222-2222-222222222222';

    await query(
      `INSERT INTO video_jobs (
        id, user_id, project_id, prompt, video_type, duration, aspect_ratio, resolution, visual_style, language, status, progress_percentage, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Planning', 0, CURRENT_TIMESTAMP)`,
      [jobId, defaultUserId, defaultProjectId, prompt, videoType, duration, aspectRatio, resolution, visualStyle, language]
    );

    return res.status(200).json({
      jobId,
      status: 'Planning',
      message: 'Video creation pipeline initialized in Planning status.'
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[createPipeline Error]', errMsg);
    return res.status(500).json({ message: 'Failed to initialize pipeline', error: errMsg });
  }
}

/**
 * GET /api/Video/jobs/:jobId/storyboard
 * Step 5 & 6: Retrieve VideoPlan details & Storyboard for User Review
 */
export async function getJobStoryboard(req: Request, res: Response) {
  try {
    const jobId = String(req.params.jobId);
    const jobRes = await query(`SELECT * FROM video_jobs WHERE id = $1`, [jobId]);

    if (jobRes.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    const job = jobRes.rows[0];
    const scenesRes = await query(
      `SELECT * FROM scenes WHERE video_job_id = $1 ORDER BY scene_number ASC`,
      [jobId]
    );

    const scenes = scenesRes.rows.map((s) => ({
      sceneId: s.id,
      sceneNumber: s.scene_number,
      title: s.title || `Scene ${s.scene_number}`,
      description: s.description || '',
      prompt: s.prompt,
      duration: s.duration,
      cameraMovement: s.camera_movement || 'dolly in',
      lightingStyle: s.lighting_style || 'neon cinematic',
      visualStyle: s.visual_style || job.visual_style,
      characters: s.characters || [],
      status: s.status,
      videoUrl: s.video_path ? `http://localhost:5000/storage/scenes/${path.basename(s.video_path)}` : null,
      errorMessage: s.error_message
    }));

    return res.status(200).json({
      jobId: job.id,
      status: job.status,
      prompt: job.prompt,
      title: job.title || 'AI Production Storyboard',
      concept: job.concept || '',
      script: job.script || '',
      visualStyle: job.visual_style || 'Cinematic',
      characters: job.characters_data || [],
      aspectRatio: job.aspect_ratio || '16:9',
      duration: job.duration || 30,
      resolution: job.resolution || '1080p',
      totalScenes: scenes.length,
      scenes
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[getJobStoryboard Error]', errMsg);
    return res.status(500).json({ message: 'Failed to fetch storyboard', error: errMsg });
  }
}

/**
 * PUT /api/Video/jobs/:jobId/storyboard/scenes/:sceneId
 * Edit single scene attributes during User Review
 */
export async function updateScene(req: Request, res: Response) {
  try {
    const jobId = String(req.params.jobId);
    const sceneId = String(req.params.sceneId);
    const { prompt, cameraMovement, lightingStyle, duration, title, description } = req.body;

    await query(
      `UPDATE scenes SET
        prompt = COALESCE($1, prompt),
        camera_movement = COALESCE($2, camera_movement),
        lighting_style = COALESCE($3, lighting_style),
        duration = COALESCE($4, duration),
        title = COALESCE($5, title),
        description = COALESCE($6, description)
       WHERE id = $7 AND video_job_id = $8`,
      [prompt, cameraMovement, lightingStyle, duration, title, description, sceneId, jobId]
    );

    return res.status(200).json({ message: 'Scene updated successfully.', sceneId });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[updateScene Error]', errMsg);
    return res.status(500).json({ message: 'Failed to update scene', error: errMsg });
  }
}

/**
 * DELETE /api/Video/jobs/:jobId/storyboard/scenes/:sceneId
 * Delete scene during User Review
 */
export async function deleteScene(req: Request, res: Response) {
  try {
    const jobId = String(req.params.jobId);
    const sceneId = String(req.params.sceneId);

    await query(`DELETE FROM scenes WHERE id = $1 AND video_job_id = $2`, [sceneId, jobId]);

    // Reorder remaining scenes
    const scenesRes = await query(`SELECT id FROM scenes WHERE video_job_id = $1 ORDER BY scene_number ASC`, [jobId]);
    for (let i = 0; i < scenesRes.rows.length; i++) {
      await query(`UPDATE scenes SET scene_number = $1 WHERE id = $2`, [i + 1, scenesRes.rows[i].id]);
    }
    await query(`UPDATE video_jobs SET total_scenes = $1 WHERE id = $2`, [scenesRes.rows.length, jobId]);

    return res.status(200).json({ message: 'Scene deleted and sequence updated.' });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[deleteScene Error]', errMsg);
    return res.status(500).json({ message: 'Failed to delete scene', error: errMsg });
  }
}

/**
 * POST /api/Video/jobs/:jobId/storyboard/scenes
 * Add / Duplicate Scene during User Review
 */
export async function addScene(req: Request, res: Response) {
  try {
    const jobId = String(req.params.jobId);
    const { title, description, prompt, duration = 6, cameraMovement = 'dolly in', lightingStyle = 'neon' } = req.body;

    const countRes = await query(`SELECT COUNT(*) as count FROM scenes WHERE video_job_id = $1`, [jobId]);
    const nextSeq = parseInt(countRes.rows[0].count, 10) + 1;
    const newSceneId = uuidv4();
    const defaultProjectId = '22222222-2222-2222-2222-222222222222';

    await query(
      `INSERT INTO scenes (id, project_id, video_job_id, scene_number, title, description, prompt, duration, camera_movement, lighting_style, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending')`,
      [newSceneId, defaultProjectId, jobId, nextSeq, title || `Scene ${nextSeq}`, description || '', prompt || 'Cinematic scene prompt', duration, cameraMovement, lightingStyle]
    );

    await query(`UPDATE video_jobs SET total_scenes = $1 WHERE id = $2`, [nextSeq, jobId]);

    return res.status(200).json({ message: 'Scene added successfully.', sceneId: newSceneId });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[addScene Error]', errMsg);
    return res.status(500).json({ message: 'Failed to add scene', error: errMsg });
  }
}

/**
 * PUT /api/Video/jobs/:jobId/storyboard/reorder
 * Reorder scenes array
 */
export async function reorderScenes(req: Request, res: Response) {
  try {
    const jobId = String(req.params.jobId);
    const { sceneOrders } = req.body; // Array of { sceneId, sceneNumber }

    if (Array.isArray(sceneOrders)) {
      for (const item of sceneOrders) {
        await query(`UPDATE scenes SET scene_number = $1 WHERE id = $2 AND video_job_id = $3`, [item.sceneNumber, item.sceneId, jobId]);
      }
    }

    return res.status(200).json({ message: 'Scenes reordered successfully.' });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[reorderScenes Error]', errMsg);
    return res.status(500).json({ message: 'Failed to reorder scenes', error: errMsg });
  }
}

/**
 * POST /api/Video/jobs/:jobId/storyboard/scenes/:sceneId/regenerate
 * Regenerate single scene prompt via Gemini 3.1 Pro
 */
export async function regenerateScenePrompt(req: Request, res: Response) {
  try {
    const jobId = String(req.params.jobId);
    const sceneId = String(req.params.sceneId);
    const { feedback } = req.body;

    const sceneRes = await query(`SELECT * FROM scenes WHERE id = $1 AND video_job_id = $2`, [sceneId, jobId]);
    if (sceneRes.rows.length === 0) {
      return res.status(404).json({ message: 'Scene not found.' });
    }

    const sc = sceneRes.rows[0];
    const regenerated = await geminiService.regenerateScenePrompt({
      prompt: sc.prompt,
      cameraMovement: sc.camera_movement,
      lightingStyle: sc.lighting_style,
      feedback
    });

    await query(
      `UPDATE scenes SET prompt = $1, camera_movement = $2, lighting_style = $3 WHERE id = $4`,
      [regenerated.prompt, regenerated.cameraMovement, regenerated.lightingStyle, sceneId]
    );

    return res.status(200).json({
      message: 'Scene prompt regenerated.',
      sceneId,
      prompt: regenerated.prompt,
      cameraMovement: regenerated.cameraMovement,
      lightingStyle: regenerated.lightingStyle
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[regenerateScenePrompt Error]', errMsg);
    return res.status(500).json({ message: 'Failed to regenerate prompt', error: errMsg });
  }
}

/**
 * POST /api/Video/jobs/:jobId/approve-storyboard
 * Step 6: User Approves Storyboard -> Triggers Video AI Generation
 */
export async function approveStoryboard(req: Request, res: Response) {
  try {
    const jobId = String(req.params.jobId);
    await query(
      `UPDATE video_jobs SET status = 'Generating', started_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [jobId]
    );

    sseService.broadcastToJob(jobId, 'job_status_change', { jobId, status: 'Generating' });

    return res.status(200).json({
      jobId,
      status: 'Generating',
      message: 'Storyboard approved. Video generation initiated.'
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[approveStoryboard Error]', errMsg);
    return res.status(500).json({ message: 'Failed to approve storyboard', error: errMsg });
  }
}

/**
 * Legacy startGeneration for single-clip
 */
export async function startGeneration(req: Request, res: Response) {
  try {
    const { prompt, model, aspectRatio, durationSeconds } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ message: 'Prompt is required for video generation.' });
    }

    await ensureDefaultUserAndProject();

    const jobId = uuidv4();
    const defaultUserId = '11111111-1111-1111-1111-111111111111';
    const defaultProjectId = '22222222-2222-2222-2222-222222222222';
    const modelToUse = model || 'google/veo-3.1-fast';

    await query(
      `INSERT INTO video_jobs (id, user_id, project_id, prompt, model, job_type, status, progress_percentage, created_at)
       VALUES ($1, $2, $3, $4, $5, 'VeoVideoGeneration', 'Generating', 0, CURRENT_TIMESTAMP)`,
      [jobId, defaultUserId, defaultProjectId, prompt, modelToUse]
    );

    const veoResp = await veoService.startGeneration({ prompt, model: modelToUse, aspectRatio, durationSeconds });
    if (veoResp && veoResp.operationId) {
      await query(`UPDATE video_jobs SET operation_id = $1 WHERE id = $2`, [veoResp.operationId, jobId]);
    }

    return res.status(200).json({
      jobId,
      operationId: veoResp?.operationId,
      status: 'Generating',
      message: 'Video generation job created successfully.'
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[startGeneration Error]', errMsg);
    return res.status(500).json({ message: 'Failed to start generation', error: errMsg });
  }
}

export async function getJobStatus(req: Request, res: Response) {
  try {
    const jobId = String(req.params.jobId);
    const jobResult = await query(`SELECT * FROM video_jobs WHERE id = $1`, [jobId]);

    if (jobResult.rows.length === 0) {
      const directStatus = await veoService.checkStatus(jobId);
      return res.status(200).json({
        jobId,
        status: directStatus.isDone ? 'Completed' : 'Processing',
        progressPercentage: directStatus.progressPercentage,
        videoUrl: directStatus.videoUrl,
        errorMessage: directStatus.errorMessage
      });
    }

    const job = jobResult.rows[0];
    let videoUrl: string | null = null;
    if (job.final_video_path || job.video_path) {
      const fileName = path.basename(job.final_video_path || job.video_path);
      videoUrl = `http://localhost:5000/storage/videos/${fileName}`;
    }

    let thumbnailUrl: string | null = null;
    if (job.thumbnail_path) {
      const thumbName = path.basename(job.thumbnail_path);
      thumbnailUrl = `http://localhost:5000/storage/thumbnails/${thumbName}`;
    }

    const scenesResult = await query(`SELECT * FROM scenes WHERE video_job_id = $1 ORDER BY scene_number ASC`, [job.id]);
    const sceneList = scenesResult.rows.map((s) => ({
      sceneId: s.id,
      sceneNumber: s.scene_number,
      title: s.title,
      description: s.description,
      prompt: s.prompt,
      status: s.status,
      duration: s.duration,
      videoUrl: s.video_path ? `http://localhost:5000/storage/scenes/${path.basename(s.video_path)}` : null,
      errorMessage: s.error_message
    }));

    return res.status(200).json({
      jobId: job.id,
      operationId: job.operation_id,
      status: job.status,
      progressPercentage: job.progress_percentage,
      totalScenes: job.total_scenes || 0,
      completedScenes: job.completed_scenes || 0,
      videoUrl,
      thumbnailUrl,
      scenes: sceneList,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[getJobStatus Error]', errMsg);
    return res.status(500).json({ message: 'Failed to get job status', error: errMsg });
  }
}

export async function getJobProgress(req: Request, res: Response) {
  try {
    const jobId = String(req.params.jobId);
    const jobResult = await query(`SELECT * FROM video_jobs WHERE id = $1`, [jobId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    const job = jobResult.rows[0];

    let finalVideoUrl: string | null = null;
    if (job.final_video_path) {
      const fileName = path.basename(job.final_video_path);
      finalVideoUrl = `http://localhost:5000/storage/videos/${fileName}`;
    }

    let thumbnailUrl: string | null = null;
    if (job.thumbnail_path) {
      const thumbName = path.basename(job.thumbnail_path);
      thumbnailUrl = `http://localhost:5000/storage/thumbnails/${thumbName}`;
    }

    const scenesResult = await query(
      `SELECT id, scene_number, title, description, duration, prompt, camera_movement, lighting_style, status, video_path, normalized_path, error_message
       FROM scenes WHERE video_job_id = $1 ORDER BY scene_number ASC`,
      [jobId]
    );

    const scenes = scenesResult.rows.map((s) => ({
      sceneId: s.id,
      sceneNumber: s.scene_number,
      title: s.title || `Scene ${s.scene_number}`,
      description: s.description || '',
      duration: s.duration,
      prompt: s.prompt,
      cameraMovement: s.camera_movement,
      lightingStyle: s.lighting_style,
      status: s.status,
      errorMessage: s.error_message,
      videoUrl: s.video_path ? `http://localhost:5000/storage/scenes/${path.basename(s.video_path)}` : null,
    }));

    return res.status(200).json({
      jobId: job.id,
      status: job.status,
      progressPercentage: job.progress_percentage || 0,
      totalScenes: job.total_scenes || 0,
      completedScenes: job.completed_scenes || 0,
      finalVideoUrl,
      thumbnailUrl,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      scenes,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[getJobProgress Error]', errMsg);
    return res.status(500).json({ message: 'Failed to get job progress', error: errMsg });
  }
}

export async function getRecentJobs(req: Request, res: Response) {
  try {
    const result = await query(
      `SELECT id, prompt, title, status, progress_percentage, video_path, final_video_path, thumbnail_path, total_scenes, completed_scenes, created_at, completed_at
       FROM video_jobs ORDER BY created_at DESC LIMIT 20`
    );

    const jobs = result.rows.map((j) => ({
      jobId: j.id,
      prompt: j.prompt,
      title: j.title || j.prompt.substring(0, 30),
      status: j.status,
      progressPercentage: j.progress_percentage || 0,
      totalScenes: j.total_scenes || 0,
      completedScenes: j.completed_scenes || 0,
      finalVideoUrl: j.final_video_path ? `http://localhost:5000/storage/videos/${path.basename(j.final_video_path)}` : null,
      thumbnailUrl: j.thumbnail_path ? `http://localhost:5000/storage/thumbnails/${path.basename(j.thumbnail_path)}` : null,
      createdAt: j.created_at,
      completedAt: j.completed_at,
    }));

    return res.status(200).json(jobs);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[getRecentJobs Error]', errMsg);
    return res.status(500).json([]);
  }
}

export async function retryScene(req: Request, res: Response) {
  try {
    const jobId = String(req.params.jobId);
    const sceneId = String(req.params.sceneId);
    await query(`UPDATE scenes SET status = 'Pending', error_message = NULL WHERE id = $1 AND video_job_id = $2`, [sceneId, jobId]);
    await query(`UPDATE video_jobs SET status = 'Generating' WHERE id = $1`, [jobId]);
    return res.status(200).json({ message: `Scene reset to Pending for retry.`, sceneId });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[retryScene Error]', errMsg);
    return res.status(500).json({ message: 'Failed to retry scene', error: errMsg });
  }
}

/**
 * PUT /api/Video/jobs/:jobId/audio-settings
 * Update audio track and subtitle preferences
 */
export async function updateAudioSettings(req: Request, res: Response) {
  try {
    const jobId = String(req.params.jobId);
    const { bgMusicId, bgMusicVolume, voiceoverId, voiceoverVolume, subtitleStyle } = req.body;
    
    await query(
      `UPDATE video_jobs SET 
        bg_music_id = $1, bg_music_volume = $2, 
        voiceover_id = $3, voiceover_volume = $4, 
        subtitle_style = $5
       WHERE id = $6`,
      [bgMusicId || null, bgMusicVolume ?? 0.5, voiceoverId || null, voiceoverVolume ?? 1.0, subtitleStyle || 'Cinematic', jobId]
    );

    return res.status(200).json({ message: 'Audio settings updated successfully.' });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[updateAudioSettings Error]', errMsg);
    return res.status(500).json({ message: 'Failed to update audio settings', error: errMsg });
  }
}

/**
 * Timeline Editor re-render endpoint
 */
export async function reRenderPipeline(req: Request, res: Response) {
  try {
    const jobId = String(req.params.jobId);
    await query(`UPDATE video_jobs SET status = 'Merging', progress_percentage = 90, error_message = NULL WHERE id = $1`, [jobId]);
    return res.status(200).json({ message: 'Re-render triggered successfully.', jobId });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[reRenderPipeline Error]', errMsg);
    return res.status(500).json({ message: 'Failed to re-render pipeline', error: errMsg });
  }
}

/**
 * POST /api/Video/jobs/:jobId/trigger
 * Trigger a queued or draft job to start generating
 */
export async function triggerPipeline(req: Request, res: Response) {
  try {
    const jobId = String(req.params.jobId);
    await query(
      `UPDATE video_jobs SET status = 'Generating', started_at = CURRENT_TIMESTAMP WHERE id = $1 AND status IN ('Queued', 'DraftStoryboard', 'Planning', 'Failed')`,
      [jobId]
    );

    sseService.broadcastToJob(jobId, 'job_status_change', { jobId, status: 'Generating' });

    return res.status(200).json({
      jobId,
      status: 'Generating',
      message: 'Job triggered successfully.'
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[triggerPipeline Error]', errMsg);
    return res.status(500).json({ message: 'Failed to trigger pipeline', error: errMsg });
  }
}

/**
 * SSE Progress Events Stream
 */
export async function sseEvents(req: Request, res: Response) {
  const jobId = String(req.params.jobId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = uuidv4();
  sseService.addClient(clientId, jobId, res);
}
