import { Request, Response } from 'express';
import { geminiService } from '../services/geminiService.js';

export async function refinePrompt(req: Request, res: Response) {
  try {
    const { rawPrompt, style } = req.body;
    const result = await geminiService.refinePrompt({ rawPrompt, style });
    return res.status(200).json(result);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[refinePrompt Error]', errMsg);
    return res.status(500).json({ message: 'Failed to refine prompt', error: errMsg });
  }
}

export async function orchestrateDirector(req: Request, res: Response) {
  try {
    const { idea, targetDuration, aspectRatio, style } = req.body;
    const result = await geminiService.orchestrateDirector({ idea, targetDuration, aspectRatio, style });
    return res.status(200).json(result);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[orchestrateDirector Error]', errMsg);
    return res.status(500).json({ message: 'Failed to orchestrate director', error: errMsg });
  }
}
