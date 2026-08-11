# CineAI Studio 🎬🤖

**CineAI Studio** là nền tảng **AI Video Studio** thế hệ mới production-ready, kết hợp trí tuệ nhân tạo của **Gemini 3.1 Pro (AI Director)** và engine tạo video **Veo 3.1 (`google/veo-3.1-fast`)** từ Google để tự động thiết kế, viết kịch bản, vẽ storyboard, chuẩn hóa video phân cảnh và ghép nối tác phẩm điện ảnh hoàn chỉnh.

---

## 🌟 Tính Năng Nổi Bật (Key Features)

- 🧠 **Gemini 3.1 Pro AI Director**: Tự động chuyển đổi ý tưởng thô thành Kịch bản (Script), Storyboard, Phân cảnh (Scenes), Góc quay (Camera) và Ánh sáng (Lighting).
- 🎬 **Veo 3.1 Video Engine (`google/veo-3.1-fast`)**: Sinh clip phân cảnh chất lượng cao.
- ⏱️ **Multi-Scene Pipeline & Granular Tracking**: Quản lý 3 cấp (`Projects` → `VideoJobs` → `Scenes`) với trạng thái xử lý độc lập từng cảnh (`Pending`, `Generating`, `Downloaded`, `Normalized`, `ReadyForMerge`).
- 🎵 **FFmpeg Concat & Normalization Engine**: Tự động chuẩn hóa video (H.264, AAC, 30fps, 1080p) và ghép nối mượt mà qua FFmpeg Concat Demuxer.
- 🛡️ **Failure Isolation & Retry**: Hỗ trợ retry từng cảnh lỗi riêng biệt hoặc retry duy nhất bước Merge mà không cần tốn chi phí gọi lại Veo API.

---

## 🏗️ Cấu Trúc Dự Án (Project Structure)

```text
CineAI-Studio/
├── backend/                      # Backend Node.js Express API & Background Worker (TypeScript)
│   ├── src/
│   │   ├── controllers/          # API Controllers (Video, Project, Character, Credit, Export, Director)
│   │   ├── db/                   # PostgreSQL connection pool (pg)
│   │   ├── services/             # Gemini 3.1 Pro, Veo Service, FFmpeg Service
│   │   ├── worker/               # Asynchronous Video Job Queue Worker
│   │   └── server.ts             # Express Entry Point (Port 5000)
│   ├── storage/                  # Lưu trữ tĩnh (/scenes, /normalized, /videos, /thumbnails)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # Next.js Web Application
│   └── cineai-web/              # Next.js 15, TypeScript, TailwindCSS, Lucide React
│
├── database/                     # PostgreSQL Seed Scripts & Schema DDL
│   └── seed/
│       └── 01_initial_schema.sql
│
├── docs/                         # Tài liệu hướng dẫn & Kiến trúc hệ thống
├── .env                          # Biến môi trường hệ thống
├── README.md                     # Hướng dẫn khởi chạy dự án
└── docker-compose.yml
```

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### 1. Yêu Cầu Tiền Đề
- Node.js >= 20.x
- PostgreSQL Local (Database: `cineai_db`, Host: `localhost:5432`)
- FFmpeg (Đã cài đặt trên hệ thống PATH)

### 2. Cấu Hình Biến Môi Trường (`.env`)
Điền các khóa API trong file `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key
VEO_MODEL=google/veo-3.1-fast
PORT=5000
```

### 3. Chạy Backend Node.js
```bash
cd backend
npm install
npm run dev
```

### 4. Chạy Frontend Next.js
```bash
cd frontend/cineai-web
npm install
npm run dev
```

Truy cập giao diện tại: `http://localhost:3000`

---

## 📄 Giấy Phép (License)
Dự án được phát triển dưới giấy phép [MIT](LICENSE).
