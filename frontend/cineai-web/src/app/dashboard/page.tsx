"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, ArrowRight, Layers, Flower2 } from "lucide-react";
import Image from "next/image";
import { fetchProjects, refinePrompt } from "@/lib/api";

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
    const refined = await refinePrompt(promptInput, "Anime");
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
    <div className="space-y-10 relative z-10 max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white font-display">
            ⛩️ Konnichiwa, Chào mừng trở lại 👋
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Hôm nay bạn muốn sáng tạo tác phẩm điện ảnh gì cùng Sakura AI?</p>
        </div>

        {/* Studio Prompt Card */}
        <div className="studio-panel glass-studio p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider font-display">
              🌸 Mô Tả Ý Tưởng Video Của Bạn
            </span>

            {/* AI Prompt Enhancer Button */}
            <button
              type="button"
              onClick={handleRefinePrompt}
              disabled={isRefining || !promptInput.trim()}
              className="px-3 py-1 rounded-[6px] bg-[var(--color-sakura-pink)]/10 hover:bg-[var(--color-sakura-pink)]/20 border border-[var(--color-sakura-pink)]/30 text-[var(--color-sakura-pink)] text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              {isRefining ? (
                <>
                  <div className="w-3 h-3 border-2 border-[var(--color-sakura-pink)]/30 border-t-[var(--color-sakura-pink)] rounded-full animate-spin" />
                  <span>Đang Khai Nhãn...</span>
                </>
              ) : (
                <>
                  <Flower2 className="w-3.5 h-3.5 text-[var(--color-sakura-pink)]" />
                  <span>Khai Mở Ý Tưởng 🌸</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="🌸 Nhập mô tả... (VD: Lễ hội đèn lồng mùa hè ở Kyoto với các Geisha nhảy múa, ánh sáng neon rực rỡ...)"
              className="w-full bg-[#111] border border-[var(--border-color)] rounded-[10px] p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[var(--color-torii-red)] transition-all resize-none font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
              <span>Động cơ AI: <strong className="text-[var(--color-sakura-pink)]">Gemini 3.1 Pro + Veo 3.1</strong></span>
            </div>

            <button
              onClick={handleHeroGenerate}
              className="px-6 py-2.5 rounded-[10px] btn-studio-primary text-xs flex items-center gap-2 transition-all"
            >
              <span>Phân Cảnh AI</span>
              <span>🌸</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2 font-display">
            <Layers className="w-4 h-4 text-[var(--color-torii-red)]" />
            <span>Tác Phẩm Gần Đây</span>
          </h2>
          <Link href="/projects" className="text-xs font-semibold text-[var(--color-sakura-pink)] hover:text-white flex items-center gap-1 transition-colors font-mono">
            <span>Mở Toàn Bộ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-zinc-500 font-mono">Đang tải Thư Ký...</div>
        ) : projects.length === 0 ? (
          <div className="p-12 studio-panel glass-studio text-center text-xs text-zinc-500">Chưa có tác phẩm nào. Bắt đầu hành trình mới phía trên.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, idx) => {
              const thumbUrl = CINEMATIC_THUMBNAILS[idx % CINEMATIC_THUMBNAILS.length];
              const uniqueKey = `${project.id}-${idx}`;
              return (
                <div key={uniqueKey} className="studio-panel glass-studio studio-panel-hover overflow-hidden transition-all group">
                  <div className="relative h-48 bg-[#111] overflow-hidden">
                    <Image
                      src={thumbUrl}
                      alt={project.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={idx < 6}
                      className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-transparent opacity-90" />
                    
                    {/* Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-[6px] bg-[#111]/80 border border-[var(--color-torii-red)]/50 text-[10px] font-mono text-[var(--color-torii-red)] shadow-[0_0_10px_rgba(229,57,53,0.3)]">
                      ⛩️ Veo 3.1
                    </div>

                    <Link
                      href={`/projects/${project.id}`}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#111]/50 backdrop-blur-xs"
                    >
                      <div className="w-12 h-12 rounded-full bg-[var(--color-torii-red)] text-white flex items-center justify-center shadow-lg glow-torii">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </Link>
                  </div>

                  <div className="p-4 space-y-2 border-t border-[var(--border-color)]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white group-hover:text-[var(--color-sakura-pink)] transition-colors font-display">{project.title}</h3>
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
