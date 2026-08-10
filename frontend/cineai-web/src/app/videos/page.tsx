"use client";

import { Download } from "lucide-react";

export default function VideosPage() {
  const exports = [
    {
      id: "exp-1",
      title: "Hanoi After Dark - Final Cut",
      resolution: "1080p (1080x1920)",
      fileSize: "42.5 MB",
      duration: "30s",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight font-display">Video Đã Render</h1>
        <p className="text-xs text-zinc-400 mt-1">Danh sách video điện ảnh hoàn thiện được xuất ra từ Veo 3.1 &amp; Gemini 3.1 Pro Engine.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exports.map((exp) => (
          <div key={exp.id} className="studio-panel p-5 border border-[#27272a] bg-[#111113] space-y-4">
            <div className="relative aspect-video bg-[#09090b] rounded-[10px] overflow-hidden border border-[#27272a]">
              <video src={exp.videoUrl} controls className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white font-display">{exp.title}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#a78bfa]">
                  {exp.resolution}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
                <span>Dung lượng: {exp.fileSize}</span>
                <span>•</span>
                <span>Thời lượng: {exp.duration}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#27272a]">
              <a
                href={exp.videoUrl}
                download
                className="w-full py-2 rounded-[8px] bg-[#161618] hover:bg-[#1d1d21] border border-[#27272a] text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all font-sans"
              >
                <Download className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span>Tải Phim MP4 Về Máy</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
