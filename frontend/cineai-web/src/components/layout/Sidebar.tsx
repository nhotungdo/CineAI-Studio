"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FolderKanban, 
  Film, 
  Users, 
  Image as ImageIcon, 
  LayoutTemplate, 
  Settings, 
  Wand2,
  Layers,
  Flower2 // using Flower2 as a Sakura stand-in
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const mainItems = [
    { label: "🌸 Tạo Video", href: "/create", icon: Wand2, highlight: true },
    { label: "Tổng Quan", href: "/dashboard", icon: FolderKanban },
    { label: "Dự Án Của Tôi", href: "/projects", icon: Layers },
    { label: "Video Đã Render", href: "/videos", icon: Film },
    { label: "Kho Assets & Ảnh", href: "/assets", icon: ImageIcon },
  ];

  const libraryItems = [
    { label: "Thư Viện Nhân Vật", href: "/characters", icon: Users },
    { label: "Mẫu Phim Studio", href: "/templates", icon: LayoutTemplate },
  ];

  const systemItems = [
    { label: "Cài Đặt Studio", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-[240px] bg-transparent glass-studio h-screen fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between border-r border-[var(--border-color)] p-4 font-sans overflow-hidden">
      
      {/* Torii Motif Background (subtle) */}
      <div className="absolute top-0 left-0 right-0 h-40 opacity-10 pointer-events-none flex justify-center -mt-6">
        <svg viewBox="0 0 100 100" className="w-48 h-48 fill-current text-[var(--accent-torii)]" opacity="0.3">
          <path d="M10,30 L90,30 L90,35 L10,35 Z" />
          <path d="M20,25 L80,25 L80,30 L20,30 Z" />
          <path d="M25,35 L30,35 L30,90 L25,90 Z" />
          <path d="M70,35 L75,35 L75,90 L70,90 Z" />
          <path d="M30,45 L70,45 L70,50 L30,50 Z" />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Brand Header */}
        <Link href="/dashboard" className="flex flex-col items-center gap-2 px-2 py-4 mb-6 relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#C62828] to-[#E53935] flex items-center justify-center shadow-lg glow-torii">
            <span className="text-white font-extrabold text-xl tracking-widest">⛩️</span>
          </div>
          <div className="text-center">
            <h1 className="font-bold text-lg tracking-tight text-white flex items-center justify-center gap-1.5 font-display">
              <span className="text-[#F8BBD0]">Sakura</span>
              <span>AI</span>
            </h1>
            <div className="text-[#E53935] text-[10px] font-semibold tracking-widest uppercase mt-0.5">Editor</div>
          </div>
        </Link>

        {/* Navigation Groups */}
        <div className="space-y-6">
          <div>
            <nav className="space-y-1">
              {mainItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-medium transition-all ${
                      item.highlight
                        ? "bg-gradient-to-r from-[#E53935]/20 to-[#C62828]/20 border border-[#E53935]/40 text-[#F8BBD0] hover:from-[#E53935]/30 hover:to-[#C62828]/30 font-semibold shadow-inner glow-torii"
                        : isActive
                        ? "bg-[#222] text-white border border-[#444]"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${item.highlight ? "text-[#F8BBD0]" : isActive ? "text-[#E53935]" : "text-zinc-400"}`} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-2 border-t border-[var(--border-color)]">
            <div className="px-3 mb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Flower2 className="w-3 h-3 text-[#F8BBD0]" />
              Thư Viện Sáng Tạo
            </div>
            <nav className="space-y-1">
              {libraryItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[10px] text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[#222] text-white border border-[#444]"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#E53935]" : "text-zinc-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* System Links */}
      <div className="pt-4 border-t border-[var(--border-color)] space-y-1 relative z-10">
        {systemItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-[10px] text-xs font-medium transition-all ${
                isActive
                  ? "bg-[#222] text-white border border-[#444]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1a]"
              }`}
            >
              <Icon className="w-4 h-4 text-zinc-400" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
