"use client";

import { useEffect, useState } from "react";
import { Plus, Image as ImageIcon, X, User } from "lucide-react";
import Image from "next/image";
import { createCharacter, fetchCharacters } from "@/lib/api";

interface CharacterItem {
  id: string;
  name: string;
  age: number;
  gender: string;
  appearance: string;
  clothing: string;
  style: string;
  referenceImages: string[];
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState("Male");
  const [appearance, setAppearance] = useState("");
  const [clothing, setClothing] = useState("");
  const [refUrl, setRefUrl] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadCharacters() {
      setIsLoading(true);
      const data = await fetchCharacters();
      if (Array.isArray(data)) {
        const mapped = data.map((item: any) => {
          let refImgs: string[] = [];
          if (Array.isArray(item.referenceImages)) {
            refImgs = item.referenceImages;
          } else if (typeof item.referenceImagesJson === "string") {
            try {
              refImgs = JSON.parse(item.referenceImagesJson);
            } catch {
              refImgs = [];
            }
          }
          return {
            id: item.id || `char-${Date.now()}`,
            name: item.name || "Unnamed Character",
            age: item.age || 25,
            gender: item.gender || "Male",
            appearance: item.appearance || "",
            clothing: item.clothing || "",
            style: item.style || "Cinematic Realistic",
            referenceImages: refImgs
          };
        });
        setCharacters(mapped);
      }
      setIsLoading(false);
    }
    loadCharacters();
  }, []);

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    const newCharObj = {
      name,
      age: Number(age),
      gender,
      appearance,
      clothing,
      style: "Cinematic Realistic",
      referenceImagesJson: JSON.stringify([refUrl])
    };

    const result = await createCharacter(newCharObj);
    setIsSaving(false);

    const createdItem: CharacterItem = {
      id: result?.id || `char-${Date.now()}`,
      name,
      age: Number(age),
      gender,
      appearance,
      clothing,
      style: "Cinematic Realistic",
      referenceImages: [refUrl]
    };

    setCharacters(prev => [createdItem, ...prev]);
    setIsModalOpen(false);
    setName("");
    setAppearance("");
    setClothing("");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2 font-display">
            <span>Thư Viện Nhân Vật</span>
            <span className="text-[#a78bfa] text-xs font-mono px-2 py-0.5 rounded bg-[#8b5cf6]/10 border border-[#8b5cf6]/30">✦ Veo 3.1 Consistency Engine</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Quản lý hồ sơ nhân vật và ảnh tham chiếu cho Veo 3.1 video generation.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs shadow-md shadow-[#7c3aed]/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Nhân Vật Mới</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-500 font-mono">Đang tải danh sách nhân vật...</div>
      ) : characters.length === 0 ? (
        <div className="p-12 studio-panel text-center flex flex-col items-center justify-center space-y-3">
          <User className="w-10 h-10 text-zinc-600" />
          <h3 className="text-sm font-semibold text-white font-display">Chưa Có Nhân Vật Nào trong Thư Viện</h3>
          <p className="text-xs text-zinc-500 max-w-sm">Tạo hồ sơ nhân vật mới và tải ảnh tham chiếu để tạo video nhất quán với Veo 3.1 Engine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {characters.map((char) => (
            <div key={char.id} className="studio-panel p-6 border border-[#27272a] bg-[#111113] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white font-display">{char.name}</h3>
                  <span className="text-xs text-[#a78bfa] font-mono">{char.style} • {char.gender}, {char.age} tuổi</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-[10px] font-mono">
                  Hồ Sơ Kích Hoạt
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-300 font-sans">
                <p><strong className="text-zinc-500 font-mono">Ngoại Hình:</strong> {char.appearance || "N/A"}</p>
                <p><strong className="text-zinc-500 font-mono">Trang Phục:</strong> {char.clothing || "N/A"}</p>
              </div>

              <div className="pt-2 border-t border-[#27272a]">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                  Ảnh Tham Chiếu Veo 3.1 ({char.referenceImages.length}/3 Ảnh)
                </label>
                <div className="flex items-center gap-3">
                  {char.referenceImages.map((imgUrl, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-[8px] overflow-hidden border border-[#27272a] hover:border-[#8b5cf6] transition-all">
                      <Image
                        src={imgUrl}
                        alt={char.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                  {char.referenceImages.length < 3 && (
                    <button className="w-16 h-16 rounded-[8px] border border-dashed border-[#27272a] hover:border-[#8b5cf6]/50 flex flex-col items-center justify-center text-zinc-500 hover:text-white transition-all text-[10px] gap-1 font-mono">
                      <ImageIcon className="w-4 h-4" />
                      <span>+ Thêm</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Character Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#09090b]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="studio-panel w-full max-w-lg p-6 bg-[#111113] border border-[#27272a] space-y-5 relative">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-semibold text-white font-display">Tạo Nhân Vật Mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCharacter} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Tên Nhân Vật</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Maya Lin / Alex Vance"
                  className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-2.5 text-xs text-zinc-100 font-sans focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Tuổi</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Giới Tính</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-2.5 text-xs text-zinc-100 font-sans focus:outline-none focus:border-[#8b5cf6]"
                  >
                    <option value="Male">Nam (Male)</option>
                    <option value="Female">Nữ (Female)</option>
                    <option value="Non-binary">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Mô Tả Ngoại Hình</label>
                <textarea
                  rows={2}
                  value={appearance}
                  onChange={(e) => setAppearance(e.target.value)}
                  placeholder="Mô tả khuôn mặt, màu mắt, kiểu tóc..."
                  className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-2.5 text-xs text-zinc-100 font-sans focus:outline-none focus:border-[#8b5cf6] resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Trang Phục Mặc Định</label>
                <input
                  type="text"
                  value={clothing}
                  onChange={(e) => setClothing(e.target.value)}
                  placeholder="VD: Áo măng tô xám, khăn quàng cổ..."
                  className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-2.5 text-xs text-zinc-100 font-sans focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">URL Ảnh Tham Chiếu (Reference Image)</label>
                <input
                  type="text"
                  value={refUrl}
                  onChange={(e) => setRefUrl(e.target.value)}
                  className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-[8px] bg-[#161618] border border-[#27272a] text-xs font-medium text-zinc-300 hover:bg-[#1d1d21]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-[8px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white font-semibold text-xs shadow-md shadow-[#7c3aed]/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? "Đang Lưu..." : "Tạo Hồ Sơ Nhân Vật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
