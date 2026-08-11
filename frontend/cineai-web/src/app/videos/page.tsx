"use client";

import { useEffect, useState } from "react";
import { Download, Film, Loader2, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { fetchRecentJobs } from "@/lib/api";

interface VideoJob {
  jobId: string;
  prompt: string;
  status: string;
  progressPercentage: number;
  totalScenes: number;
  completedScenes: number;
  finalVideoUrl: string | null;
  thumbnailUrl: string | null;
  createdAt?: string;
  completedAt?: string;
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    Completed: "text-emerald-400 bg-emerald-900/20 border-emerald-700/40",
    Failed: "text-red-400 bg-red-900/20 border-red-700/40",
    Planning: "text-yellow-400 bg-yellow-900/20 border-yellow-700/40",
    Generating: "text-blue-400 bg-blue-900/20 border-blue-700/40",
    Merging: "text-purple-400 bg-purple-900/20 border-purple-700/40",
    Queued: "text-zinc-400 bg-zinc-800/40 border-zinc-700",
  };
  const cls = cfg[status] || "text-zinc-400 bg-zinc-800/40 border-zinc-700";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${cls}`}>
      {status}
    </span>
  );
}

export default function VideosPage() {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentJobs().then((data) => {
      if (Array.isArray(data)) setJobs(data);
      setIsLoading(false);
    });
  }, []);

  const completedJobs = jobs.filter((j) => j.status === "Completed");
  const inProgressJobs = jobs.filter((j) => !["Completed", "Failed"].includes(j.status));
  const failedJobs = jobs.filter((j) => j.status === "Failed");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2 font-display">
            <Film className="w-6 h-6 text-[#a78bfa]" />
            <span>Video Đã Render</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Tất cả video được tạo từ AI Director pipeline — Veo 2 &amp; Gemini.
          </p>
        </div>
        <button
          onClick={() => {
            setIsLoading(true);
            fetchRecentJobs().then((data) => {
              if (Array.isArray(data)) setJobs(data);
              setIsLoading(false);
            });
          }}
          className="px-3 py-1.5 rounded-[8px] bg-[#161618] border border-[#27272a] text-zinc-400 hover:text-white text-xs flex items-center gap-1.5 transition-all hover:border-zinc-600"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm Mới</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#a78bfa] animate-spin" />
          <p className="text-xs text-zinc-500 font-mono">Đang tải danh sách video...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-16 studio-panel text-center flex flex-col items-center justify-center space-y-4">
          <Film className="w-12 h-12 text-zinc-600" />
          <div>
            <h3 className="text-sm font-semibold text-white font-display">Chưa Có Video Nào</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              Tạo dự án mới và render để có video AI đầu tiên của bạn.
            </p>
          </div>
          <Link
            href="/create"
            className="px-4 py-2 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white font-semibold text-xs"
          >
            Tạo Video Mới
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Completed Videos */}
          {completedJobs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white font-display">
                  Video Hoàn Chỉnh ({completedJobs.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {completedJobs.map((job) => (
                  <div key={job.jobId} className="studio-panel overflow-hidden border border-[#27272a] group">
                    {/* Video Thumbnail / Player */}
                    <div className="relative bg-[#09090b] aspect-video overflow-hidden">
                      {job.finalVideoUrl ? (
                        <video
                          src={job.finalVideoUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          muted
                          loop
                          onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                          onMouseLeave={(e) => (e.currentTarget as HTMLVideoElement).pause()}
                        />
                      ) : job.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={job.thumbnailUrl}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover opacity-80"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Film className="w-10 h-10 text-zinc-700" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <StatusBadge status={job.status} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-3">
                      <p className="text-xs text-zinc-300 line-clamp-2 font-mono">{job.prompt}</p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>{job.totalScenes} scenes • {job.completedScenes} done</span>
                        <span>
                          {job.completedAt
                            ? new Date(job.completedAt).toLocaleDateString("vi-VN")
                            : ""}
                        </span>
                      </div>
                      {job.finalVideoUrl && (
                        <div className="flex gap-2">
                          <a
                            href={job.finalVideoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-2 rounded-[8px] bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#a78bfa] text-xs font-semibold text-center hover:bg-[#8b5cf6]/20 transition-all"
                          >
                            Xem Video
                          </a>
                          <a
                            href={job.finalVideoUrl}
                            download
                            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-emerald-600/20 border border-emerald-600/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-600/30 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Tải
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In-Progress Jobs */}
          {inProgressJobs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                <h2 className="text-sm font-semibold text-white font-display">
                  Đang Xử Lý ({inProgressJobs.length})
                </h2>
              </div>
              <div className="space-y-2">
                {inProgressJobs.map((job) => (
                  <div key={job.jobId} className="studio-panel p-4 border border-[#27272a] flex items-center gap-4">
                    <Loader2 className="w-5 h-5 text-[#a78bfa] animate-spin shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 font-mono truncate">{job.prompt}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <StatusBadge status={job.status} />
                        <span className="text-[10px] font-mono text-zinc-500">
                          Scene {job.completedScenes}/{job.totalScenes}
                        </span>
                      </div>
                    </div>
                    <div className="w-24 space-y-1">
                      <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] h-full transition-all"
                          style={{ width: `${job.progressPercentage}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-right font-mono text-zinc-400">{job.progressPercentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed Jobs */}
          {failedJobs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-semibold text-white font-display">
                  Lỗi ({failedJobs.length})
                </h2>
              </div>
              <div className="space-y-2">
                {failedJobs.map((job) => (
                  <div key={job.jobId} className="studio-panel p-4 border border-red-700/30 bg-red-900/5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 font-mono truncate">{job.prompt}</p>
                      <div className="mt-1">
                        <StatusBadge status={job.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
