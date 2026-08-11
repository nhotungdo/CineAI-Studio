"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Play,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Edit3,
  Check,
  Film,
  Camera,
  Sun,
  Clock,
  Layers,
  UserCheck
} from "lucide-react";
import {
  fetchJobStoryboard,
  updateStoryboardScene,
  deleteStoryboardScene,
  addStoryboardScene,
  reorderStoryboardScenes,
  regenerateScenePrompt,
  approveStoryboard
} from "@/lib/api";

interface SceneItem {
  sceneId: string;
  sceneNumber: number;
  title: string;
  description: string;
  prompt: string;
  duration: number;
  cameraMovement: string;
  lightingStyle: string;
  visualStyle?: string;
  status: string;
}

interface StoryboardData {
  jobId: string;
  status: string;
  prompt: string;
  title: string;
  concept: string;
  script: {
    title?: string;
    genre?: string;
    logline?: string;
    fullText?: string;
  } | string;
  visualStyle: string;
  characters: { name: string; role: string; appearance: string; clothing: string }[];
  aspectRatio?: string;
  duration?: number;
  resolution?: string;
  scenes: SceneItem[];
}

function StoryboardReviewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [data, setData] = useState<StoryboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editCamera, setEditCamera] = useState("");
  const [editLighting, setEditLighting] = useState("");
  const [editDuration, setEditDuration] = useState(6);
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({});
  const [isRegenerating, setIsRegenerating] = useState<{ [key: string]: boolean }>({});
  const [isApproving, setIsApproving] = useState(false);

  const loadData = async () => {
    if (!jobId) return;
    setIsLoading(true);
    const res = await fetchJobStoryboard(jobId);
    if (res) setData(res);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [jobId]);

  const handleStartEdit = (sc: SceneItem) => {
    setEditingSceneId(sc.sceneId);
    setEditPrompt(sc.prompt);
    setEditCamera(sc.cameraMovement);
    setEditLighting(sc.lightingStyle);
    setEditDuration(sc.duration);
  };

  const handleSaveEdit = async (sceneId: string) => {
    if (!jobId) return;
    await updateStoryboardScene(jobId, sceneId, {
      prompt: editPrompt,
      cameraMovement: editCamera,
      lightingStyle: editLighting,
      duration: editDuration
    });
    setEditingSceneId(null);
    await loadData();
  };

  const handleDelete = async (sceneId: string) => {
    if (!jobId) return;
    await deleteStoryboardScene(jobId, sceneId);
    await loadData();
  };

  const handleAddScene = async () => {
    if (!jobId) return;
    await addStoryboardScene(jobId, {
      title: `Scene ${(data?.scenes?.length || 0) + 1}`,
      prompt: "Cinematic shot of hero in neon rain environment, 8k resolution, Veo 3.1 render.",
      duration: 6,
      cameraMovement: "slow dolly forward",
      lightingStyle: "neon atmospheric backlight"
    });
    await loadData();
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    if (!data || !jobId) return;
    const scenes = [...data.scenes];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= scenes.length) return;

    const temp = scenes[index];
    scenes[index] = scenes[targetIdx];
    scenes[targetIdx] = temp;

    const orders = scenes.map((s, i) => ({ sceneId: s.sceneId, sceneNumber: i + 1 }));
    await reorderStoryboardScenes(jobId, orders);
    await loadData();
  };

  const handleRegenerate = async (sceneId: string) => {
    if (!jobId) return;
    setIsRegenerating({ ...isRegenerating, [sceneId]: true });
    const feedback = feedbackInput[sceneId] || "Make prompt more epic, dramatic, and photorealistic for Veo 3.1";
    await regenerateScenePrompt(jobId, sceneId, feedback);
    setIsRegenerating({ ...isRegenerating, [sceneId]: false });
    await loadData();
  };

  const handleApprove = async () => {
    if (!jobId) return;
    setIsApproving(true);
    const res = await approveStoryboard(jobId);
    if (res && res.status) {
      router.push(`/videos/${jobId}/status`);
    } else {
      router.push(`/videos/${jobId}/status`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6] rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-400 font-mono">Gemini 3.1 Pro AI Director đang chuẩn bị Storyboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-xs text-zinc-500">
        Không tìm thấy thông tin Storyboard cho Job này.
      </div>
    );
  }

  const scriptText = typeof data.script === "object" ? data.script.fullText || data.script.logline : data.script;

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272a] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight font-display">{data.title}</h1>
            <span className="px-2.5 py-0.5 rounded-[6px] bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#a78bfa] text-xs font-mono font-semibold">
              ✦ AI Director Storyboard
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">{data.concept}</p>
        </div>

        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="px-6 py-3 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs shadow-lg shadow-[#7c3aed]/25 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isApproving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang Khởi Động Video AI...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Duyệt Storyboard &amp; Sinh Video 🎬</span>
            </>
          )}
        </button>
      </div>

      {/* Concept & Metadata Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 studio-panel border border-[#27272a] space-y-1.5 bg-[#111113]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#a78bfa] font-mono">
            <Film className="w-3.5 h-3.5" />
            <span>KỊCH BẢN &amp; PHONG CÁCH</span>
          </div>
          <p className="text-xs text-zinc-300 font-sans line-clamp-3">{scriptText}</p>
          <div className="text-[10px] text-zinc-500 font-mono pt-1">Style: {data.visualStyle}</div>
        </div>

        <div className="p-4 studio-panel border border-[#27272a] space-y-1.5 bg-[#111113]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#a78bfa] font-mono">
            <UserCheck className="w-3.5 h-3.5" />
            <span>NHÂN VẬT CHÍNH</span>
          </div>
          {data.characters && data.characters.length > 0 ? (
            <div className="space-y-1 text-xs text-zinc-300">
              {data.characters.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-zinc-200">{c.name} ({c.role})</span>
                  <span className="text-zinc-500 font-mono">{c.appearance}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">Không có metadata nhân vật đặc biệt.</p>
          )}
        </div>

        <div className="p-4 studio-panel border border-[#27272a] space-y-1.5 bg-[#111113]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#a78bfa] font-mono">
            <Layers className="w-3.5 h-3.5" />
            <span>THÔNG SỐ RENDER</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-300">
            <div>Tỉ lệ: <strong className="text-white">{data.aspectRatio}</strong></div>
            <div>Thời lượng: <strong className="text-white">{data.duration}s</strong></div>
            <div>Độ phân giải: <strong className="text-white">{data.resolution}</strong></div>
            <div>Tổng phân cảnh: <strong className="text-white">{data.scenes.length} Scenes</strong></div>
          </div>
        </div>
      </div>

      {/* Storyboard Scene Review Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-display">
          <span>Danh Sách Phân Cảnh (Storyboard)</span>
          <span className="text-xs font-mono text-zinc-400 font-normal">({data.scenes.length} Phân Cảnh)</span>
        </h2>

        <button
          onClick={handleAddScene}
          className="px-3.5 py-1.5 rounded-[8px] bg-[#161618] hover:bg-[#27272a] border border-[#27272a] text-xs text-zinc-200 font-medium flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-[#a78bfa]" />
          <span>Thêm Phân Cảnh</span>
        </button>
      </div>

      {/* Storyboard Grid */}
      <div className="space-y-4">
        {data.scenes.map((sc, index) => {
          const isEditing = editingSceneId === sc.sceneId;

          return (
            <div
              key={sc.sceneId}
              className="p-5 studio-panel border border-[#27272a] bg-[#111113] rounded-[14px] space-y-4 hover:border-[#8b5cf6]/40 transition-all"
            >
              {/* Scene Header */}
              <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#a78bfa] font-mono text-xs font-bold flex items-center justify-center">
                    0{sc.sceneNumber}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-display">{sc.title}</h3>
                    <p className="text-[11px] text-zinc-400">{sc.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className="p-1.5 rounded-[6px] bg-[#161618] hover:bg-[#27272a] text-zinc-400 hover:text-white disabled:opacity-30 transition-all"
                    title="Di chuyển lên"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(index, "down")}
                    disabled={index === data.scenes.length - 1}
                    className="p-1.5 rounded-[6px] bg-[#161618] hover:bg-[#27272a] text-zinc-400 hover:text-white disabled:opacity-30 transition-all"
                    title="Di chuyển xuống"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {!isEditing && (
                    <button
                      onClick={() => handleStartEdit(sc)}
                      className="p-1.5 rounded-[6px] bg-[#161618] hover:bg-[#27272a] text-zinc-400 hover:text-white transition-all ml-1"
                      title="Chỉnh sửa phân cảnh"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#a78bfa]" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(sc.sceneId)}
                    className="p-1.5 rounded-[6px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                    title="Xóa phân cảnh"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scene Content */}
              {isEditing ? (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">PROMPT PHÂN CẢNH VEO 3.1</label>
                    <textarea
                      rows={3}
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      className="w-full bg-[#161618] border border-[#8b5cf6] rounded-[8px] p-3 text-xs text-white focus:outline-none resize-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">GÓC QUAY (CAMERA)</label>
                      <input
                        type="text"
                        value={editCamera}
                        onChange={(e) => setEditCamera(e.target.value)}
                        className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-2 text-xs text-zinc-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">ÁNH SÁNG (LIGHTING)</label>
                      <input
                        type="text"
                        value={editLighting}
                        onChange={(e) => setEditLighting(e.target.value)}
                        className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-2 text-xs text-zinc-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">THỜI LƯỢNG (GIÂY)</label>
                      <input
                        type="number"
                        value={editDuration}
                        onChange={(e) => setEditDuration(Number(e.target.value))}
                        className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-2 text-xs text-zinc-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingSceneId(null)}
                      className="px-3 py-1.5 rounded-[6px] bg-[#161618] text-zinc-400 hover:text-white text-xs font-medium"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      onClick={() => handleSaveEdit(sc.sceneId)}
                      className="px-4 py-1.5 rounded-[6px] bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Lưu Thay Đổi</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-[#09090b] p-3.5 rounded-[10px] border border-[#27272a] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1.5 text-[#a78bfa]">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{sc.cameraMovement}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <Sun className="w-3.5 h-3.5" />
                        <span>{sc.lightingStyle}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{sc.duration}s</span>
                      </span>
                    </div>

                    <p className="text-xs text-zinc-200 font-mono leading-relaxed pt-1">{sc.prompt}</p>
                  </div>

                  {/* Regenerate Prompt Section */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Ý kiến chỉnh sửa prompt (VD: 'Thêm ánh sáng neon rực rỡ hơn', 'Đổi sang góc quay drone high angle'...)"
                      value={feedbackInput[sc.sceneId] || ""}
                      onChange={(e) => setFeedbackInput({ ...feedbackInput, [sc.sceneId]: e.target.value })}
                      className="flex-1 bg-[#161618] border border-[#27272a] rounded-[8px] px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#8b5cf6]"
                    />

                    <button
                      onClick={() => handleRegenerate(sc.sceneId)}
                      disabled={isRegenerating[sc.sceneId]}
                      className="px-3 py-1.5 rounded-[8px] bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[#a78bfa] text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-40 whitespace-nowrap"
                    >
                      {isRegenerating[sc.sceneId] ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Gemini 3.1 Đang Tạo Lại...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Tạo Lại Prompt AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky Footer Bar for Approval */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#09090b]/90 backdrop-blur-md border-t border-[#27272a] z-50 flex items-center justify-between max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-zinc-300 font-mono">
            Tất cả <strong className="text-white">{data.scenes.length} phân cảnh</strong> đã sẵn sàng cho Video Engine.
          </span>
        </div>

        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="px-8 py-3 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs shadow-lg shadow-[#7c3aed]/25 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isApproving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang Gửi Job Cho Veo 3.1...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Duyệt Storyboard &amp; Sinh Video Phân Cảnh (Start Render)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function StoryboardReviewPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-zinc-500">Đang tải Storyboard...</div>}>
      <StoryboardReviewForm />
    </Suspense>
  );
}
