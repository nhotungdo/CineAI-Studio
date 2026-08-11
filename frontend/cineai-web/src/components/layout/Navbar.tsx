"use client";

import { Bell } from "lucide-react";

export function Navbar() {
  return (
    <header className="h-16 bg-[#09090b]/90 backdrop-blur-md fixed top-0 right-0 left-[240px] z-30 flex items-center justify-between px-6 border-b border-[#27272a]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#161618] border border-[#27272a] text-[11px] text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="font-mono">Engine: Veo 3.1 & Gemini 3.1 Pro</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 rounded-[10px] bg-[#161618] border border-[#27272a] text-zinc-400 hover:text-white transition-all">
          <Bell className="w-4 h-4" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#27272a]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#4f46e5] flex items-center justify-center text-white text-xs font-bold ring-2 ring-[#8b5cf6]/30">
            N
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-zinc-200">Nho</p>
            <p className="text-[10px] text-zinc-500 font-mono">Pro Director</p>
          </div>
        </div>
      </div>
    </header>
  );
}
