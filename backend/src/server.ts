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

// Ensure storage directory exists and serve statically
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
    veoModel: 'veo-2.0-generate-001 (Gemini API)',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-pro'
  });
});

// Video Routes
app.post('/api/Video/generate', videoCtrl.startGeneration);
app.post('/api/Video/generate-multiscene', videoCtrl.startMultiSceneGeneration);
app.get('/api/Video/jobs/:jobId', videoCtrl.getJobStatus);
app.get('/api/Video/jobs/:jobId/progress', videoCtrl.getJobProgress);
app.post('/api/Video/jobs/:jobId/trigger', videoCtrl.triggerJob);
app.get('/api/Video/jobs', videoCtrl.getRecentJobs);
app.get('/api/Video/operation/:operationId', videoCtrl.getOperationStatus);
app.post('/api/Video/jobs/:jobId/retry-scene/:sceneId', videoCtrl.retryScene);
app.post('/api/Video/jobs/:jobId/retry-merge', videoCtrl.retryMerge);

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
