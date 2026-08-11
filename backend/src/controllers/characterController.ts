import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';

export async function getCharacters(req: Request, res: Response) {
  try {
    const result = await query(`SELECT id, name, age, gender, appearance, clothing, reference_images as "referenceImagesJson" FROM characters ORDER BY created_at DESC`);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[getCharacters Error]', err);
    return res.status(500).json([]);
  }
}

export async function createCharacter(req: Request, res: Response) {
  const { name, age, gender, appearance, clothing, referenceImagesJson, projectId } = req.body;
  const charId = uuidv4();
  const projId = projectId || '22222222-2222-2222-2222-222222222222';

  try {
    await query(
      `INSERT INTO characters (id, project_id, name, age, gender, appearance, clothing, reference_images, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
      [charId, projId, name, age || 25, gender || 'Male', appearance || '', clothing || '', referenceImagesJson || '[]']
    );

    return res.status(200).json({ id: charId, name, age, gender });
  } catch (err) {
    console.error('[createCharacter Error]', err);
    return res.status(500).json({ id: charId, name });
  }
}
