"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Flower2, ArrowRight, Loader2, Wand2 } from "lucide-react";
import { orchestrateDirector, createProject, refinePrompt } from "@/lib/api";

interface SceneResult {
  sceneNumber: number;
  duration: number;
  prompt: string;
  cameraMovement: string;
  lightingStyle: string;
}

interface OrchestrationData {
  title?: string;
  genre?: string;
  audience?: string;
  duration?: number;
  hook?: string;
  storyboard?: {
    scenes?: SceneResult[];
  };
}

function CreateVideoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [idea, setIdea] = useState("");
  const [duration, setDuration] = useState(30);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [style, setStyle] = useState("Anime");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orchestrationResult, setOrchestrationResult] = useState<OrchestrationData | null>(null);

  useEffect(() => {
    let pendingVal = "";
    if (typeof window !== "undefined") {
      const pendingIdea = sessionStorage.getItem("cineai_pending_idea");
      if (pendingIdea) {
        pendingVal = pendingIdea;
        sessionStorage.removeItem("cineai_pending_idea");
      }
    }
    const urlIdea = searchParams.get("idea");
    if (!pendingVal && urlIdea) {
      pendingVal = urlIdea;
    }
    if (pendingVal) {
      const timer = setTimeout(() => {
        setIdea(pendingVal);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleRefinePrompt = async () => {
    if (!idea.trim()) return;
    setIsRefining(true);
    const refined = await refinePrompt(idea, style);
    if (refined && refined.refinedPrompt) {
      setIdea(refined.refinedPrompt);
    }
    setIsRefining(false);
  };

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setIsLoading(true);
    const result = await orchestrateDirector({
      idea,
      targetDuration: duration,
      aspectRatio,
      style,
    });
    setIsLoading(false);

    if (result) {
      setOrchestrationResult(result);
    }
  };

  const handleSaveAndOpenWorkspace = async () => {
    if (!orchestrationResult) return;
    setIsSaving(true);

    const scenes = (orchestrationResult.storyboard?.scenes || []).map((sc: SceneResult) => ({
      sceneNumber: sc.sceneNumber,
      duration: sc.duration,
      prompt: sc.prompt,
      cameraMovement: sc.cameraMovement,
      lightingStyle: sc.lightingStyle,
    }));

    const newProjectData = {
      title: orchestrationResult.title || "New AI Project",
      description: orchestrationResult.hook || idea,
      prompt: idea,
      aspectRatio: aspectRatio,
      style: style,
      targetDuration: duration,
      scenes,
    };

    const created = await createProject(newProjectData);
    setIsSaving(false);

    if (created && created.jobId) {
      router.push(`/create/review?jobId=${created.jobId}`);
    } else {
      router.push(`/dashboard`);
    }
  };

  return (
    <div className="space-y-8 relative z-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2 font-display">
          <span>Tạo Video Cùng Sakura AI</span>
          <span className="text-[var(--color-sakura-pink)] text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-sakura-pink)]/10 border border-[var(--color-sakura-pink)]/30">⛩️ AI Director</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Nhập ý tưởng của bạn hoặc dùng AI Tối Ưu Prompt để biến ý tưởng thô thành kịch bản điện ảnh.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column: What Do You Want To Create? */}
        <div className="lg:col-span-5 space-y-6 sticky top-24 h-fit">
          <div className="studio-panel glass-studio p-6 space-y-5 relative overflow-hidden">
            {/* Torii glowing corner decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-torii-red)]/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between relative z-10">
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Ý Tưởng Video Của Bạn</h2>
              
              <button
                type="button"
                onClick={handleRefinePrompt}
                disabled={isRefining || !idea.trim()}
                className="px-2.5 py-1 rounded-[6px] bg-[var(--color-sakura-pink)]/10 hover:bg-[var(--color-sakura-pink)]/20 border border-[var(--color-sakura-pink)]/30 text-[var(--color-sakura-pink)] text-[11px] font-medium flex items-center gap-1.5 transition-all disabled:opacity-40"
              >
                {isRefining ? (
                  <>
                    <div className="w-3 h-3 border-2 border-[var(--color-sakura-pink)]/30 border-t-[var(--color-sakura-pink)] rounded-full animate-spin" />
                    <span>Đang Tối Ưu...</span>
                  </>
                ) : (
                  <>
                    <Flower2 className="w-3.5 h-3.5 text-[var(--color-sakura-pink)]" />
                    <span>Tối Ưu Sakura AI 🌸</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="relative z-10">
              <textarea
                rows={4}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Mô tả ý tưởng... (VD: Nữ samurai đi bộ trong rừng trúc Arashiyama...)"
                className="w-full bg-[#111] border border-[var(--color-charcoal-border)] rounded-[10px] p-3.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[var(--color-torii-red)] transition-all resize-none font-sans"
              />
            </div>

            <div className="relative z-10">
              <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">Phong Cách Mĩ Thuật</label>
              <div className="grid grid-cols-2 gap-2">
                {["Cinematic", "Anime", "Ukiyo-e", "Cyberpunk", "SciFi", "Realistic"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStyle(st)}
                    className={`py-2 px-3 rounded-[8px] text-xs font-medium border transition-all ${
                      style === st
                        ? "bg-[var(--color-torii-red)]/20 border-[var(--color-torii-red)] text-white glow-torii"
                        : "bg-[#111] border-[var(--border-color)] text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1 relative z-10">
              <div>
                <label className="block text-[10px] font-medium text-zinc-400 uppercase mb-1">Thời Lượng</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-[#111] border border-[var(--border-color)] rounded-[8px] p-2 text-xs text-zinc-200 focus:border-[var(--color-torii-red)] outline-none"
                >
                  <option value={15}>15 giây</option>
                  <option value={30}>30 giây</option>
                  <option value={60}>60 giây</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-zinc-400 uppercase mb-1">Tỉ Lệ Khung</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-[#111] border border-[var(--border-color)] rounded-[8px] p-2 text-xs text-zinc-200 focus:border-[var(--color-torii-red)] outline-none"
                >
                  <option value="9:16">9:16 Dọc</option>
                  <option value="16:9">16:9 Ngang</option>
                  <option value="1:1">1:1 Vuông</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-zinc-400 uppercase mb-1">Chất Lượng</label>
                <div className="bg-[#111] border border-[var(--border-color)] rounded-[8px] p-2 text-xs text-zinc-300 font-mono text-center">
                  1080p
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full btn-studio-primary py-3.5 flex items-center justify-center gap-2 transition-all disabled:opacity-50 relative z-10"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI Director Đang Dựng Cảnh...</span>
                </>
              ) : (
                <>
                  <span>🌸 Phân Cảnh &amp; Sinh Kịch Bản</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Director Plan */}
        <div className="lg:col-span-7 space-y-6">
          {orchestrationResult ? (
            <div className="space-y-5">
              <div className="studio-panel glass-studio p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2 font-display">
                    <Flower2 className="w-4 h-4 text-[var(--color-sakura-pink)]" />
                    <span>Kịch Bản Sakura AI</span>
                  </h2>
                  <button
                    onClick={handleSaveAndOpenWorkspace}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-[8px] btn-studio-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang Khởi Động Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <span>Mở Editor Không Gian Gốc</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Hook */}
                  <div className="p-3.5 rounded-[10px] bg-[#111] border border-l-4 border-l-[var(--color-sakura-pink)] border-[var(--border-color)] space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[var(--color-sakura-pink)] uppercase">01 Hook Điểm Nhấn</span>
                    <p className="text-xs text-zinc-200 italic">&quot;{orchestrationResult.hook}&quot;</p>
                  </div>

                  {/* Scenes */}
                  {orchestrationResult.storyboard?.scenes?.map((sc: SceneResult, idx: number) => (
                    <div key={sc.sceneNumber} className="p-3.5 rounded-[10px] bg-[#111] border border-l-4 border-l-[var(--color-torii-red)] border-[var(--border-color)] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-white">0{idx + 2} Scene {sc.sceneNumber} ({sc.duration}s)</span>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono">
                          <span>{sc.cameraMovement}</span>
                          <span className="text-[var(--color-torii-red)]">•</span>
                          <span>{sc.lightingStyle}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 font-mono bg-[#161616] p-2.5 rounded-[8px] border border-[var(--border-color)]">
                        {sc.prompt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="studio-panel glass-studio p-12 text-center space-y-3 flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-torii-red)]/10 border border-[var(--color-torii-red)]/20 flex items-center justify-center text-[var(--color-torii-red)] glow-torii">
                <Wand2 className="w-6 h-6" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-sm font-semibold text-white font-display">Đợi Ý Tưởng Của Bạn</h3>
                <p className="text-xs text-zinc-500">Bấm &quot;Tối Ưu Sakura AI 🌸&quot; để Gemini tinh chỉnh ý tưởng của bạn thành kịch bản điện ảnh chuẩn xác nhất.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateVideoPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-zinc-500">Đang tải Sakura AI Director...</div>}>
      <CreateVideoForm />
    </Suspense>
  );
}
