import { Request, Response } from 'express';
import { geminiService } from '../services/geminiService.js';

export async function refinePrompt(req: Request, res: Response) {
  const { rawPrompt, style } = req.body;
  const result = await geminiService.refinePrompt({ rawPrompt, style });
  return res.status(200).json(result);
}

export async function orchestrateDirector(req: Request, res: Response) {
  const { idea, targetDuration, aspectRatio, style } = req.body;
  const result = await geminiService.orchestrateDirector({ idea, targetDuration, aspectRatio, style });
  return res.status(200).json(result);
}
