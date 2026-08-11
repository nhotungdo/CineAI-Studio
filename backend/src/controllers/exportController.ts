import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';

export async function getExports(req: Request, res: Response) {
  try {
    const result = await query(
      `SELECT e.id, e.final_video_url as "finalVideoUrl", e.resolution, e.file_size_bytes as "fileSizeBytes", e.created_at as "createdAt", p.title as "projectTitle"
       FROM exports e LEFT JOIN projects p ON e.project_id = p.id ORDER BY e.created_at DESC`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[getExports Error]', err);
    return res.status(200).json([]);
  }
}

export async function createExport(req: Request, res: Response) {
  const { projectId, finalVideoUrl, resolution, fileSizeBytes } = req.body;
  const exportId = uuidv4();
  const projId = projectId || '22222222-2222-2222-2222-222222222222';

  try {
    await query(
      `INSERT INTO exports (id, project_id, final_video_url, resolution, file_size_bytes, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [exportId, projId, finalVideoUrl || '', resolution || '1080p', fileSizeBytes || 0]
    );

    return res.status(200).json({ id: exportId, finalVideoUrl });
  } catch (err) {
    console.error('[createExport Error]', err);
    return res.status(500).json({ id: exportId });
  }
}
