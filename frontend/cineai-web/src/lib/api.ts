const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ─── Project APIs ─────────────────────────────────────────────────────────────

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

// ─── Video Job APIs ───────────────────────────────────────────────────────────

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
        model: "veo-2.0-generate-001",
        aspectRatio,
        durationSeconds,
      }),
    });
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

/**
 * Fetch detailed per-scene progress for a video job.
 */
export async function fetchJobProgress(jobId: string) {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs/${jobId}/progress`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

/**
 * Trigger a video job to start processing immediately.
 */
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

/**
 * Retry a failed scene in a video job.
 */
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

/**
 * Fetch all recent video jobs (for the Videos page).
 */
export async function fetchRecentJobs() {
  try {
    const res = await fetch(`${API_BASE}/Video/jobs`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return [];
}

export async function checkOperationStatus(operationId: string) {
  try {
    const res = await fetch(`${API_BASE}/Video/operation/${operationId}`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return null;
}

// ─── Character APIs ───────────────────────────────────────────────────────────

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

// ─── Export APIs (legacy, kept for backward compat) ──────────────────────────

export async function fetchExports() {
  try {
    const res = await fetch(`${API_BASE}/Export`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch { /* backend offline */ }
  return [];
}
