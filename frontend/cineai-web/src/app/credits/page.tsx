"use client";

import { Sparkles, Check, Zap } from "lucide-react";

export default function CreditsPage() {
  const plans = [
    { name: "Starter Studio", credits: 250, price: "199.000 VNĐ", features: ["25 Veo 3.1 Scenes", "Gemini 3.1 Pro AI Director", "720p Video Export"] },
    { name: "Pro Director", credits: 1240, price: "699.000 VNĐ", popular: true, features: ["120 Veo 3.1 Scenes", "Character Consistency (3 Ref Images)", "1080p Full HD Export", "Audio & Music Included"] },
    { name: "Studio Master", credits: 3500, price: "1.799.000 VNĐ", features: ["350 Veo 3.1 Scenes", "Priority Polling Worker Queue", "4K Ultra HD Export", "Support Veo 3.1 Extension"] },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Credits & Subscriptions</h1>
        <p className="text-xs text-zinc-400 mt-1">Refill AI generation credits for scriptwriting and Veo 3.1 video rendering.</p>
      </div>

      <div className="studio-panel p-6 border border-[#8b5cf6]/30 bg-gradient-to-r from-[#8b5cf6]/10 via-[#111113] to-[#111113] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#a78bfa]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Current Balance</span>
            <h2 className="text-2xl font-semibold text-white font-mono">1,240 ✦ Credits</h2>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#a78bfa] text-xs font-mono">
          Pro Plan Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p, idx) => (
          <div
            key={idx}
            className={`studio-panel p-6 border space-y-5 flex flex-col justify-between ${
              p.popular ? "border-[#8b5cf6] bg-[#161618] shadow-xl shadow-[#8b5cf6]/10" : "border-[#27272a] bg-[#111113]"
            }`}
          >
            <div className="space-y-4">
              {p.popular && (
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#8b5cf6]/20 text-[#a78bfa] text-[10px] font-mono uppercase tracking-wider">
                  ✦ Popular Studio Choice
                </span>
              )}
              <h3 className="text-base font-semibold text-white">{p.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-white">{p.price}</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-[#a78bfa]">
                <Zap className="w-3.5 h-3.5" />
                <span>{p.credits} ✦ Credits</span>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#27272a] text-xs text-zinc-300">
                {p.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full py-2.5 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs shadow-md shadow-[#7c3aed]/20 transition-all">
              Refill Credits
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
