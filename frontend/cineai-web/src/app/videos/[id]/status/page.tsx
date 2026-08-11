"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Play,
  Film,
  Sparkles,
  ArrowRight,
  Layers
} from "lucide-react";
import { fetchJobProgress, retryScene } from "@/lib/api";

interface SceneProgress {
  sceneId: string;
  sceneNumber: number;
  title: string;
  description: string;
  duration: number;
  prompt: string;
  cameraMovement: string;
  lightingStyle: string;
  status: string;
  errorMessage?: string;
  videoUrl?: string;
}

interface JobProgressData {
  jobId: string;
  status: string;
  progressPercentage: number;
  totalScenes: number;
  completedScenes: number;
  finalVideoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  scenes: SceneProgress[];
}

export default function JobStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;
  const router = useRouter();

  const [data, setData] = useState<JobProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryingSceneId, setRetryingSceneId] = useState<string | null>(null);

  const loadProgress = async () => {
    if (!jobId) return;
    const res = await fetchJobProgress(jobId);
    if (res) {
      setData(res);
      if (res.status === "Completed" && res.finalVideoUrl) {
        // Auto navigate to video player if completed
        // router.push(`/videos/${jobId}`);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadProgress();
    const interval = setInterval(() => {
      loadProgress();
    }, 3000); // Poll every 3 seconds for real-time progress

    // SSE fallback setup
    const eventSource = new EventSource(`http://localhost:5000/api/Video/jobs/${jobId}/events`);
    eventSource.onmessage = () => {
      loadProgress();
    };

    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }, [jobId]);

  const handleRetry = async (sceneId: string) => {
    setRetryingSceneId(sceneId);
    await retryScene(jobId, sceneId);
    await loadProgress();
    setRetryingSceneId(null);
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6] rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-400 font-mono">Đang kết nối Real-time Progress Tracking System...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-xs text-zinc-500">
        Không tìm thấy thông tin tiến trình Video Job này.
      </div>
    );
  }

  const isCompleted = data.status === "Completed";
  const isFailed = data.status === "Failed";

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="p-6 studio-panel border border-[#27272a] bg-[#111113] rounded-[16px] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight font-display">Tiến Trình Tạo Video Pipeline</h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-mono font-semibold uppercase ${
                  isCompleted
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : isFailed
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-[#8b5cf6]/20 text-[#a78bfa] border border-[#8b5cf6]/30 animate-pulse"
                }`}
              >
                ● {data.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-1">Job ID: {data.jobId}</p>
          </div>

          {isCompleted && (
            <Link
              href={`/videos/${jobId}`}
              className="px-5 py-2.5 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs shadow-lg shadow-[#7c3aed]/25 flex items-center gap-2 transition-all"
            >
              <span>Xem Video Hoàn Chỉnh</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Progress Bar Section */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>Đang sinh các phân cảnh video...</span>
            </span>
            <span className="text-[#a78bfa] font-bold">
              {data.completedScenes} / {data.totalScenes} scenes completed ({data.progressPercentage}%)
            </span>
          </div>

          <div className="w-full h-3 bg-[#161618] rounded-full overflow-hidden border border-[#27272a] p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#7c3aed] to-[#8b5cf6] rounded-full transition-all duration-500 shadow-sm shadow-[#7c3aed]/50"
              style={{ width: `${Math.min(100, Math.max(5, data.progressPercentage))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Real-time Scene Status Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 font-display">
          <Layers className="w-4 h-4 text-[#a78bfa]" />
          <span>Trạng Thái Chi Tiết Từng Phân Cảnh (Granular Tracking)</span>
        </h2>

        <div className="space-y-3">
          {data.scenes.map((sc) => {
            const scDone = sc.status === "ReadyForMerge" || sc.status === "Merged";
            const scGenerating = sc.status === "Generating" || sc.status === "Downloaded";
            const scFailed = sc.status === "Failed";

            return (
              <div
                key={sc.sceneId}
                className={`p-4 studio-panel border rounded-[12px] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  scDone
                    ? "border-emerald-500/30 bg-[#061611]/40"
                    : scFailed
                    ? "border-rose-500/40 bg-[#1f090b]/40"
                    : scGenerating
                    ? "border-[#8b5cf6]/40 bg-[#120d24]/40"
                    : "border-[#27272a] bg-[#111113]"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-mono font-bold flex items-center justify-center mt-0.5 ${
                      scDone
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : scFailed
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : scGenerating
                        ? "bg-[#8b5cf6]/20 text-[#a78bfa] border border-[#8b5cf6]/40 animate-spin"
                        : "bg-[#161618] text-zinc-400 border border-[#27272a]"
                    }`}
                  >
                    0{sc.sceneNumber}
                  </div>

                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-white font-display">{sc.title}</h3>
                      <span className="text-[10px] font-mono text-zinc-500">({sc.duration}s)</span>
                    </div>
                    <p className="text-xs text-zinc-300 font-mono line-clamp-2 bg-[#09090b] p-2 rounded-[6px] border border-[#27272a]">
                      {sc.prompt}
                    </p>
                  </div>
                </div>

                {/* Right Status Badge & Actions */}
                <div className="flex items-center gap-3 justify-between md:justify-end">
                  <div className="text-right">
                    {scDone && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed ✓</span>
                      </span>
                    )}

                    {scGenerating && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#a78bfa] bg-[#8b5cf6]/10 px-3 py-1 rounded-full border border-[#8b5cf6]/30">
                        <div className="w-3 h-3 border-2 border-[#a78bfa]/30 border-t-[#a78bfa] rounded-full animate-spin" />
                        <span>Generating ◉</span>
                      </span>
                    )}

                    {sc.status === "Pending" && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 bg-[#161618] px-3 py-1 rounded-full border border-[#27272a]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending ○</span>
                      </span>
                    )}

                    {scFailed && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Generation Failed</span>
                      </span>
                    )}
                  </div>

                  {scFailed && (
                    <button
                      onClick={() => handleRetry(sc.sceneId)}
                      disabled={retryingSceneId === sc.sceneId}
                      className="px-3 py-1.5 rounded-[8px] bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-40"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${retryingSceneId === sc.sceneId ? "animate-spin" : ""}`} />
                      <span>Retry Scene</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
