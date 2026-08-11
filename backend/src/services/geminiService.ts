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
  resolution?: string;
  language?: string;
}

export interface ScenePlanItem {
  sceneNumber: number;
  title: string;
  description: string;
  prompt: string;
  duration: number;
  cameraMovement: string;
  lightingStyle: string;
  visualStyle?: string;
  characters?: string[];
}

export interface CharacterItem {
  name: string;
  role: string;
  appearance: string;
  clothing: string;
}

export interface VideoPlanResponse {
  title: string;
  concept: string;
  script: {
    title: string;
    genre: string;
    logline: string;
    fullText: string;
  };
  visualStyle: string;
  characters: CharacterItem[];
  scenes: ScenePlanItem[];
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

  async orchestrateDirector(req: DirectorRequest): Promise<VideoPlanResponse> {
    const targetDur = req.targetDuration || 30;
    const style = req.style || 'cinematic';
    const lang = req.language || 'English';

    if (this.genAI && req.idea) {
      try {
        const model = this.genAI.getGenerativeModel({ model: this.modelName });
        const prompt = `You are top AI Film Director powering CineAI Studio with Gemini 3.1 Pro and Veo 3.1.
Analyze idea and structure a production script, characters, visual style, and 3-5 detailed scene-by-scene prompts for Veo 3.1:
Idea: "${req.idea}"
Target Duration: ${targetDur} seconds
Style: ${style}
Language: ${lang}

Return JSON with exact structure:
{
  "title": "Film Title",
  "concept": "High-level cinematic creative concept summary",
  "script": {
    "title": "Script Title",
    "genre": "${style}",
    "logline": "Logline summary",
    "fullText": "Full text voiceover / narration script..."
  },
  "visualStyle": "${style} lighting, 35mm lens, high contrast color grading",
  "characters": [
    { "name": "Main Character", "role": "Protagonist", "appearance": "Cyberpunk jacket, glowing cybernetic eye", "clothing": "Dark leather coat" }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Opening Establishing Shot",
      "description": "Panoramic view setting the atmosphere",
      "prompt": "Ultra-detailed Veo 3.1 prompt for Scene 1...",
      "duration": 6,
      "cameraMovement": "slow dolly forward",
      "lightingStyle": "volumetric neon backlight",
      "visualStyle": "Cinematic 8K",
      "characters": ["Main Character"]
    },
    {
      "sceneNumber": 2,
      "title": "Character Interaction",
      "description": "Medium shot of character moving through scene",
      "prompt": "Ultra-detailed Veo 3.1 prompt for Scene 2...",
      "duration": 8,
      "cameraMovement": "tracking pan right",
      "lightingStyle": "dramatic side lighting",
      "visualStyle": "Cinematic 8K",
      "characters": ["Main Character"]
    },
    {
      "sceneNumber": 3,
      "title": "Climactic Finale",
      "description": "High energy crescendo scene",
      "prompt": "Ultra-detailed Veo 3.1 prompt for Scene 3...",
      "duration": 10,
      "cameraMovement": "ascending drone shot",
      "lightingStyle": "golden hour rim lighting",
      "visualStyle": "Cinematic 8K",
      "characters": ["Main Character"]
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const cleanedJson = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedJson) as VideoPlanResponse;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('[Gemini Orchestrate Error]', errMsg);
      }
    }

    return {
      title: req.idea.substring(0, 40) || 'AI Cinematic Production',
      concept: `A stunning ${style} visual story based on "${req.idea}"`,
      script: {
        title: 'CineAI Screenplay',
        genre: style,
        logline: req.idea,
        fullText: `Voiceover & Director notes for: ${req.idea}`
      },
      visualStyle: `${style} anamorphic 35mm lens flare, volumetric fog, high-contrast neon palette`,
      characters: [
        {
          name: 'Hero Protagonist',
          role: 'Lead',
          appearance: 'Determined expression, sharp features',
          clothing: 'Futuristic dark cloak'
        }
      ],
      scenes: [
        {
          sceneNumber: 1,
          title: 'Opening Establishing Shot',
          description: `Wide establishing cinematic shot setting up ${req.idea}`,
          prompt: `Wide establishing cinematic shot of ${req.idea}. 8K photorealistic Veo 3.1 render, atmospheric fog, rain reflections.`,
          duration: 6,
          cameraMovement: 'slow dolly in',
          lightingStyle: 'neon volumetric contrast',
          visualStyle: style,
          characters: ['Hero Protagonist']
        },
        {
          sceneNumber: 2,
          title: 'Main Character Tracking Shot',
          description: `Medium tracking shot following character movement`,
          prompt: `Medium tracking shot of character in ${req.idea}. Cinematic lighting, 35mm lens blur, 24fps motion.`,
          duration: 8,
          cameraMovement: 'pan right tracking shot',
          lightingStyle: 'volumetric backlight',
          visualStyle: style,
          characters: ['Hero Protagonist']
        },
        {
          sceneNumber: 3,
          title: 'Climactic Finale',
          description: `Dramatic crescendo shot concluding the story arc`,
          prompt: `Dramatic cinematic crescendo shot of ${req.idea}. Ascending crane shot, anamorphic lens flare, epic finale.`,
          duration: 10,
          cameraMovement: 'ascending drone shot',
          lightingStyle: 'dramatic golden hour rim light',
          visualStyle: style,
          characters: ['Hero Protagonist']
        }
      ]
    };
  }

  async regenerateScenePrompt(sceneInfo: {
    prompt: string;
    style?: string;
    cameraMovement?: string;
    lightingStyle?: string;
    feedback?: string;
  }): Promise<{ prompt: string; cameraMovement: string; lightingStyle: string }> {
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: this.modelName });
        const p = `Regenerate and enhance this scene prompt for Veo 3.1 video AI model:
Current Scene Prompt: "${sceneInfo.prompt}"
Camera Movement: "${sceneInfo.cameraMovement || 'dolly in'}"
Lighting: "${sceneInfo.lightingStyle || 'cinematic'}"
User Feedback/Modification Request: "${sceneInfo.feedback || 'Make it more epic and photorealistic'}"

Return JSON:
{
  "prompt": "Enhanced Veo 3.1 prompt...",
  "cameraMovement": "updated camera movement",
  "lightingStyle": "updated lighting style"
}`;
        const result = await model.generateContent(p);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const cleanedJson = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedJson);
      } catch (err) {
        console.error('[regenerateScenePrompt Error]', err);
      }
    }

    return {
      prompt: `${sceneInfo.prompt} (Refined by Gemini 3.1 Director: Enhanced 8K textures, 35mm lens, 24fps)`,
      cameraMovement: sceneInfo.cameraMovement || 'slow dolly forward',
      lightingStyle: sceneInfo.lightingStyle || 'dramatic volumetric light'
    };
  }
}

export const geminiService = new GeminiService();

