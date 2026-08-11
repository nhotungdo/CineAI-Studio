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
  Layers
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const mainItems = [
    { label: "✦ Tạo Video", href: "/create", icon: Wand2, highlight: true },
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
    <aside className="w-[240px] bg-[#111113] h-screen fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between border-r border-[#27272a] p-4 font-sans">
      <div>
        {/* Brand Header */}
        <Link href="/dashboard" className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7c3aed] to-[#4f46e5] flex items-center justify-center shadow-lg shadow-[#7c3aed]/30">
            <span className="text-white font-extrabold text-base tracking-widest">✦</span>
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5 font-display">
              <span>CineAI</span>
              <span className="text-[#a78bfa] text-xs font-semibold px-1.5 py-0.5 rounded bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">Studio</span>
            </h1>
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
                        ? "bg-gradient-to-r from-[#7c3aed]/20 to-[#4f46e5]/20 border border-[#8b5cf6]/40 text-[#a78bfa] hover:from-[#7c3aed]/30 hover:to-[#4f46e5]/30 font-semibold"
                        : isActive
                        ? "bg-[#1d1d21] text-white border border-[#3f3f46]"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${item.highlight ? "text-[#a78bfa]" : isActive ? "text-[#8b5cf6]" : "text-zinc-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.highlight && <span className="text-[#a78bfa] text-[10px]">✦</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-2 border-t border-[#27272a]">
            <div className="px-3 mb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
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
                        ? "bg-[#1d1d21] text-white border border-[#3f3f46]"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-zinc-400" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* System Links */}
      <div className="pt-4 border-t border-[#27272a] space-y-1">
        {systemItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-[10px] text-xs font-medium transition-all ${
                isActive
                  ? "bg-[#1d1d21] text-white border border-[#3f3f46]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]"
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
