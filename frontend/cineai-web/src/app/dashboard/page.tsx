"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, ArrowRight, Layers, Sparkles } from "lucide-react";
import Image from "next/image";
import { fetchProjects, refinePrompt } from "@/lib/api";

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  aspectRatio: number;
  style: number;
  targetDuration: number;
}

const CINEMATIC_THUMBNAILS = [
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80"
];

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [promptInput, setPromptInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await fetchProjects();
      if (data) setProjects(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleRefinePrompt = async () => {
    if (!promptInput.trim()) return;
    setIsRefining(true);
    const refined = await refinePrompt(promptInput, "Cinematic");
    if (refined && refined.refinedPrompt) {
      setPromptInput(refined.refinedPrompt);
    }
    setIsRefining(false);
  };

  const handleHeroGenerate = () => {
    if (promptInput.trim()) {
      try {
        sessionStorage.setItem("cineai_pending_idea", promptInput);
      } catch (e) {
        console.error("Failed to set sessionStorage", e);
      }
    }
    router.push("/create");
  };

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white font-display">
            Chủ Nhật An Lành, Nho 👋
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Hôm nay bạn muốn sáng tạo phim điện ảnh gì?</p>
        </div>

        {/* Studio Prompt Card */}
        <div className="studio-panel p-6 border border-[#27272a] bg-[#111113] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider font-display">
              ✦ Mô Tả Ý Tưởng Video Của Bạn
            </span>

            {/* AI Prompt Enhancer Button */}
            <button
              type="button"
              onClick={handleRefinePrompt}
              disabled={isRefining || !promptInput.trim()}
              className="px-3 py-1 rounded-[6px] bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[#a78bfa] text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              {isRefining ? (
                <>
                  <div className="w-3 h-3 border-2 border-[#a78bfa]/30 border-t-[#a78bfa] rounded-full animate-spin" />
                  <span>Đang Tối Ưu Prompt...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
                  <span>Tối Ưu Prompt Bằng AI ✦</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="✦ Mô tả ý tưởng video điện ảnh của bạn... (VD: 'Phố cổ Hà Nội ban đêm với mưa lún phún và ánh đèn neon rực rỡ...')"
              className="w-full bg-[#161618] border border-[#27272a] rounded-[10px] p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#8b5cf6] transition-all resize-none font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
              <span>Engine Sáng Tạo: <strong className="text-zinc-300">Gemini 3.1 Pro + Veo 3.1</strong></span>
            </div>

            <button
              onClick={handleHeroGenerate}
              className="px-6 py-2.5 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs shadow-lg shadow-[#7c3aed]/25 flex items-center gap-2 transition-all"
            >
              <span>Phân Cảnh AI</span>
              <span>✦</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2 font-display">
            <Layers className="w-4 h-4 text-[#a78bfa]" />
            <span>Dự Án Gần Đây</span>
          </h2>
          <Link href="/projects" className="text-xs font-semibold text-[#a78bfa] hover:text-white flex items-center gap-1 transition-colors font-mono">
            <span>Xem Tất Cả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-zinc-500 font-mono">Đang tải Studio Workspace...</div>
        ) : projects.length === 0 ? (
          <div className="p-12 studio-panel text-center text-xs text-zinc-500">Chưa có dự án nào. Nhập ý tưởng phía trên để bắt đầu phân cảnh.</div>
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
                      className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-[#161618]/20 to-transparent opacity-90" />
                    
                    {/* Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-[6px] bg-[#09090b]/80 border border-[#27272a] text-[10px] font-mono text-[#a78bfa]">
                      ✦ Veo 3.1 Render
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
                      <span className="text-[10px] font-mono text-zinc-400">00:32 • 1080p</span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2">{project.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
