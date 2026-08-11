"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import {
  Film,
  Sparkles,
  Mic,
  Music,
  MessageSquare,
  Plus,
  SlidersHorizontal,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
} from "lucide-react";
import {
  fetchProjectById,
  fetchJobProgress,
  triggerVideoJob,
  retryScene,
  refinePrompt,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SceneProgress {
  sceneId: string;
  sceneNumber: number;
  duration: number;
  prompt: string;
  cameraMovement?: string;
  lightingStyle?: string;
  status: string;
  errorMessage?: string;
  videoUrl: string | null;
}

interface JobProgress {
  jobId: string;
  status: string;
  progressPercentage: number;
  totalScenes: number;
  completedScenes: number;
  finalVideoUrl: string | null;
  thumbnailUrl: string | null;
  errorMessage?: string;
  scenes: SceneProgress[];
}

interface ProjectData {
  title?: string;
  jobId?: string;
  jobStatus?: string;
  finalVideoUrl?: string | null;
}

// ─── Scene Status Badge ───────────────────────────────────────────────────────

function SceneStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    Pending: { color: "text-zinc-400 bg-zinc-800/60 border-zinc-700", icon: null, label: "Pending" },
    Generating: { color: "text-yellow-400 bg-yellow-900/30 border-yellow-700/50", icon: <Loader2 className="w-2.5 h-2.5 animate-spin" />, label: "Generating" },
    Downloaded: { color: "text-blue-400 bg-blue-900/30 border-blue-700/50", icon: <Loader2 className="w-2.5 h-2.5 animate-spin" />, label: "Normalizing" },
    ReadyForMerge: { color: "text-emerald-400 bg-emerald-900/30 border-emerald-700/50", icon: <CheckCircle2 className="w-2.5 h-2.5" />, label: "Ready" },
    Merged: { color: "text-emerald-400 bg-emerald-900/30 border-emerald-700/50", icon: <CheckCircle2 className="w-2.5 h-2.5" />, label: "Merged" },
    Failed: { color: "text-red-400 bg-red-900/30 border-red-700/50", icon: <AlertCircle className="w-2.5 h-2.5" />, label: "Failed" },
  };
  const cfg = map[status] || { color: "text-zinc-400 bg-zinc-800/60 border-zinc-700", icon: null, label: status };
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Job Status Banner ────────────────────────────────────────────────────────

function JobStatusBanner({ job, onTrigger }: { job: JobProgress | null; onTrigger: () => void }) {
  if (!job) return null;

  const isActive = ["Planning", "Generating", "Downloading", "Normalizing", "Merging"].includes(job.status);
  const isDone = job.status === "Completed";
  const isFailed = job.status === "Failed";

  return (
    <div className={`flex items-center justify-between px-4 py-2.5 rounded-[10px] border text-xs font-mono ${
      isDone ? "bg-emerald-900/20 border-emerald-700/40 text-emerald-300" :
      isFailed ? "bg-red-900/20 border-red-700/40 text-red-300" :
      isActive ? "bg-[#8b5cf6]/10 border-[#8b5cf6]/30 text-[#c4b5fd]" :
      "bg-[#161618] border-[#27272a] text-zinc-400"
    }`}>
      <div className="flex items-center gap-2">
        {isActive && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        {isFailed && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
        <span>
          {isDone ? "✅ Video hoàn chỉnh đã sẵn sàng!" :
           isFailed ? `❌ Pipeline lỗi: ${job.errorMessage || "Unknown error"}` :
           isActive ? `⚙️ ${job.status}... Scene ${job.completedScenes}/${job.totalScenes} • ${job.progressPercentage}%` :
           `🎬 Job ${job.status} — Bấm "Render" để bắt đầu`}
        </span>
      </div>
      {!isActive && !isDone && (
        <button
          onClick={onTrigger}
          className="px-3 py-1 rounded-[6px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white text-[10px] font-semibold flex items-center gap-1 hover:from-[#8b5cf6] hover:to-[#6366f1] transition-all"
        >
          <Sparkles className="w-3 h-3" />
          Render Toàn Bộ Video
        </button>
      )}
      {isFailed && (
        <button
          onClick={onTrigger}
          className="px-3 py-1 rounded-[6px] bg-red-600/30 border border-red-600/40 text-red-300 text-[10px] font-semibold flex items-center gap-1 hover:bg-red-600/50 transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
      {isActive && (
        <div className="w-32 bg-[#27272a] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] h-full transition-all duration-500"
            style={{ width: `${job.progressPercentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectWorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [job, setJob] = useState<JobProgress | null>(null);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefining, setIsRefining] = useState(false);
  const [activePreviewVideo, setActivePreviewVideo] = useState<string | null>(null);
  const [scenePrompts, setScenePrompts] = useState<Record<string, string>>({});

  // Inspector state
  const [cameraMode, setCameraMode] = useState("Dolly");
  const [lightingMode, setLightingMode] = useState("Neon");
  const [motionSpeed, setMotionSpeed] = useState("Slow");

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobIdRef = useRef<string | null>(null);

  // ── Load project + start polling ─────────────────────────────────────────
  useEffect(() => {
    async function loadProject() {
      setIsLoading(true);
      const data = await fetchProjectById(projectId);
      if (data) {
        setProject(data);
        if (data.jobId) {
          jobIdRef.current = data.jobId;
          const progress = await fetchJobProgress(data.jobId);
          if (progress) {
            setJob(progress as JobProgress);
            // Init scene prompts from DB
            const prompts: Record<string, string> = {};
            (progress.scenes || []).forEach((sc: SceneProgress) => {
              prompts[sc.sceneId] = sc.prompt;
            });
            setScenePrompts(prompts);
          }
        }
      }
      setIsLoading(false);
    }
    loadProject();
  }, [projectId]);

  // ── Job polling: auto-refresh every 3 seconds while job is active ─────────
  const pollProgress = useCallback(async () => {
    const jid = jobIdRef.current;
    if (!jid) return;
    const progress = await fetchJobProgress(jid);
    if (!progress) return;

    setJob(progress as JobProgress);

    // If final video arrives, set preview
    if (progress.finalVideoUrl) {
      setActivePreviewVideo(progress.finalVideoUrl);
    }

    // Stop polling when job is terminal
    if (["Completed", "Failed"].includes(progress.status)) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    // Start polling when we have a job
    if (job?.jobId && !["Completed", "Failed"].includes(job.status)) {
      pollingRef.current = setInterval(pollProgress, 3000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [job?.jobId, job?.status, pollProgress]);

  // ── Handle trigger (Render All) ───────────────────────────────────────────
  const handleTriggerJob = async () => {
    const jid = job?.jobId || jobIdRef.current;
    if (!jid) return;
    await triggerVideoJob(jid);
    // Restart polling
    const progress = await fetchJobProgress(jid);
    if (progress) setJob(progress as JobProgress);
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(pollProgress, 3000);
  };

  // ── Handle scene retry ────────────────────────────────────────────────────
  const handleRetryScene = async (sceneId: string) => {
    const jid = job?.jobId;
    if (!jid) return;
    await retryScene(jid, sceneId);
    await handleTriggerJob();
  };

  // ── Refine current scene prompt ───────────────────────────────────────────
  const handleRefineCurrentScenePrompt = async () => {
    const currentScene = job?.scenes[selectedSceneIndex];
    if (!currentScene) return;
    setIsRefining(true);
    const refined = await refinePrompt(scenePrompts[currentScene.sceneId] || currentScene.prompt, "Cinematic");
    if (refined?.refinedPrompt) {
      setScenePrompts(prev => ({ ...prev, [currentScene.sceneId]: refined.refinedPrompt }));
    }
    setIsRefining(false);
  };

  // ── Select scene ──────────────────────────────────────────────────────────
  const handleSelectScene = (index: number) => {
    setSelectedSceneIndex(index);
    const sc = job?.scenes[index];
    if (sc?.videoUrl) setActivePreviewVideo(sc.videoUrl);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-3 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#a78bfa] animate-spin" />
        <p className="text-xs text-zinc-500 font-mono">Đang tải Studio Workspace...</p>
      </div>
    );
  }

  const scenes = job?.scenes || [];
  const currentScene = scenes[selectedSceneIndex] || scenes[0];
  const isJobActive = job && ["Planning", "Generating", "Downloading", "Normalizing", "Merging"].includes(job.status);
  const finalVideo = job?.finalVideoUrl || activePreviewVideo;

  return (
    <div className="space-y-5">
      {/* Studio Header Bar */}
      <div className="flex items-center justify-between studio-panel p-4 border border-[#27272a] bg-[#111113]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400">Dự Án /</span>
          <h1 className="text-base font-semibold text-white tracking-tight font-display">{project?.title || "AI Studio"}</h1>
          <span className="text-[10px] font-mono text-[#a78bfa] px-2 py-0.5 rounded bg-[#8b5cf6]/10 border border-[#8b5cf6]/30">
            Veo 2 • 1080p
          </span>
        </div>
        <div className="flex items-center gap-2">
          {job?.finalVideoUrl && (
            <a
              href={job.finalVideoUrl}
              download
              className="px-3 py-1.5 rounded-[8px] bg-emerald-600/20 border border-emerald-600/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-600/30 transition-all"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Tải Video
            </a>
          )}
          <button
            onClick={handleTriggerJob}
            disabled={!!isJobActive}
            className="px-4 py-1.5 rounded-[8px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-[#7c3aed]/20 transition-all disabled:opacity-50"
          >
            {isJobActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isJobActive ? "Đang Xử Lý..." : "Render Toàn Bộ"}</span>
          </button>
        </div>
      </div>

      {/* Job Progress Banner */}
      <JobStatusBanner job={job} onTrigger={handleTriggerJob} />

      {/* Main Studio Viewport: Preview (Left) + Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Viewport */}
        <div className="lg:col-span-8 space-y-4">
          <div className="studio-panel p-4 border border-[#27272a] bg-[#09090b]">
            <div className="relative aspect-video bg-[#000000] rounded-[12px] overflow-hidden border border-[#27272a] flex items-center justify-center max-h-[460px] mx-auto">
              {isJobActive && !finalVideo ? (
                <div className="p-8 text-center space-y-4 w-full max-w-md">
                  <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#a78bfa] mx-auto">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white font-display">✦ {job?.status} AI Pipeline...</h4>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">
                      Scene {job?.completedScenes}/{job?.totalScenes} • {job?.progressPercentage}%
                    </p>
                  </div>
                  <div className="w-full bg-[#161618] h-2 rounded-full overflow-hidden border border-[#27272a]">
                    <div
                      className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] h-full transition-all duration-700"
                      style={{ width: `${job?.progressPercentage || 0}%` }}
                    />
                  </div>
                </div>
              ) : finalVideo ? (
                <video
                  src={finalVideo}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <Film className="w-12 h-12 text-zinc-700 mx-auto" />
                  <p className="text-xs text-zinc-500">Bấm &quot;Render Toàn Bộ&quot; để bắt đầu tạo video AI.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 text-xs text-zinc-400 font-mono">
              <span>
                {currentScene
                  ? `Scene ${currentScene.sceneNumber} (${currentScene.duration}s)`
                  : "Chưa có scene"}
              </span>
              <span>Veo 2 • AI Audio</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Scene Inspector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="studio-panel p-5 border border-[#27272a] bg-[#111113] space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span>Inspector</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">
                Scene {currentScene ? `0${currentScene.sceneNumber}` : "--"}
              </span>
            </div>

            {/* Prompt Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-mono uppercase text-zinc-400">Prompt Scene</label>
                <button
                  onClick={handleRefineCurrentScenePrompt}
                  disabled={isRefining || !currentScene}
                  className="text-[10px] text-[#a78bfa] hover:underline font-mono flex items-center gap-1 disabled:opacity-40"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Tối Ưu AI ✦</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={currentScene ? (scenePrompts[currentScene.sceneId] ?? currentScene.prompt) : ""}
                onChange={(e) => {
                  if (!currentScene) return;
                  setScenePrompts(prev => ({ ...prev, [currentScene.sceneId]: e.target.value }));
                }}
                className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>

            {/* Camera Controls */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase text-zinc-400">Góc Quay (Camera)</label>
              <div className="grid grid-cols-3 gap-1.5">
                {["Dolly", "Pan", "Zoom"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCameraMode(c)}
                    className={`py-1.5 rounded-[6px] text-[11px] font-medium border transition-all ${
                      cameraMode === c ? "bg-[#8b5cf6]/20 border-[#8b5cf6] text-[#a78bfa]" : "bg-[#161618] border-[#27272a] text-zinc-400"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Lighting Controls */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase text-zinc-400">Ánh Sáng (Lighting)</label>
              <div className="grid grid-cols-3 gap-1.5">
                {["Natural", "Dramatic", "Neon"].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLightingMode(l)}
                    className={`py-1.5 rounded-[6px] text-[11px] font-medium border transition-all ${
                      lightingMode === l ? "bg-[#8b5cf6]/20 border-[#8b5cf6] text-[#a78bfa]" : "bg-[#161618] border-[#27272a] text-zinc-400"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Motion Controls */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase text-zinc-400">Tốc Độ Chuyển Động</label>
              <div className="grid grid-cols-3 gap-1.5">
                {["Slow", "Medium", "Fast"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMotionSpeed(m)}
                    className={`py-1.5 rounded-[6px] text-[11px] font-medium border transition-all ${
                      motionSpeed === m ? "bg-[#8b5cf6]/20 border-[#8b5cf6] text-[#a78bfa]" : "bg-[#161618] border-[#27272a] text-zinc-400"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Images */}
            <div className="space-y-1.5 pt-1 border-t border-[#27272a]">
              <label className="block text-[10px] font-mono uppercase text-zinc-400">Ảnh Tham Chiếu</label>
              <button className="w-full py-2 rounded-[8px] border border-dashed border-[#27272a] hover:border-[#8b5cf6]/50 text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 transition-all">
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Ảnh Reference</span>
              </button>
            </div>

            {/* Retry Scene Button (if failed) */}
            {currentScene?.status === "Failed" && (
              <button
                onClick={() => handleRetryScene(currentScene.sceneId)}
                className="w-full py-2.5 rounded-[10px] bg-red-600/20 border border-red-600/30 text-red-300 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-red-600/30 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Scene {currentScene.sceneNumber}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Track Timeline with real Scene status */}
      <div className="studio-panel p-5 border border-[#27272a] bg-[#111113] space-y-4">
        {/* Time ruler */}
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-b border-[#27272a] pb-2 px-2">
          <span>00:00</span>
          <span>00:08</span>
          <span>00:16</span>
          <span>00:24</span>
          <span>00:32</span>
        </div>

        {/* Tracks */}
        <div className="space-y-2">
          {/* Track 1: Scene Clips */}
          <div className="flex items-center gap-3">
            <div className="w-24 text-xs font-mono font-medium text-zinc-400 shrink-0 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>Video Clips</span>
            </div>
            <div className="flex-1 flex gap-2 flex-wrap">
              {scenes.length === 0 ? (
                <div className="flex-1 bg-[#161618] h-12 rounded-[6px] border border-dashed border-[#27272a] flex items-center justify-center text-[10px] font-mono text-zinc-500">
                  Chưa có scene — Bấm &quot;Render Toàn Bộ&quot; để bắt đầu
                </div>
              ) : (
                scenes.map((sc, index) => (
                  <button
                    key={sc.sceneId}
                    onClick={() => handleSelectScene(index)}
                    className={`flex-1 min-w-[80px] p-2.5 rounded-[8px] text-left transition-all border relative ${
                      selectedSceneIndex === index
                        ? "bg-[#8b5cf6]/20 border-[#8b5cf6] shadow-sm shadow-[#8b5cf6]/30"
                        : "bg-[#161618] border-[#27272a] hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="font-bold text-white">Scene {sc.sceneNumber}</span>
                      <span className="text-zinc-400">{sc.duration}s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] truncate font-mono text-zinc-400 flex-1">{sc.prompt?.substring(0, 35)}...</p>
                      <SceneStatusBadge status={sc.status} />
                    </div>
                    {sc.videoUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setActivePreviewVideo(sc.videoUrl); }}
                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#8b5cf6]/80 flex items-center justify-center"
                      >
                        <Play className="w-2 h-2 fill-white ml-0.5" />
                      </button>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Track 2: Voice Track */}
          <div className="flex items-center gap-3">
            <div className="w-24 text-xs font-mono font-medium text-zinc-500 shrink-0 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              <span>Voice</span>
            </div>
            <div className="flex-1 bg-[#161618] h-7 rounded-[6px] border border-[#27272a] flex items-center px-3 text-[10px] font-mono text-zinc-400">
              🎙 AI Voiceover Narration Track (Đồng Bộ Lời Thoại)
            </div>
          </div>

          {/* Track 3: Music Track */}
          <div className="flex items-center gap-3">
            <div className="w-24 text-xs font-mono font-medium text-zinc-500 shrink-0 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" />
              <span>Music</span>
            </div>
            <div className="flex-1 bg-[#161618] h-7 rounded-[6px] border border-[#27272a] flex items-center px-3 text-[10px] font-mono text-zinc-400">
              🎵 Nhạc Nền Điện Ảnh (Veo 2 Audio — {job?.status === "Completed" ? "✅ Synced" : "Chờ render..."})
            </div>
          </div>

          {/* Track 4: Subtitles */}
          <div className="flex items-center gap-3">
            <div className="w-24 text-xs font-mono font-medium text-zinc-500 shrink-0 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Subtitles</span>
            </div>
            <div className="flex-1 bg-[#161618] h-7 rounded-[6px] border border-[#27272a] flex items-center px-3 text-[10px] font-mono text-zinc-400">
              💬 Tự Động Tạo Phụ Đề Tiếng Việt / Tiếng Anh
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
