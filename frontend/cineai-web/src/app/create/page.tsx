"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Wand2, ArrowRight } from "lucide-react";
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
  const initialIdea = searchParams.get("idea") || "Phố cổ Hà Nội ban đêm với mưa lún phún và ánh đèn neon rực rỡ.";

  const [idea, setIdea] = useState(initialIdea);
  const [duration, setDuration] = useState(30);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [style, setStyle] = useState("Cinematic");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orchestrationResult, setOrchestrationResult] = useState<OrchestrationData | null>(null);

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
    setIsLoading(true);
    const result = await orchestrateDirector({
      idea,
      targetDuration: duration,
      aspectRatio,
      style,
    });
    if (result) {
      setOrchestrationResult(result as OrchestrationData);
    }
    setIsLoading(false);
  };

  const handleSaveAndOpenWorkspace = async () => {
    if (!orchestrationResult) return;
    setIsSaving(true);

    const newProjectData = {
      title: orchestrationResult.title || "New AI Project",
      description: orchestrationResult.hook || idea,
      aspectRatio: aspectRatio === "9:16" ? 1 : 0,
      style: 0,
      targetDuration: duration,
      scenes: (orchestrationResult.storyboard?.scenes || []).map((sc: SceneResult) => ({
        sceneNumber: sc.sceneNumber,
        duration: sc.duration,
        prompt: sc.prompt,
        cameraMovement: sc.cameraMovement,
        lightingStyle: sc.lightingStyle,
      })),
    };

    const created = await createProject(newProjectData);
    setIsSaving(false);
    if (created && created.id) {
      router.push(`/projects/${created.id}`);
    } else {
      router.push(`/projects/22222222-2222-2222-2222-222222222222`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2 font-display">
          <span>Tạo Video AI</span>
          <span className="text-[#a78bfa] text-xs font-mono px-2 py-0.5 rounded bg-[#8b5cf6]/10 border border-[#8b5cf6]/30">✦ AI Director</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Nhập ý tưởng của bạn hoặc dùng AI Tối Ưu Prompt để biến ý tưởng thô thành kịch bản điện ảnh chuẩn Veo 3.1 &amp; Gemini 3.1 Pro.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: What Do You Want To Create? */}
        <div className="lg:col-span-5 space-y-6">
          <div className="studio-panel p-6 border border-[#27272a] space-y-5 bg-[#111113]">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Ý Tưởng Video Của Bạn</h2>
              
              {/* Magic AI Prompt Enhancer Button */}
              <button
                type="button"
                onClick={handleRefinePrompt}
                disabled={isRefining || !idea.trim()}
                className="px-2.5 py-1 rounded-[6px] bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[#a78bfa] text-[11px] font-medium flex items-center gap-1.5 transition-all disabled:opacity-40"
              >
                {isRefining ? (
                  <>
                    <div className="w-3 h-3 border-2 border-[#a78bfa]/30 border-t-[#a78bfa] rounded-full animate-spin" />
                    <span>Đang Tối Ưu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
                    <span>Tối Ưu Prompt Bằng AI ✦</span>
                  </>
                )}
              </button>
            </div>
            
            <div>
              <textarea
                rows={4}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Mô tả ý tưởng video của bạn... (VD: Phố cổ Hà Nội ban đêm với mưa lún phún và ánh đèn neon...)"
                className="w-full bg-[#161618] border border-[#27272a] rounded-[10px] p-3.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#8b5cf6] transition-all resize-none font-sans"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">Phong Cách Điện Ảnh</label>
              <div className="grid grid-cols-2 gap-2">
                {["Cinematic", "Documentary", "Anime", "Ads", "SciFi", "Realistic"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStyle(st)}
                    className={`py-2 px-3 rounded-[8px] text-xs font-medium border transition-all ${
                      style === st
                        ? "bg-[#8b5cf6]/20 border-[#8b5cf6] text-[#a78bfa]"
                        : "bg-[#161618] border-[#27272a] text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-medium text-zinc-400 uppercase mb-1">Thời Lượng</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-2 text-xs text-zinc-200"
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
                  className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-2 text-xs text-zinc-200"
                >
                  <option value="9:16">9:16 Dọc</option>
                  <option value="16:9">16:9 Ngang</option>
                  <option value="1:1">1:1 Vuông</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-zinc-400 uppercase mb-1">Chất Lượng</label>
                <div className="bg-[#161618] border border-[#27272a] rounded-[8px] p-2 text-xs text-zinc-300 font-mono text-center">
                  1080p
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-3.5 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs shadow-lg shadow-[#7c3aed]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI Director Đang Phân Cảnh...</span>
                </>
              ) : (
                <>
                  <span>✦ Phân Cảnh &amp; Sinh Kịch Bản AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Director 2-Column Plan */}
        <div className="lg:col-span-7 space-y-6">
          {orchestrationResult ? (
            <div className="space-y-5">
              <div className="studio-panel p-6 border border-[#27272a] space-y-4">
                <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2 font-display">
                    <Sparkles className="w-4 h-4 text-[#a78bfa]" />
                    <span>Kịch Bản AI Director Plan</span>
                  </h2>
                  <button
                    onClick={handleSaveAndOpenWorkspace}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-[8px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#7c3aed]/20 disabled:opacity-50"
                  >
                    <span>Mở Trong Studio Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* 01 Hook */}
                  <div className="p-3.5 rounded-[10px] bg-[#161618] border border-[#27272a] space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[#a78bfa] uppercase">01 Hook Điểm Nhấn</span>
                    <p className="text-xs text-zinc-200 italic">&quot;{orchestrationResult.hook}&quot;</p>
                  </div>

                  {/* Scenes */}
                  {orchestrationResult.storyboard?.scenes?.map((sc: SceneResult, idx: number) => (
                    <div key={sc.sceneNumber} className="p-3.5 rounded-[10px] bg-[#161618] border border-[#27272a] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-white">0{idx + 2} Scene {sc.sceneNumber} ({sc.duration}s)</span>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono">
                          <span>{sc.cameraMovement}</span>
                          <span>•</span>
                          <span>{sc.lightingStyle}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 font-mono bg-[#09090b] p-2.5 rounded-[8px] border border-[#27272a]">
                        {sc.prompt}
                      </p>
                    </div>
                  ))}

                  {/* Conclusion */}
                  <div className="p-3.5 rounded-[10px] bg-[#161618] border border-[#27272a] space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[#a78bfa] uppercase">05 Kết Luận</span>
                    <p className="text-xs text-zinc-400">Các phân cảnh đã được tối ưu hóa cho Veo 3.1 và sẵn sàng ghép nối sound track.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="studio-panel p-12 text-center space-y-3 flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center text-[#a78bfa]">
                <Wand2 className="w-6 h-6" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-sm font-semibold text-white font-display">Nhập Ý Tưởng Video Của Bạn</h3>
                <p className="text-xs text-zinc-500">Bấm &quot;Tối Ưu Prompt Bằng AI ✦&quot; để Gemini 3.1 Pro tinh chỉnh ý tưởng thô thành prompt điện ảnh chuyên nghiệp trước khi sinh kịch bản.</p>
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
    <Suspense fallback={<div className="p-12 text-center text-xs text-zinc-500">Đang tải AI Director...</div>}>
      <CreateVideoForm />
    </Suspense>
  );
}
