"use client";

import { useState } from "react";
import { Key, SlidersHorizontal, ShieldCheck, Check } from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("AIzaSyB_Mock_Gemini_Key_12345");
  const [directorModel, setDirectorModel] = useState("gemini-3.1-pro");
  const [veoModel, setVeoModel] = useState("veo-3.1-generate-preview");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

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
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google AI Studio API Key..."
              className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-3 text-xs text-zinc-200 font-mono focus:border-[#8b5cf6] focus:outline-none transition-colors"
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
              <select 
                value={directorModel}
                onChange={(e) => setDirectorModel(e.target.value)}
                className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-3 text-xs text-zinc-200 font-mono focus:border-[#8b5cf6] focus:outline-none transition-colors"
              >
                <option value="gemini-3.1-pro">gemini-3.1-pro</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-2">
                Video Generation Model
              </label>
              <select 
                value={veoModel}
                onChange={(e) => setVeoModel(e.target.value)}
                className="w-full bg-[#161618] border border-[#27272a] rounded-[8px] p-3 text-xs text-zinc-200 font-mono focus:border-[#8b5cf6] focus:outline-none transition-colors"
              >
                <option value="veo-3.1-generate-preview">veo-3.1-generate-preview</option>
                <option value="veo-3.1-fast-generate-preview">veo-3.1-fast-generate-preview</option>
                <option value="veo-3.1-lite-preview">veo-3.1-lite-preview</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#27272a] flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving || showSuccess}
            className="px-6 py-2.5 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs shadow-md shadow-[#7c3aed]/20 transition-all disabled:opacity-80 flex items-center gap-2 w-40 justify-center"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : showSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Settings</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
