import { Request, Response } from 'express';
import { query } from '../db/index.js';

export async function getUserCredit(req: Request, res: Response) {
  const userId = req.params.userId ? String(req.params.userId) : '11111111-1111-1111-1111-111111111111';
  const targetUser = userId;

  try {
    const result = await query(`SELECT user_id as "userId", balance FROM credits WHERE user_id = $1`, [targetUser]);
    if (result.rows.length === 0) {
      await query(`INSERT INTO credits (id, user_id, balance, updated_at) VALUES (gen_random_uuid(), $1, 500, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING`, [targetUser]);
      return res.status(200).json({ userId: targetUser, balance: 500 });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('[getUserCredit Error]', err);
    return res.status(200).json({ userId: targetUser, balance: 500 });
  }
}
