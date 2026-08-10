"use client";

import { Key, SlidersHorizontal, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Studio Settings</h1>
        <p className="text-xs text-zinc-400 mt-1">Configure Gemini 3.1 Pro API keys, Veo 3.1 default parameters, and PostgreSQL database settings.</p>
      </div>

      <div className="studio-panel p-6 border border-[#27272a] bg-[#111113] space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-[#a78bfa]" />
            <span>Google Gemini & Veo 3.1 API Key</span>
          </h3>

          <div>
            <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-2">
              API Key (Google AI Studio)
            </label>
            <input
              type="password"
              placeholder="Enter your Google AI Studio API Key..."
              className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-3 text-xs text-zinc-200 font-mono focus:border-[#8b5cf6] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[#22c55e]">
            <ShieldCheck className="w-4 h-4" />
            <span>Connected to Gemini 3.1 Pro & Veo 3.1 Preview Engines.</span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#27272a] space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#a78bfa]" />
            <span>Veo 3.1 Default Parameters</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-2">
                AI Director Engine Model
              </label>
              <select className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-3 text-xs text-zinc-200 font-mono">
                <option value="gemini-3.1-pro">gemini-3.1-pro</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-2">
                Video Generation Model
              </label>
              <select className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-3 text-xs text-zinc-200 font-mono">
                <option value="veo-3.1-generate-preview">veo-3.1-generate-preview</option>
                <option value="veo-3.1-fast-generate-preview">veo-3.1-fast-generate-preview</option>
                <option value="veo-3.1-lite-preview">veo-3.1-lite-preview</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#27272a] flex justify-end">
          <button className="px-6 py-2.5 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs shadow-md shadow-[#7c3aed]/20 transition-all">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
