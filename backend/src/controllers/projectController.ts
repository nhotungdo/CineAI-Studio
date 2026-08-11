import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import path from 'path';

export async function getProjects(req: Request, res: Response) {
  try {
    const result = await query(
      `SELECT p.id, p.title, p.description, p.aspect_ratio as "aspectRatio", p.style, p.target_duration as "targetDuration",
              vj.id as "jobId", vj.status as "jobStatus"
       FROM projects p
       LEFT JOIN LATERAL (
         SELECT id, status FROM video_jobs WHERE project_id = p.id ORDER BY created_at DESC LIMIT 1
       ) vj ON true
       ORDER BY p.created_at DESC`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[getProjects Error]', err);
    return res.status(500).json([]);
  }
}


export async function getProjectById(req: Request, res: Response) {
  const id = String(req.params.id);
  try {
    const projRes = await query(
      `SELECT p.id, p.title, p.description, p.aspect_ratio as "aspectRatio", p.style, p.target_duration as "targetDuration",
              vj.id as "jobId", vj.status as "jobStatus", vj.progress_percentage as "progressPercentage",
              vj.final_video_path as "finalVideoPath", vj.thumbnail_path as "thumbnailPath"
       FROM projects p
       LEFT JOIN LATERAL (
         SELECT id, status, progress_percentage, final_video_path, thumbnail_path
         FROM video_jobs WHERE project_id = p.id ORDER BY created_at DESC LIMIT 1
       ) vj ON true
       WHERE p.id = $1`,
      [id]
    );
    if (projRes.rows.length === 0) {
      return res.status(404).json(null);
    }

    const proj = projRes.rows[0];
    const scenesRes = await query(
      `SELECT id, scene_number as "sceneNumber", duration, prompt, camera_movement as "cameraMovement", lighting_style as "lightingStyle", status
       FROM scenes WHERE project_id = $1 ORDER BY scene_number ASC`,
      [id]
    );

    let finalVideoUrl: string | null = null;
    if (proj.finalVideoPath) {
      finalVideoUrl = `http://localhost:5000/storage/videos/${path.basename(proj.finalVideoPath)}`;
    }

    let thumbnailUrl: string | null = null;
    if (proj.thumbnailPath) {
      thumbnailUrl = `http://localhost:5000/storage/thumbnails/${path.basename(proj.thumbnailPath)}`;
    }

    return res.status(200).json({
      ...proj,
      finalVideoUrl,
      thumbnailUrl,
      scenes: scenesRes.rows
    });
  } catch (err) {
    console.error('[getProjectById Error]', err);
    return res.status(500).json(null);
  }
}

export async function createProject(req: Request, res: Response) {
  const { title, description, aspectRatio, style, targetDuration, scenes, prompt } = req.body;
  const projectId = uuidv4();
  const jobId = uuidv4();
  const defaultUserId = '11111111-1111-1111-1111-111111111111';

  try {
    // 1. Create project
    await query(
      `INSERT INTO projects (id, user_id, title, description, aspect_ratio, style, target_duration, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [projectId, defaultUserId, title || 'New AI Project', description || '', aspectRatio || '9:16', style || 'cinematic', targetDuration || 30]
    );

    // 2. Insert scenes if provided
    if (Array.isArray(scenes)) {
      for (const sc of scenes) {
        const sceneId = uuidv4();
        await query(
          `INSERT INTO scenes (id, project_id, scene_number, duration, prompt, camera_movement, lighting_style, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
          [sceneId, projectId, sc.sceneNumber || 1, sc.duration || 5, sc.prompt || '', sc.cameraMovement || 'slow dolly in', sc.lightingStyle || 'neon cinematic']
        );
      }
    }

    // 3. Auto-create video_job linked to this project
    const jobPrompt = prompt || title || 'AI Cinematic Video';
    await query(
      `INSERT INTO video_jobs (id, user_id, project_id, prompt, model, job_type, status, progress_percentage, total_scenes, created_at)
       VALUES ($1, $2, $3, $4, 'veo-2.0-generate-001', 'VeoMultiSceneGeneration', 'Queued', 0, $5, CURRENT_TIMESTAMP)`,
      [jobId, defaultUserId, projectId, jobPrompt, scenes?.length || 3]
    );

    console.log(`[createProject] Created project ${projectId} with auto video_job ${jobId}`);
    return res.status(200).json({ id: projectId, jobId, title, description });
  } catch (err) {
    console.error('[createProject Error]', err);
    return res.status(500).json({ id: projectId, jobId, title });
  }
}

