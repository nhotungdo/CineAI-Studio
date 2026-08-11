"use client";

import { LayoutTemplate, ArrowRight, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Template {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  prompt: string;
  style: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  
  const templates: Template[] = [
    {
      id: "t1",
      title: "Cyberpunk Action Sequence",
      description: "Nhịp độ nhanh, ánh sáng neon rực rỡ, camera movement góc thấp động lực học.",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
      prompt: "Một phân cảnh hành động cyberpunk nhịp độ nhanh trong con hẻm mưa lún phún. Đèn neon rực rỡ, camera di chuyển liên tục, góc máy thấp theo sát bước chân nhân vật.",
      style: "Cyberpunk"
    },
    {
      id: "t2",
      title: "Cinematic Noir Mystery",
      description: "Đen trắng, tương phản mạnh, focus vào cảm xúc và bóng đổ sắc nét.",
      thumbnail: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80",
      prompt: "Đoạn phim Noir đen trắng. Tương phản mạnh giữa ánh sáng và bóng tối. Một thám tử đứng dưới cột đèn đường hút thuốc. Khói bay mờ ảo. Góc quay chậm, tập trung vào ánh mắt.",
      style: "Noir Cinematic"
    },
    {
      id: "t3",
      title: "Sci-Fi Space Exploration",
      description: "Rộng lớn, hùng vĩ, ánh sáng vũ trụ huyền ảo với VFX cao cấp.",
      thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
      prompt: "Phim tài liệu khoa học viễn tưởng. Phi thuyền khổng lồ chầm chậm bay ngang qua một hành tinh màu cam đỏ. Ánh sáng mặt trời phản chiếu lấp lánh trên thân vỏ kim loại. Nhạc nền hùng vĩ.",
      style: "Sci-Fi"
    }
  ];

  const handleUseTemplate = (prompt: string) => {
    try {
      sessionStorage.setItem("cineai_pending_idea", prompt);
    } catch (e) {
      console.error(e);
    }
    router.push("/create");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight font-display flex items-center gap-2">
          <LayoutTemplate className="w-6 h-6 text-[#a78bfa]" />
          <span>Mẫu Phim Studio (Templates)</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Khởi tạo nhanh kịch bản phim điện ảnh với các mẫu câu lệnh prompt chuẩn Veo 3.1.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div key={tpl.id} className="studio-panel border border-[#27272a] bg-[#111113] overflow-hidden group">
            <div className="relative h-44 bg-[#09090b] overflow-hidden">
              <Image
                src={tpl.thumbnail}
                alt={tpl.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-[#161618]/30 to-transparent opacity-90" />
              
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-[6px] bg-[#09090b]/80 border border-[#27272a] text-[10px] font-mono text-[#a78bfa]">
                {tpl.style}
              </div>

              <button
                onClick={() => handleUseTemplate(tpl.prompt)}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#09090b]/40 backdrop-blur-[2px]"
              >
                <div className="px-4 py-2 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-lg shadow-[#8b5cf6]/50 gap-2 font-semibold text-xs transition-transform hover:scale-105">
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Dùng Mẫu Này</span>
                </div>
              </button>
            </div>

            <div className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-white group-hover:text-[#a78bfa] transition-colors font-display">{tpl.title}</h3>
              <p className="text-xs text-zinc-400 line-clamp-2">{tpl.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
