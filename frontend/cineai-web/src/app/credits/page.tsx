"use client";

import { Sparkles, ShieldCheck } from "lucide-react";

export default function CreditsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight font-display">Phiên Bản Cá Nhân (Personal Edition)</h1>
        <p className="text-xs text-zinc-400 mt-1">Hệ thống Studio đang được cấu hình ở chế độ cá nhân không giới hạn lượt tạo video.</p>
      </div>

      <div className="studio-panel p-8 border border-[#8b5cf6]/30 bg-gradient-to-r from-[#8b5cf6]/10 via-[#111113] to-[#111113] space-y-4 rounded-[16px]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#a78bfa]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Trạng Thái Bản Quyền</span>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 font-display">
              <span>Bản Quyền Đơn Cá Nhân (Unlimited Solo Director)</span>
              <ShieldCheck className="w-5 h-5 text-[#22c55e]" />
            </h2>
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
          Tất cả các tính năng tạo kịch bản Gemini 3.1 Pro, phân cảnh AI và render video Veo 3.1 đều được mở khóa hoàn toàn mà không cần nạp credits.
        </p>
      </div>
    </div>
  );
}
