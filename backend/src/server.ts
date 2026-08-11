import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { runWorkerLoop } from './worker/videoWorker.js';

import * as videoCtrl from './controllers/videoController.js';
import * as projectCtrl from './controllers/projectController.js';
import * as charCtrl from './controllers/characterController.js';
import * as exportCtrl from './controllers/exportController.js';
import * as directorCtrl from './controllers/directorController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static storage
const storageDir = path.resolve(process.cwd(), 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}
app.use('/storage', express.static(storageDir));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'CineAI Studio Node.js Express API',
    status: 'Healthy',
    pipeline: 'AI Video Production Pipeline (Gemini 3.1 Pro + Veo 3.1 + FFmpeg)',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-pro'
  });
});

// Video Pipeline Routes
app.post('/api/Video/create-pipeline', videoCtrl.createPipeline);
app.get('/api/Video/jobs/:jobId/storyboard', videoCtrl.getJobStoryboard);
app.put('/api/Video/jobs/:jobId/storyboard/scenes/:sceneId', videoCtrl.updateScene);
app.delete('/api/Video/jobs/:jobId/storyboard/scenes/:sceneId', videoCtrl.deleteScene);
app.post('/api/Video/jobs/:jobId/storyboard/scenes', videoCtrl.addScene);
app.put('/api/Video/jobs/:jobId/storyboard/reorder', videoCtrl.reorderScenes);
app.post('/api/Video/jobs/:jobId/storyboard/scenes/:sceneId/regenerate', videoCtrl.regenerateScenePrompt);
app.post('/api/Video/jobs/:jobId/approve-storyboard', videoCtrl.approveStoryboard);
app.put('/api/Video/jobs/:jobId/audio-settings', videoCtrl.updateAudioSettings);

// Video Job Status & Progress Routes
app.get('/api/Video/jobs/:jobId', videoCtrl.getJobStatus);
app.get('/api/Video/jobs/:jobId/progress', videoCtrl.getJobProgress);
app.get('/api/Video/jobs/:jobId/events', videoCtrl.sseEvents);
app.get('/api/Video/jobs', videoCtrl.getRecentJobs);
app.post('/api/Video/jobs/:jobId/retry-scene/:sceneId', videoCtrl.retryScene);
app.post('/api/Video/jobs/:jobId/re-render', videoCtrl.reRenderPipeline);
app.post('/api/Video/jobs/:jobId/trigger', videoCtrl.triggerPipeline);

// Legacy Single-clip Generation Routes
app.post('/api/Video/generate', videoCtrl.startGeneration);

// Project Routes
app.get('/api/Project', projectCtrl.getProjects);
app.get('/api/Project/:id', projectCtrl.getProjectById);
app.post('/api/Project', projectCtrl.createProject);

// Character Routes
app.get('/api/Character', charCtrl.getCharacters);
app.post('/api/Character', charCtrl.createCharacter);

// Export Routes
app.get('/api/Export', exportCtrl.getExports);
app.post('/api/Export', exportCtrl.createExport);

// Director AI Routes
app.post('/api/Director/refine-prompt', directorCtrl.refinePrompt);
app.post('/api/Director/orchestrate', directorCtrl.orchestrateDirector);

app.listen(PORT, () => {
  console.log(`[CineAI Studio Node API] Server running on http://localhost:${PORT}`);
  // Start Node.js background video worker loop
  runWorkerLoop().catch((err) => console.error('[Worker Error]', err));
});
