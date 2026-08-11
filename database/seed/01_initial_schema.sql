-- Initial Database Schema for CineAI Studio (PostgreSQL / Supabase)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(500),
    full_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    aspect_ratio VARCHAR(20) DEFAULT '16:9',
    style VARCHAR(50) DEFAULT 'cinematic',
    target_duration INT DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scripts Table
CREATE TABLE IF NOT EXISTS scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    logline TEXT,
    full_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Storyboards Table
CREATE TABLE IF NOT EXISTS storyboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Characters Table
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    age INT,
    gender VARCHAR(20),
    appearance TEXT,
    clothing TEXT,
    voice_description TEXT,
    reference_images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Video Jobs Table
CREATE TABLE IF NOT EXISTS video_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL DEFAULT '',
    model VARCHAR(100) DEFAULT 'google/veo-3.1-fast',
    operation_id TEXT,
    job_type VARCHAR(50) DEFAULT 'VeoVideoGeneration',
    status VARCHAR(50) NOT NULL DEFAULT 'Queued',
    progress_percentage INT DEFAULT 0,
    total_scenes INT DEFAULT 1,
    completed_scenes INT DEFAULT 0,
    video_path TEXT,
    final_video_path TEXT,
    thumbnail_path TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Scenes Table
CREATE TABLE IF NOT EXISTS scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    video_job_id UUID REFERENCES video_jobs(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    scene_number INT NOT NULL,
    duration FLOAT NOT NULL DEFAULT 5.0,
    prompt TEXT NOT NULL,
    camera_movement VARCHAR(100),
    lighting_style VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Pending',
    width INT DEFAULT 1080,
    height INT DEFAULT 1920,
    operation_id TEXT,
    video_path TEXT,
    normalized_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Scene Generations Table
CREATE TABLE IF NOT EXISTS scene_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    veo_operation_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    video_url TEXT,
    preview_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exports Table
CREATE TABLE IF NOT EXISTS exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    final_video_url TEXT NOT NULL,
    resolution VARCHAR(20) DEFAULT '1080p',
    file_size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Credits Table
CREATE TABLE IF NOT EXISTS credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance INT NOT NULL DEFAULT 100,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Credit Transactions Table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    type VARCHAR(50) NOT NULL, -- Deduct, TopUp, Refund
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data (Default Test User & Sample Project)
INSERT INTO users (id, email, password_hash, full_name)
VALUES ('11111111-1111-1111-1111-111111111111', 'demo@cineai.studio', 'hashed_pass_placeholder', 'CineAI Studio Demo User')
ON CONFLICT (id) DO NOTHING;

INSERT INTO credits (user_id, balance)
VALUES ('11111111-1111-1111-1111-111111111111', 500)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO projects (id, user_id, title, description, aspect_ratio, style, target_duration)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Hanoi After Dark',
    'Một video cinematic mô tả khung cảnh phố cổ Hà Nội về đêm với ánh đèn neon lung linh.',
    '9:16',
    'cinematic',
    30
) ON CONFLICT (id) DO NOTHING;
