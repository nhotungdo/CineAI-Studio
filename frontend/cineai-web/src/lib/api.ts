const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ─── Pipeline & Creation APIs ──────────────────────────────────────────────────

export async function createVideoPipeline(params: {
  prompt: string;
  videoType?: string;
  duration?: number;
  aspectRatio?: string;
  resolution?: string;
  visualStyle?: string;
  language?: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/Video/create-pipeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function fetchJobStoryboard(jobId: string) {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs/${jobId}/storyboard`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function updateStoryboardScene(
  jobId: string,
  sceneId: string,
  data: {
    prompt?: string;
    cameraMovement?: string;
    lightingStyle?: string;
    duration?: number;
    title?: string;
    description?: string;
  }
) {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs/${jobId}/storyboard/scenes/${sceneId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function deleteStoryboardScene(jobId: string, sceneId: string) {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs/${jobId}/storyboard/scenes/${sceneId}`, {
      method: "DELETE",
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function addStoryboardScene(jobId: string, sceneData: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs/${jobId}/storyboard/scenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sceneData),
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function reorderStoryboardScenes(jobId: string, sceneOrders: { sceneId: string; sceneNumber: number }[]) {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs/${jobId}/storyboard/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sceneOrders }),
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function regenerateScenePrompt(jobId: string, sceneId: string, feedback?: string) {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs/${jobId}/storyboard/scenes/${sceneId}/regenerate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback }),
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function approveStoryboard(jobId: string) {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs/${jobId}/approve-storyboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

// ─── Status & Real-time Progress APIs ──────────────────────────────────────────

export async function fetchJobProgress(jobId: string) {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs/${jobId}/progress`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function checkJobStatus(jobId: string) {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs/${jobId}`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function retryScene(jobId: string, sceneId: string) {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs/${jobId}/retry-scene/${sceneId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function reRenderPipeline(jobId: string) {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs/${jobId}/re-render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function updateAudioSettings(
  jobId: string,
  data: {
    bgMusicId?: string;
    bgMusicVolume?: number;
    voiceoverId?: string;
    voiceoverVolume?: number;
    subtitleStyle?: string;
  }
) {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs/${jobId}/audio-settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function triggerVideoJob(jobId: string) {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs/${jobId}/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function fetchRecentJobs() {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return [];
}

export async function startVideoGeneration(
  prompt: string,
  durationSeconds: number = 5,
  aspectRatio: string = "9:16"
) {
  try {
    const res = await fetch(`${API_BASE}/Video/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        model: "google/veo-3.1-fast",
        aspectRatio,
        durationSeconds,
      }),
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

// ─── Director AI APIs ─────────────────────────────────────────────────────────

export async function refinePrompt(rawPrompt: string, style: string = "Cinematic") {
  try {
    const res = await fetch(`${API_BASE}/Director/refine-prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawPrompt, style }),
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function orchestrateDirector(ideaData: {
  idea: string;
  targetDuration: number;
  aspectRatio: string;
  style: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/Director/orchestrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ideaData),
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

// ─── Project & Character APIs ─────────────────────────────────────────────────

export async function fetchProjects() {
  try {
    const res = await fetch(`${API_BASE}/Project`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return [];
}

export async function fetchProjectById(id: string) {
  try {
    const res = await fetch(`${API_BASE}/Project/${id}`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function createProject(projectData: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_BASE}/Project`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData),
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

export async function fetchCharacters() {
  try {
    const res = await fetch(`${API_BASE}/Character`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return [];
}

export async function createCharacter(characterData: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_BASE}/Character`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(characterData),
    });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}
