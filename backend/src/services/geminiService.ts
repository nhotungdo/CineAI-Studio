import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

export interface PromptRefineRequest {
  rawPrompt: string;
  style?: string;
}

export interface PromptRefineResult {
  originalPrompt: string;
  refinedPrompt: string;
  suggestedCameraMovement: string;
  suggestedLighting: string;
  keyKeywords: string[];
}

export interface DirectorRequest {
  idea: string;
  targetDuration?: number;
  aspectRatio?: string;
  style?: string;
}

export interface ScenePromptResult {
  sceneNumber: number;
  duration: number;
  prompt: string;
  cameraMovement: string;
  lightingStyle: string;
}

export interface DirectorResponse {
  title: string;
  genre: string;
  audience: string;
  duration: number;
  hook: string;
  script: {
    title: string;
    genre: string;
    logline: string;
    fullText: string;
  };
  storyboard: {
    title: string;
    summary: string;
    scenes: ScenePromptResult[];
  };
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
  }

  async refinePrompt(req: PromptRefineRequest): Promise<PromptRefineResult> {
    if (!req.rawPrompt || !req.rawPrompt.trim()) {
      return {
        originalPrompt: '',
        refinedPrompt: '',
        suggestedCameraMovement: '',
        suggestedLighting: '',
        keyKeywords: []
      };
    }

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: this.modelName });
        const prompt = `You are an elite AI Video Director for Google Veo 3.1. Transform this raw video prompt into a highly detailed cinematic prompt for Veo 3.1:
Raw Idea: "${req.rawPrompt}"
Style: "${req.style || 'cinematic'}"

Return JSON:
{
  "refinedPrompt": "Ultra-cinematic photorealistic video of...",
  "suggestedCameraMovement": "slow dolly forward",
  "suggestedLighting": "neon volumetric lighting"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const cleanedJson = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        return {
          originalPrompt: req.rawPrompt,
          refinedPrompt: parsed.refinedPrompt || req.rawPrompt,
          suggestedCameraMovement: parsed.suggestedCameraMovement || 'slow dolly in',
          suggestedLighting: parsed.suggestedLighting || 'neon cinematic',
          keyKeywords: ['Veo 3.1', '8k photorealistic', '35mm anamorphic']
        };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('[Gemini Refine Error]', errMsg);
      }
    }

    return {
      originalPrompt: req.rawPrompt,
      refinedPrompt: `Ultra-cinematic 8k photorealistic video of ${req.rawPrompt}. Atmospheric volumetric fog, rain reflections on pavement, 35mm anamorphic lens flare, slow dolly forward at 24fps, dramatic lighting, Google Veo 3.1 render.`,
      suggestedCameraMovement: 'slow dolly forward at 24fps',
      suggestedLighting: 'volumetric backlight & neon contrast',
      keyKeywords: ['Veo 3.1', '8k photorealistic', '35mm anamorphic']
    };
  }

  async orchestrateDirector(req: DirectorRequest): Promise<DirectorResponse> {
    const targetDur = req.targetDuration || 30;
    const style = req.style || 'cinematic';

    if (this.genAI && req.idea) {
      try {
        const model = this.genAI.getGenerativeModel({ model: this.modelName });
        const prompt = `You are top AI Film Director powering CineAI Studio with Gemini 3.1 Pro and Veo 3.1.
Analyze idea and structure a production script and 3 distinct scene-by-scene prompts for Veo 3.1:
Idea: "${req.idea}"
Target Duration: ${targetDur} seconds
Style: ${style}

Return JSON with structure:
{
  "title": "Film Title",
  "genre": "Genre",
  "audience": "Target Audience",
  "duration": ${targetDur},
  "hook": "Cinematic Hook",
  "script": { "title": "Script Title", "genre": "${style}", "logline": "Logline", "fullText": "Full text script..." },
  "storyboard": {
    "title": "Storyboard",
    "summary": "Summary",
    "scenes": [
      { "sceneNumber": 1, "duration": 8, "prompt": "Scene 1 Veo prompt...", "cameraMovement": "slow dolly in", "lightingStyle": "neon mood" },
      { "sceneNumber": 2, "duration": 10, "prompt": "Scene 2 Veo prompt...", "cameraMovement": "pan right", "lightingStyle": "volumetric backlight" },
      { "sceneNumber": 3, "duration": 12, "prompt": "Scene 3 Veo prompt...", "cameraMovement": "ascending drone shot", "lightingStyle": "golden hour" }
    ]
  }
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const cleanedJson = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedJson) as DirectorResponse;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('[Gemini Orchestrate Error]', errMsg);
      }
    }

    return {
      title: 'AI Cinematic Production',
      genre: style,
      audience: 'General Audience',
      duration: targetDur,
      hook: `Khám phá câu chuyện điện ảnh độc đáo sáng tạo từ: "${req.idea}"`,
      script: {
        title: 'CineAI Script',
        genre: style,
        logline: req.idea,
        fullText: `Kịch bản chi tiết sáng tạo cho ý tưởng: ${req.idea}`
      },
      storyboard: {
        title: 'Storyboard Phân Cảnh Veo 3.1',
        summary: 'Kế hoạch phân cảnh điện ảnh 3 giai đoạn.',
        scenes: [
          { sceneNumber: 1, duration: 8, prompt: `${req.idea} - Scene 1: Wide establishing cinematic shot, 8k resolution, photorealistic Veo 3.1 render.`, cameraMovement: 'slow dolly in', lightingStyle: 'neon cinematic' },
          { sceneNumber: 2, duration: 10, prompt: `${req.idea} - Scene 2: Medium tracking shot highlighting character motion and textures.`, cameraMovement: 'pan right', lightingStyle: 'volumetric backlight' },
          { sceneNumber: 3, duration: 12, prompt: `${req.idea} - Scene 3: Dramatic crescendo climactic shot, 35mm anamorphic lens flare.`, cameraMovement: 'ascending crane shot', lightingStyle: 'dramatic golden hour' }
        ]
      }
    };
  }
}

export const geminiService = new GeminiService();
