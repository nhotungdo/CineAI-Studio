const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5140/api";

export async function fetchProjects() {
  try {
    const res = await fetch(`${API_BASE}/Project`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful handling when backend API is offline or starting up
  }
  return [];
}

export async function fetchProjectById(id: string) {
  try {
    const res = await fetch(`${API_BASE}/Project/${id}`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful handling when backend API is offline
  }
  return null;
}

export async function createProject(projectData: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_BASE}/Project`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful handling when backend API is offline
  }
  return null;
}

export async function refinePrompt(rawPrompt: string, style: string = "Cinematic") {
  try {
    const res = await fetch(`${API_BASE}/Director/refine-prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawPrompt, style }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful handling when backend API is offline
  }
  return null;
}

export async function orchestrateDirector(ideaData: { idea: string; targetDuration: number; aspectRatio: string; style: string }) {
  try {
    const res = await fetch(`${API_BASE}/Director/orchestrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ideaData),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful handling when backend API is offline
  }
  return null;
}

export async function startVideoGeneration(prompt: string, durationSeconds: number = 5, aspectRatio: string = "9:16") {
  try {
    const res = await fetch(`${API_BASE}/Video/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        model: "veo-3.1-generate-preview",
        aspectRatio,
        durationSeconds,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful handling when backend API is offline
  }
  return null;
}

export async function checkOperationStatus(operationId: string) {
  try {
    const res = await fetch(`${API_BASE}/Video/operation/${operationId}`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful handling when backend API is offline
  }
  return null;
}

export async function fetchCharacters() {
  try {
    const res = await fetch(`${API_BASE}/Character`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful handling when backend API is offline
  }
  return [];
}

export async function createCharacter(characterData: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_BASE}/Character`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(characterData),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful handling when backend API is offline
  }
  return null;
}

export async function fetchExports() {
  try {
    const res = await fetch(`${API_BASE}/Export`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful handling when backend API is offline
  }
  return [];
}

export async function fetchUserCredits(userId: string = "11111111-1111-1111-1111-111111111111") {
  try {
    const res = await fetch(`${API_BASE}/Credit/user/${userId}`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful handling when backend API is offline
  }
  return null;
}
