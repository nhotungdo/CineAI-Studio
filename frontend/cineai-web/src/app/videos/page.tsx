"use client";

import { useEffect, useState } from "react";
import { Download, Film } from "lucide-react";
import { fetchExports } from "@/lib/api";

interface ExportItem {
  id: string;
  finalVideoUrl?: string;
  resolution?: string;
  fileSizeBytes?: number;
  createdAt?: string;
  project?: {
    title?: string;
  };
}

export default function VideosPage() {
  const [exports, setExports] = useState<ExportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExports() {
      setIsLoading(true);
      const data = await fetchExports();
      if (Array.isArray(data)) {
        setExports(data);
      }
      setIsLoading(false);
    }
    loadExports();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight font-display">Video Đã Render</h1>
        <p className="text-xs text-zinc-400 mt-1">Danh sách video điện ảnh hoàn thiện được xuất ra từ Veo 3.1 &amp; Gemini 3.1 Pro Engine.</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-500 font-mono">Đang tải danh sách video...</div>
      ) : exports.length === 0 ? (
        <div className="p-12 studio-panel text-center flex flex-col items-center justify-center space-y-3">
          <Film className="w-10 h-10 text-zinc-600" />
          <h3 className="text-sm font-semibold text-white font-display">Chưa Có Video Nào Được Xuất</h3>
          <p className="text-xs text-zinc-500 max-w-sm">Tạo dự án mới và hoàn thiện kịch bản để xuất các video MP4 chất lượng cao từ Veo 3.1.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exports.map((exp) => {
            const videoUrl = exp.finalVideoUrl || "";
            const title = exp.project?.title || "Rendered AI Movie";
            const resText = exp.resolution || "1080p";
            const sizeText = exp.fileSizeBytes ? `${(exp.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : "N/A";

            return (
              <div key={exp.id} className="studio-panel p-5 border border-[#27272a] bg-[#111113] space-y-4">
                <div className="relative aspect-video bg-[#09090b] rounded-[10px] overflow-hidden border border-[#27272a]">
                  <video src={videoUrl} controls className="w-full h-full object-cover" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white font-display">{title}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#a78bfa]">
                      {resText}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
                    <span>Dung lượng: {sizeText}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#27272a]">
                  <a
                    href={videoUrl}
                    download
                    className="w-full py-2 rounded-[8px] bg-[#161618] hover:bg-[#1d1d21] border border-[#27272a] text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all font-sans"
                  >
                    <Download className="w-3.5 h-3.5 text-[#a78bfa]" />
                    <span>Tải Phim MP4 Về Máy</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

