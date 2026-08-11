"use client";

import { useState, useEffect, use } from "react";
import { 
  Film, 
  Sparkles, 
  Mic, 
  Music, 
  MessageSquare,
  Plus,
  SlidersHorizontal,
  ArrowUpRight
} from "lucide-react";
import { fetchProjectById, startVideoGeneration, checkOperationStatus, refinePrompt } from "@/lib/api";

interface GenerationItem {
  status: string;
  videoUrl?: string;
}

interface SceneData {
  id: string;
  sceneNumber: number;
  duration: number;
  prompt: string;
  cameraMovement?: string;
  lightingStyle?: string;
  generations?: GenerationItem[];
}

interface ProjectData {
  title?: string;
  scenes?: SceneData[];
}

interface MappedScene {
  id: string;
  number: number;
  duration: number;
  prompt: string;
  camera: string;
  lighting: string;
  motion: string;
  status: string;
  progress: number;
  videoUrl: string | null;
}

export default function ProjectWorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [scenes, setScenes] = useState<MappedScene[]>([]);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefining, setIsRefining] = useState(false);
  const [activePreviewVideo, setActivePreviewVideo] = useState<string | null>(null);

  // Inspector State
  const [cameraMode, setCameraMode] = useState("Dolly");
  const [lightingMode, setLightingMode] = useState("Neon");
  const [motionSpeed, setMotionSpeed] = useState("Slow");

  useEffect(() => {
    async function loadProject() {
      setIsLoading(true);
      const data = await fetchProjectById(projectId);
      if (data) {
        setProject(data as ProjectData);
        const mappedScenes: MappedScene[] = ((data as ProjectData).scenes || []).map((sc: SceneData) => ({
          id: sc.id,
          number: sc.sceneNumber,
          duration: sc.duration,
          prompt: sc.prompt,
          camera: sc.cameraMovement || "Dolly",
          lighting: sc.lightingStyle || "Neon",
          motion: "Slow",
          status: sc.generations && sc.generations.length > 0 ? sc.generations[0].status : "Ready",
          progress: sc.generations && sc.generations.length > 0 && sc.generations[0].status === "Completed" ? 100 : 0,
          videoUrl: sc.generations && sc.generations.length > 0 && sc.generations[0].videoUrl ? sc.generations[0].videoUrl : null
        }));
        setScenes(mappedScenes);
        if (mappedScenes.length > 0) {
          if (mappedScenes[0].videoUrl) setActivePreviewVideo(mappedScenes[0].videoUrl);
          setCameraMode(mappedScenes[0].camera);
          setLightingMode(mappedScenes[0].lighting);
        }
      }
      setIsLoading(false);
    }
    loadProject();
  }, [projectId]);

  const currentScene = scenes[selectedSceneIndex] || scenes[0];

  const handleSelectScene = (index: number) => {
    setSelectedSceneIndex(index);
    const sc = scenes[index];
    if (sc) {
      setCameraMode(sc.camera || "Dolly");
      setLightingMode(sc.lighting || "Neon");
      setMotionSpeed(sc.motion || "Slow");
      if (sc.videoUrl) setActivePreviewVideo(sc.videoUrl);
    }
  };

  const handleRefineCurrentScenePrompt = async () => {
    if (!currentScene || !currentScene.prompt) return;
    setIsRefining(true);
    const refined = await refinePrompt(currentScene.prompt, "Cinematic");
    if (refined && refined.refinedPrompt) {
      setScenes(prev => prev.map((sc, i) => i === selectedSceneIndex ? { ...sc, prompt: refined.refinedPrompt } : sc));
    }
    setIsRefining(false);
  };

  const handleGenerateScene = async (sceneId: string) => {
    setScenes(prev => prev.map(sc => sc.id === sceneId ? { ...sc, status: "Generating", progress: 15 } : sc));

    const sceneToGen = scenes.find(s => s.id === sceneId);
    if (!sceneToGen) return;

    const res = await startVideoGeneration(sceneToGen.prompt, sceneToGen.duration, "9:16");
    if (res && res.operationId) {
      const opId = res.operationId;
      
      const interval = setInterval(async () => {
        const opStatus = await checkOperationStatus(opId);
        if (opStatus) {
          setScenes(prev => prev.map(sc => {
            if (sc.id === sceneId) {
              const isDone = opStatus.isDone;
              const video = isDone ? opStatus.videoUrl || null : null;
              if (isDone && video) setActivePreviewVideo(video);

              return {
                ...sc,
                progress: opStatus.progressPercentage,
                status: isDone ? "Completed" : "Generating",
                videoUrl: video || sc.videoUrl
              };
            }
            return sc;
          }));

          if (opStatus.isDone) {
            clearInterval(interval);
          }
        }
      }, 1400);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-zinc-500 font-mono">Đang tải Studio Workspace...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Studio Header Bar */}
      <div className="flex items-center justify-between studio-panel p-4 border border-[#27272a] bg-[#111113]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400">Dự Án /</span>
          <h1 className="text-base font-semibold text-white tracking-tight font-display">{project?.title || "Hanoi Night"}</h1>
          <span className="text-[10px] font-mono text-[#a78bfa] px-2 py-0.5 rounded bg-[#8b5cf6]/10 border border-[#8b5cf6]/30">
            Veo 3.1 • 1080p
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-1.5 rounded-[8px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-[#7c3aed]/20 transition-all">
            <span>Xuất Video</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Studio Viewport: Preview (Left) + Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Viewport: Large Video Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="studio-panel p-4 border border-[#27272a] bg-[#09090b] relative">
            <div className="relative aspect-video bg-[#000000] rounded-[12px] overflow-hidden border border-[#27272a] flex items-center justify-center max-h-[440px] mx-auto">
              {currentScene?.status === "Generating" ? (
                /* AI Generation Animation State */
                <div className="p-8 text-center space-y-4 w-full max-w-md">
                  <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#a78bfa] mx-auto animate-pulse">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center justify-center gap-1.5 font-display">
                      <span>✦ Đang Tạo Phân Cảnh AI...</span>
                    </h4>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">Gửi prompt điện ảnh tới Veo 3.1 engine...</p>
                  </div>
                  <div className="w-full bg-[#161618] h-2 rounded-full overflow-hidden border border-[#27272a]">
                    <div 
                      className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] h-full transition-all duration-300"
                      style={{ width: `${currentScene?.progress || 45}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-[#a78bfa] font-bold">{currentScene?.progress || 45}%</span>
                </div>
              ) : activePreviewVideo ? (
                <video
                  src={activePreviewVideo}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Film className="w-10 h-10 text-zinc-700 mx-auto" />
                  <p className="text-xs text-zinc-500">Chọn một phân cảnh bên dưới hoặc bấm &quot;Render Veo 3.1 ✦&quot; để xem trước video.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 text-xs text-zinc-400 font-mono">
              <span>Scene {currentScene?.number || 1} ({currentScene?.duration || 8}s)</span>
              <span>Audio: Nhạc Nền &amp; Âm Thanh Tự Động</span>
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
              <span className="text-[10px] font-mono text-zinc-400">Scene 0{currentScene?.number || 1}</span>
            </div>

            {/* Prompt Editor & Refiner */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-mono uppercase text-zinc-400">Prompt Scene</label>
                <button
                  onClick={handleRefineCurrentScenePrompt}
                  disabled={isRefining || !currentScene?.prompt}
                  className="text-[10px] text-[#a78bfa] hover:underline font-mono flex items-center gap-1 disabled:opacity-40"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Tối Ưu AI ✦</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={currentScene?.prompt || ""}
                onChange={(e) => {
                  const updatedPrompt = e.target.value;
                  setScenes(prev => prev.map((sc, i) => i === selectedSceneIndex ? { ...sc, prompt: updatedPrompt } : sc));
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
                    onClick={() => {
                      setCameraMode(c);
                      setScenes(prev => prev.map((sc, i) => i === selectedSceneIndex ? { ...sc, camera: c } : sc));
                    }}
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
                    onClick={() => {
                      setLightingMode(l);
                      setScenes(prev => prev.map((sc, i) => i === selectedSceneIndex ? { ...sc, lighting: l } : sc));
                    }}
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
                    onClick={() => {
                      setMotionSpeed(m);
                      setScenes(prev => prev.map((sc, i) => i === selectedSceneIndex ? { ...sc, motion: m } : sc));
                    }}
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
              <label className="block text-[10px] font-mono uppercase text-zinc-400">Ảnh Tham Chiếu Nhân Vật</label>
              <button className="w-full py-2 rounded-[8px] border border-dashed border-[#27272a] hover:border-[#8b5cf6]/50 text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 transition-all">
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Ảnh Reference</span>
              </button>
            </div>

            {/* Regenerate Button */}
            <button
              onClick={() => handleGenerateScene(currentScene?.id)}
              disabled={currentScene?.status === "Generating"}
              className="w-full py-2.5 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs shadow-md shadow-[#7c3aed]/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Render Veo 3.1 Scene ✦</span>
            </button>
          </div>
        </div>
      </div>

      {/* Professional Multi-Track Video Timeline */}
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
            <div className="flex-1 grid grid-cols-4 gap-2">
              {scenes.map((sc, index) => (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScene(index)}
                  className={`p-3 rounded-[8px] text-left transition-all border ${
                    selectedSceneIndex === index
                      ? "bg-[#8b5cf6]/20 border-[#8b5cf6] text-white shadow-sm shadow-[#8b5cf6]/30"
                      : "bg-[#161618] border-[#27272a] text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="font-bold">Scene {sc.number}</span>
                    <span className="text-[10px] opacity-70">{sc.duration}s</span>
                  </div>
                  <p className="text-[10px] truncate font-mono text-zinc-300">{sc.prompt}</p>
                </button>
              ))}
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
              🎵 Nhạc Nền Điện Ảnh Atmos (Veo 3.1 Audio)
            </div>
          </div>

          {/* Track 4: Subtitles Track */}
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
