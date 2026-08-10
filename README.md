# CineAI Studio 🎬🤖

**CineAI Studio** là nền tảng **AI Video Studio** thế hệ mới production-ready, kết hợp trí tuệ nhân tạo của **Gemini API (AI Director)** và engine tạo video **Veo 3.1** từ Google để tự động thiết kế, viết kịch bản, vẽ storyboard, giữ tính nhất quán nhân vật (Character Consistency) và sản xuất video điện ảnh chất lượng cao.

---

## 🌟 Tính Năng Nổi Bật (Key Features)

- 🧠 **AI Director Orchestration**: Tự động chuyển đổi ý tưởng thô thành Kịch bản (Script), Storyboard, Phân cảnh (Scenes), Góc quay (Camera) và Ánh sáng (Lighting).
- 🎬 **Veo 3.1 Async Video Engine**: Tạo clip chất lượng cao từ Veo 3.1 với hỗ trợ Audio, tỷ lệ 16:9 / 9:16, Reference images và First/Last frame transition.
- 👤 **Character Consistency System**: Duy trì hình ảnh nhân vật đồng nhất xuyên suốt tất cả các phân cảnh nhờ inject reference images & context.
- ⏱️ **Scene-Centric Workflow**: Tạo và tái tạo (Regenerate) từng Scene riêng biệt mà không cần render lại toàn bộ dự án.
- ⚡ **Realtime SignalR Notification**: Cập nhật tiến độ render video từng phần (%) theo thời gian thực tới giao diện người dùng.
- 🎵 **FFmpeg Media Stitching**: Tự động ghép nối các cảnh thành tác phẩm video hoàn chỉnh với nhạc nền và hiệu ứng chuyển cảnh.

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture)

```text
CineAI-Studio/
├── frontend/
│   └── cineai-web/              # Next.js 15, TypeScript, TailwindCSS, shadcn/ui, Zustand, React Query
├── backend/
│   └── CineAI.API/              # ASP.NET Core 9 Web API (Clean Architecture)
│       ├── API/
│       ├── Application/
│       ├── Domain/
│       └── Infrastructure/
├── services/
│   ├── CineAI.AI/               # Gemini API AI Director & Prompts Orchestration
│   ├── CineAI.Video/            # Veo 3.1 Video Engine Integration & Polling
│   ├── CineAI.Storage/          # Supabase Object Storage Adapter
│   └── CineAI.Media/            # FFmpeg Video Processing & Stitching Service
├── workers/
│   └── CineAI.Worker/           # Hangfire Background Video Processing Worker
├── database/
│   ├── migrations/              # Entity Framework Core & SQL Migrations
│   ├── seed/                    # Initial Database Schema & Sample Data
│   └── functions/               # Database Stored Procedures & Triggers
├── infrastructure/
│   ├── docker/                  # Dockerfiles for API, Worker, and Web
│   ├── nginx/                   # Reverse Proxy Configuration
│   └── deployment/              # Deployment Automation Scripts
└── docs/                        # Architecture & API Specs Documentation
```

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### 1. Yêu Cầu Tiền Đề
- Node.js >= 20.x
- .NET SDK 9.0
- Docker & Docker Compose (tùy chọn)

### 2. Cấu Hình Biến Môi Trường
Sao chép `.env.example` thành `.env` và điền `GEMINI_API_KEY`:
```bash
cp .env.example .env
```

### 3. Chạy Bằng Docker Compose
```bash
docker-compose up -d
```

---

## 📄 Giấy Phép (License)
Dự án được phát triển dưới giấy phép [MIT](LICENSE).
