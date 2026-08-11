"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Play, Layers } from "lucide-react";
import Image from "next/image";
import { fetchProjects } from "@/lib/api";

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  aspectRatio: string;
  style: string;
  targetDuration: number;
}

const CINEMATIC_THUMBNAILS = [
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80"
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await fetchProjects();
      if (data) setProjects(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2 font-display">
            <Layers className="w-6 h-6 text-[#a78bfa]" />
            <span>Dự Án Của Tôi</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Quản lý và chỉnh sửa các dự án kịch bản &amp; video điện ảnh AI.</p>
        </div>

        <Link
          href="/create"
          className="px-4 py-2 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs shadow-md shadow-[#7c3aed]/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Dự Án Mới</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-500 font-mono">Đang tải danh sách dự án...</div>
      ) : projects.length === 0 ? (
        <div className="p-12 studio-panel text-center text-xs text-zinc-500">Chưa có dự án nào. Bấm &quot;Tạo Dự Án Mới&quot; để bắt đầu.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => {
            const thumbUrl = CINEMATIC_THUMBNAILS[idx % CINEMATIC_THUMBNAILS.length];
            const uniqueKey = `${project.id}-${idx}`;
            return (
              <div key={uniqueKey} className="studio-panel studio-panel-hover overflow-hidden transition-all group">
                <div className="relative h-48 bg-[#09090b] overflow-hidden">
                  <Image
                    src={thumbUrl}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={idx < 6}
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-[#161618]/20 to-transparent opacity-90" />
                  
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-[6px] bg-[#09090b]/80 border border-[#27272a] text-[10px] font-mono text-[#a78bfa]">
                    ✦ Veo 3.1
                  </div>

                  <Link
                    href={`/projects/${project.id}`}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#09090b]/50 backdrop-blur-xs"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-lg shadow-[#8b5cf6]/50">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </Link>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white group-hover:text-[#a78bfa] transition-colors font-display">{project.title}</h3>
                    <span className="text-[10px] font-mono text-zinc-400">30s • 1080p</span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">{project.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
