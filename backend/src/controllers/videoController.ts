import { Request, Response } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { veoService } from '../services/veoService.js';

export async function startGeneration(req: Request, res: Response) {
  const { prompt, model, aspectRatio, durationSeconds } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ message: 'Prompt is required for video generation.' });
  }

  const jobId = uuidv4();
  const defaultUserId = '11111111-1111-1111-1111-111111111111';
  const defaultProjectId = '22222222-2222-2222-2222-222222222222';
  const modelToUse = model || 'google/veo-3.1-fast';

  await query(
    `INSERT INTO video_jobs (id, user_id, project_id, prompt, model, job_type, status, progress_percentage, created_at)
     VALUES ($1, $2, $3, $4, $5, 'VeoVideoGeneration', 'Queued', 0, CURRENT_TIMESTAMP)`,
    [jobId, defaultUserId, defaultProjectId, prompt, modelToUse]
  );

  const veoResp = await veoService.startGeneration({ prompt, model: modelToUse, aspectRatio, durationSeconds });
  if (veoResp && veoResp.operationId) {
    await query(`UPDATE video_jobs SET operation_id = $1 WHERE id = $2`, [veoResp.operationId, jobId]);
  }

  return res.status(200).json({
    jobId,
    operationId: veoResp?.operationId,
    status: 'Pending',
    message: 'Video generation job created successfully.'
  });
}

export async function startMultiSceneGeneration(req: Request, res: Response) {
  const { prompt, model } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ message: 'Prompt is required for multi-scene generation.' });
  }

  const jobId = uuidv4();
  const defaultUserId = '11111111-1111-1111-1111-111111111111';
  const defaultProjectId = '22222222-2222-2222-2222-222222222222';
  const modelToUse = model || 'google/veo-3.1-fast';

  await query(
    `INSERT INTO video_jobs (id, user_id, project_id, prompt, model, job_type, status, progress_percentage, created_at)
     VALUES ($1, $2, $3, $4, $5, 'VeoMultiSceneGeneration', 'Queued', 0, CURRENT_TIMESTAMP)`,
    [jobId, defaultUserId, defaultProjectId, prompt, modelToUse]
  );

  return res.status(200).json({
    jobId,
    status: 'Queued',
    message: 'Multi-scene video generation pipeline queued successfully.'
  });
}

export async function getJobStatus(req: Request, res: Response) {
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
    videoUrl = `/storage/videos/${fileName}`;
  }

  let thumbnailUrl: string | null = null;
  if (job.thumbnail_path) {
    const thumbName = path.basename(job.thumbnail_path);
    thumbnailUrl = `/storage/thumbnails/${thumbName}`;
  }

  const scenesResult = await query(`SELECT * FROM scenes WHERE video_job_id = $1 ORDER BY scene_number ASC`, [job.id]);
  const sceneList = scenesResult.rows.map((s) => ({
    sceneId: s.id,
    sceneNumber: s.scene_number,
    prompt: s.prompt,
    status: s.status,
    duration: s.duration,
    videoUrl: s.video_path ? `/storage/scenes/${path.basename(s.video_path)}` : null
  }));

  return res.status(200).json({
    jobId: job.id,
    operationId: job.operation_id,
    status: job.status,
    progressPercentage: job.progress_percentage,
    totalScenes: job.total_scenes || 1,
    completedScenes: job.completed_scenes || 0,
    videoUrl,
    thumbnailUrl,
    scenes: sceneList,
    errorMessage: job.error_message,
    createdAt: job.created_at,
    startedAt: job.started_at,
    completedAt: job.completed_at
  });
}

export async function getRecentJobs(req: Request, res: Response) {
  const result = await query(
    `SELECT id, prompt, status, progress_percentage, video_path, final_video_path, thumbnail_path, total_scenes, completed_scenes, created_at, completed_at
     FROM video_jobs ORDER BY created_at DESC LIMIT 20`
  );

  const jobs = result.rows.map((j) => ({
    jobId: j.id,
    prompt: j.prompt,
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
}

export async function getOperationStatus(req: Request, res: Response) {
  const operationId = String(req.params.operationId);
  const status = await veoService.checkStatus(operationId);
  return res.status(200).json(status);
}

export async function retryScene(req: Request, res: Response) {
  const jobId = String(req.params.jobId);
  const sceneId = String(req.params.sceneId);
  await query(`UPDATE scenes SET status = 'Pending', error_message = NULL WHERE id = $1 AND video_job_id = $2`, [sceneId, jobId]);
  await query(`UPDATE video_jobs SET status = 'Generating' WHERE id = $1 AND status = 'Failed'`, [jobId]);
  return res.status(200).json({ message: `Scene reset to Pending for retry.`, sceneId });
}

export async function retryMerge(req: Request, res: Response) {
  const jobId = String(req.params.jobId);
  await query(`UPDATE video_jobs SET status = 'Merging', error_message = NULL WHERE id = $1`, [jobId]);
  return res.status(200).json({ message: `Video job status reset to Merging for FFmpeg retry.`, jobId });
}

/**
 * POST /api/Video/jobs/:jobId/trigger
 * Resets a Queued/Failed job so the worker loop picks it up immediately.
 */
export async function triggerJob(req: Request, res: Response) {
  const jobId = String(req.params.jobId);
  const jobResult = await query(`SELECT id, status FROM video_jobs WHERE id = $1`, [jobId]);
  if (jobResult.rows.length === 0) {
    return res.status(404).json({ message: 'Job not found.' });
  }

  const job = jobResult.rows[0];
  // If already running, just return current status
  if (['Generating', 'Planning', 'Merging', 'Normalizing', 'Downloading'].includes(job.status)) {
    return res.status(200).json({ message: 'Job already in progress.', jobId, status: job.status });
  }

  // Reset to Queued so worker picks it up
  await query(
    `UPDATE video_jobs SET status = 'Queued', progress_percentage = 0, error_message = NULL, started_at = NULL WHERE id = $1`,
    [jobId]
  );
  return res.status(200).json({ message: 'Job triggered successfully. Worker will process shortly.', jobId });
}

/**
 * GET /api/Video/jobs/:jobId/progress
 * Returns detailed per-scene progress for real-time frontend polling.
 */
export async function getJobProgress(req: Request, res: Response) {
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
    `SELECT id, scene_number, duration, prompt, camera_movement, lighting_style, status, video_path, normalized_path, error_message
     FROM scenes WHERE video_job_id = $1 ORDER BY scene_number ASC`,
    [jobId]
  );

  const scenes = scenesResult.rows.map((s) => ({
    sceneId: s.id,
    sceneNumber: s.scene_number,
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
}
