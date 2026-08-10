"use client";

import { Image as ImageIcon, Plus } from "lucide-react";

export default function AssetsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kho Assets & Hình Ảnh</h1>
          <p className="text-xs text-slate-400 mt-1">Quản lý hình ảnh background, texture, và audio tracks cho dự án.</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Upload Asset</span>
        </button>
      </div>

      <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
        <ImageIcon className="w-10 h-10 text-cyan-400 opacity-60" />
        <h3 className="text-base font-bold text-white">Thư Viện Assets Trống</h3>
        <p className="text-xs text-slate-400 max-w-sm">Tải lên các file ảnh/âm thanh của bạn để sử dụng làm reference cho Gemini AI Director & Veo 3.1.</p>
      </div>
    </div>
  );
}
