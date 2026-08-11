"use client";

import { LayoutTemplate, Plus } from "lucide-react";
import Link from "next/link";

export default function TemplatesPage() {
  const templates: any[] = [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight font-display">Mẫu Phim Studio (Templates)</h1>
        <p className="text-xs text-zinc-400 mt-1">Khởi tạo nhanh kịch bản phim điện ảnh với các mẫu câu lệnh prompt chuẩn Veo 3.1.</p>
      </div>

      {templates.length === 0 ? (
        <div className="p-12 studio-panel text-center flex flex-col items-center justify-center space-y-3">
          <LayoutTemplate className="w-10 h-10 text-zinc-600" />
          <h3 className="text-sm font-semibold text-white font-display">Chưa Có Mẫu Phim Nào</h3>
          <p className="text-xs text-zinc-500 max-w-sm">Hiện chưa có mẫu kịch bản có sẵn. Bạn có thể bắt đầu sáng tạo bằng cách tự nhập ý tưởng mới.</p>
          <Link
            href="/create"
            className="mt-2 px-4 py-2 rounded-[8px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-[#7c3aed]/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Kịch Bản Mới</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Templates list when available */}
        </div>
      )}
    </div>
  );
}

