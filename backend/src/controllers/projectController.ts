import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';

export async function getProjects(req: Request, res: Response) {
  try {
    const result = await query(`SELECT id, title, description, aspect_ratio as "aspectRatio", style, target_duration as "targetDuration" FROM projects ORDER BY created_at DESC`);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[getProjects Error]', err);
    return res.status(500).json([]);
  }
}

export async function getProjectById(req: Request, res: Response) {
  const id = String(req.params.id);
  try {
    const projRes = await query(`SELECT id, title, description, aspect_ratio as "aspectRatio", style, target_duration as "targetDuration" FROM projects WHERE id = $1`, [id]);
    if (projRes.rows.length === 0) {
      return res.status(404).json(null);
    }

    const proj = projRes.rows[0];
    const scenesRes = await query(`SELECT id, scene_number as "sceneNumber", duration, prompt, camera_movement as "cameraMovement", lighting_style as "lightingStyle" FROM scenes WHERE project_id = $1 ORDER BY scene_number ASC`, [id]);
    
    return res.status(200).json({
      ...proj,
      scenes: scenesRes.rows
    });
  } catch (err) {
    console.error('[getProjectById Error]', err);
    return res.status(500).json(null);
  }
}

export async function createProject(req: Request, res: Response) {
  const { title, description, aspectRatio, style, targetDuration, scenes } = req.body;
  const projectId = uuidv4();
  const defaultUserId = '11111111-1111-1111-1111-111111111111';

  try {
    await query(
      `INSERT INTO projects (id, user_id, title, description, aspect_ratio, style, target_duration, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [projectId, defaultUserId, title || 'New AI Project', description || '', aspectRatio || '9:16', style || 'cinematic', targetDuration || 30]
    );

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

    return res.status(200).json({ id: projectId, title, description });
  } catch (err) {
    console.error('[createProject Error]', err);
    return res.status(500).json({ id: projectId, title });
  }
}
