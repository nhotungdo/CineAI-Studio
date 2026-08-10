"use client";

import Image from "next/image";

export default function TemplatesPage() {
  const templates = [
    {
      id: "tpl-1",
      title: "Hà Nội Đêm Neon Cinematic",
      genre: "Documentary",
      duration: "30s",
      aspectRatio: "9:16",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "tpl-2",
      title: "Cyberpunk Future City",
      genre: "Sci-Fi",
      duration: "15s",
      aspectRatio: "16:9",
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight font-display">Mẫu Phim Studio (Templates)</h1>
        <p className="text-xs text-zinc-400 mt-1">Khởi tạo nhanh kịch bản phim điện ảnh với các mẫu câu lệnh prompt chuẩn Veo 3.1.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tpl) => (
          <div key={tpl.id} className="studio-panel studio-panel-hover overflow-hidden transition-all group p-4 space-y-3">
            <div className="relative aspect-video bg-[#09090b] rounded-[10px] overflow-hidden border border-[#27272a]">
              <Image src={tpl.thumbnail} alt={tpl.title} fill className="object-cover" />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white font-display">{tpl.title}</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#a78bfa]">
                {tpl.genre} • {tpl.duration}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
