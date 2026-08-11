"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Download,
  Share2,
  Edit3,
  Film,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Check,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Volume2,
  VolumeX,
  Maximize2
} from "lucide-react";
import {
  fetchJobProgress,
  deleteStoryboardScene,
  reRenderPipeline,
  updateAudioSettings,
  reorderStoryboardScenes
} from "@/lib/api";

interface SceneItem {
  sceneId: string;
  sceneNumber: number;
  title: string;
  description: string;
  duration: number;
  prompt: string;
  cameraMovement: string;
  lightingStyle: string;
  status: string;
  videoUrl?: string;
}

interface VideoDetailData {
  jobId: string;
  status: string;
  progressPercentage: number;
  totalScenes: number;
  completedScenes: number;
  finalVideoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  scenes: SceneItem[];
}

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [data, setData] = useState<VideoDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [isReRendering, setIsReRendering] = useState(false);

  // Phase 2: Audio & Subtitle State
  const [bgMusicId, setBgMusicId] = useState<string>("");
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(false);
  const [subtitleStyle, setSubtitleStyle] = useState("Cinematic");

  const loadData = async () => {
    if (!jobId) return;
    const res = await fetchJobProgress(jobId);
    if (res) setData(res);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [jobId]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleMoveScene = async (index: number, direction: "up" | "down") => {
    if (!data || !jobId) return;
    const scenes = [...data.scenes];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= scenes.length) return;

    const temp = scenes[index];
    scenes[index] = scenes[targetIdx];
    scenes[targetIdx] = temp;

    const orders = scenes.map((s, i) => ({ sceneId: s.sceneId, sceneNumber: i + 1 }));
    await reorderStoryboardScenes(jobId, orders);
    await loadData();
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!jobId) return;
    await deleteStoryboardScene(jobId, sceneId);
    await loadData();
  };

  const handleReRender = async () => {
    if (!jobId) return;
    setIsReRendering(true);

    // Save Audio settings first
    await updateAudioSettings(jobId, {
      bgMusicId: bgMusicId || undefined,
      voiceoverId: voiceoverEnabled ? "auto" : undefined, // Using "auto" as a flag to generate TTS
      subtitleStyle: subtitleStyle
    });

    await reRenderPipeline(jobId);
    setIsReRendering(false);
    router.push(`/videos/${jobId}/status`);
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6] rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-400 font-mono">Đang tải Video Player &amp; Timeline Editor...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-xs text-zinc-500">
        Không tìm thấy thông tin video này.
      </div>
    );
  }

  const sampleFallbackUrl = "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4";
  const activeVideoUrl = data.finalVideoUrl || sampleFallbackUrl;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Nav Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditor(!showEditor)}
            className={`px-3.5 py-1.5 rounded-[8px] border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showEditor
                ? "bg-[#8b5cf6] border-[#8b5cf6] text-white"
                : "bg-[#161618] border-[#27272a] text-zinc-200 hover:border-[#8b5cf6]/50"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{showEditor ? "Đóng Video Editor" : "Mở Video Editor Timeline"}</span>
          </button>
        </div>
      </div>

      {/* Video Player Card */}
      <div className="studio-panel border border-[#27272a] bg-[#09090b] rounded-[18px] overflow-hidden shadow-2xl space-y-0">
        <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
          <video
            ref={videoRef}
            src={activeVideoUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-contain"
          />

          {/* Overlay Play Toggle Button */}
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-16 h-16 rounded-full bg-[#8b5cf6]/90 hover:bg-[#8b5cf6] text-white flex items-center justify-center shadow-xl shadow-[#8b5cf6]/50 transition-all scale-95 group-hover:scale-100">
              {isPlaying ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white ml-1" />}
            </div>
          </button>
        </div>

        {/* Custom Video Controls Bar */}
        <div className="p-4 bg-[#111113] border-t border-[#27272a] space-y-3">
          {/* Timeline Scrubber */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-[#8b5cf6]"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 rounded-[8px] bg-[#161618] hover:bg-[#27272a] text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              <button
                onClick={toggleMute}
                className="p-2 rounded-[8px] bg-[#161618] hover:bg-[#27272a] text-zinc-400 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="text-xs font-mono text-zinc-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Main Action Buttons: Edit, Download, Share */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditor(!showEditor)}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#161618] hover:bg-[#27272a] border border-[#27272a] text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span>Edit Video</span>
              </button>

              <a
                href={activeVideoUrl}
                download={`CineAI-Final-${jobId}.mp4`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-[8px] bg-[#161618] hover:bg-[#27272a] border border-[#27272a] text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download MP4</span>
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Đã sao chép liên kết video vào clipboard!");
                }}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#8b5cf6]/20 hover:bg-[#8b5cf6]/30 border border-[#8b5cf6]/40 text-[#a78bfa] text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Editor Timeline Panel (Collapsible or Triggered via Edit Video) */}
      {showEditor && (
        <div className="p-6 studio-panel border border-[#8b5cf6]/40 bg-[#111113] rounded-[18px] space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
                <Layers className="w-4.5 h-4.5 text-[#a78bfa]" />
                <span>Video Editor Timeline (Phân Cảnh Phân Đoạn)</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Sắp xếp lại thứ tự, xóa hoặc thay đổi phân cảnh trước khi Re-render tác phẩm hoàn chỉnh.</p>
            </div>

            <button
              onClick={handleReRender}
              disabled={isReRendering}
              className="px-5 py-2.5 rounded-[10px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#8b5cf6] hover:to-[#6366f1] text-white font-semibold text-xs shadow-lg shadow-[#7c3aed]/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isReRendering ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Đang Re-render FFmpeg...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Re-render Video Hoàn Chỉnh 🎬</span>
                </>
              )}
            </button>
          </div>

          {/* Phase 2: Audio & Subtitle Track Settings */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">TRACK ÂM THANH & PHỤ ĐỀ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="p-4 bg-[#161618] border border-[#27272a] rounded-[12px] space-y-3">
                <label className="text-xs font-semibold text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#a78bfa]" />
                  <span>Nhạc Nền (BGM)</span>
                </label>
                <select 
                  value={bgMusicId}
                  onChange={(e) => setBgMusicId(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-[8px] p-2 text-xs text-zinc-300 font-mono outline-none focus:border-[#8b5cf6]"
                >
                  <option value="">Không dùng nhạc nền</option>
                  <option value="cinematic_drums">Cinematic Drums & Epic Bass (Mock)</option>
                  <option value="cyberpunk_synth">Cyberpunk Synthwave (Mock)</option>
                  <option value="lofi_chill">Lofi Chill Vibes (Mock)</option>
                </select>
              </div>

              <div className="p-4 bg-[#161618] border border-[#27272a] rounded-[12px] space-y-3">
                <label className="text-xs font-semibold text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#a78bfa]" />
                  <span>AI Voice-over</span>
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => setVoiceoverEnabled(!voiceoverEnabled)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      voiceoverEnabled ? 'bg-[#8b5cf6]' : 'bg-[#27272a]'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        voiceoverEnabled ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs text-zinc-400 font-mono">
                    {voiceoverEnabled ? "Đã bật (Tạo từ Kịch bản)" : "Đã tắt"}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[#161618] border border-[#27272a] rounded-[12px] space-y-3">
                <label className="text-xs font-semibold text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#a78bfa]" />
                  <span>AI Subtitles</span>
                </label>
                <select 
                  value={subtitleStyle}
                  onChange={(e) => setSubtitleStyle(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-[8px] p-2 text-xs text-zinc-300 font-mono outline-none focus:border-[#8b5cf6]"
                >
                  <option value="None">Không hiện phụ đề</option>
                  <option value="Cinematic">Cinematic (Mặc định)</option>
                  <option value="Netflix">Netflix Style</option>
                  <option value="TikTok">TikTok Style</option>
                </select>
              </div>

            </div>
          </div>

          {/* Timeline Sequence Track */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">TRACK PHÂN CẢNH HÀNG THỜI GIAN</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.scenes.map((sc, index) => (
                <div
                  key={sc.sceneId}
                  className="p-4 bg-[#161618] border border-[#27272a] rounded-[12px] space-y-3 hover:border-[#8b5cf6]/50 transition-all group"
                >
                  <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
                    <span className="text-xs font-mono font-bold text-[#a78bfa]">
                      0{sc.sceneNumber} • Scene ({sc.duration}s)
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveScene(index, "up")}
                        disabled={index === 0}
                        className="p-1 rounded bg-[#09090b] hover:bg-[#27272a] text-zinc-400 hover:text-white disabled:opacity-20 text-xs"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveScene(index, "down")}
                        disabled={index === data.scenes.length - 1}
                        className="p-1 rounded bg-[#09090b] hover:bg-[#27272a] text-zinc-400 hover:text-white disabled:opacity-20 text-xs"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteScene(sc.sceneId)}
                        className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 font-mono line-clamp-2 bg-[#09090b] p-2.5 rounded-[8px] border border-[#27272a]">
                    {sc.prompt}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                    <span>{sc.cameraMovement}</span>
                    <span>{sc.lightingStyle}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
