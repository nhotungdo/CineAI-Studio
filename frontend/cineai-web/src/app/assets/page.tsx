"use client";

import { useState } from "react";
import { Image as ImageIcon, Plus, Music, Film, UploadCloud, X, Check } from "lucide-react";
import Image from "next/image";

interface Asset {
  id: string;
  name: string;
  type: "image" | "audio" | "video";
  url: string;
  size: string;
  date: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: "a1",
      name: "cyberpunk_neon_bg.png",
      type: "image",
      url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80",
      size: "2.4 MB",
      date: "2026-08-11"
    },
    {
      id: "a2",
      name: "cinematic_drums.mp3",
      type: "audio",
      url: "",
      size: "4.1 MB",
      date: "2026-08-11"
    }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setAssets([
        {
          id: `a${Date.now()}`,
          name: `uploaded_asset_${assets.length + 1}.png`,
          type: "image",
          url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80",
          size: "1.8 MB",
          date: new Date().toISOString().split('T')[0]
        },
        ...assets
      ]);
      setIsUploading(false);
      setIsModalOpen(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight font-display flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#a78bfa]" />
            <span>Kho Assets & Hình Ảnh</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Quản lý hình ảnh background, texture, và audio tracks cho dự án Veo 3.1.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs shadow-md shadow-[#7c3aed]/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Asset</span>
        </button>
      </div>

      {assets.length === 0 ? (
        <div className="studio-panel p-12 rounded-[14px] border border-[#27272a] bg-[#111113] text-center flex flex-col items-center justify-center space-y-3">
          <ImageIcon className="w-10 h-10 text-zinc-600" />
          <h3 className="text-sm font-semibold text-white font-display">Thư Viện Assets Trống</h3>
          <p className="text-xs text-zinc-500 max-w-sm">Tải lên các file ảnh/âm thanh của bạn để sử dụng làm reference cho AI Director & Veo 3.1.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="studio-panel border border-[#27272a] bg-[#111113] overflow-hidden group">
              <div className="aspect-square bg-[#09090b] relative flex items-center justify-center border-b border-[#27272a]">
                {asset.type === "image" ? (
                  <Image
                    src={asset.url}
                    alt={asset.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                ) : asset.type === "audio" ? (
                  <Music className="w-10 h-10 text-zinc-700" />
                ) : (
                  <Film className="w-10 h-10 text-zinc-700" />
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-[4px] bg-[#09090b]/80 border border-[#27272a] text-[9px] font-mono font-bold uppercase text-[#a78bfa]">
                  {asset.type}
                </div>
              </div>
              <div className="p-3 space-y-1">
                <p className="text-xs font-semibold text-white truncate font-display">{asset.name}</p>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>{asset.size}</span>
                  <span>{asset.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#09090b]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="studio-panel w-full max-w-md p-6 bg-[#111113] border border-[#27272a] space-y-5 relative">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-semibold text-white font-display">Tải Lên Asset Mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-2 border-dashed border-[#27272a] hover:border-[#8b5cf6]/50 rounded-[12px] p-8 text-center space-y-3 bg-[#161618] transition-all cursor-pointer">
              <UploadCloud className="w-8 h-8 text-[#a78bfa] mx-auto" />
              <div>
                <p className="text-xs font-semibold text-white">Kéo thả file vào đây hoặc nhấn để chọn</p>
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">Hỗ trợ: JPG, PNG, MP3, MP4 (Tối đa 50MB)</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-[8px] bg-[#161618] border border-[#27272a] text-xs font-medium text-zinc-300 hover:bg-[#1d1d21]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="px-5 py-2 rounded-[8px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white font-semibold text-xs shadow-md shadow-[#7c3aed]/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang Tải Lên...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Xác Nhận Tải Lên</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
