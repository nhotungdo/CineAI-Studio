-- Phase 2 Schema: Audio, Subtitles, and Advanced Editing
-- Execute this after 01_initial_schema.sql

CREATE TABLE IF NOT EXISTS audio_tracks (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'BGM', 'VOICEOVER', 'SFX'
    title VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    duration NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add Audio and Subtitle columns to video_jobs
ALTER TABLE video_jobs ADD COLUMN IF NOT EXISTS bg_music_id UUID REFERENCES audio_tracks(id) ON DELETE SET NULL;
ALTER TABLE video_jobs ADD COLUMN IF NOT EXISTS bg_music_volume NUMERIC(3, 2) DEFAULT 0.5; -- 0.0 to 1.0
ALTER TABLE video_jobs ADD COLUMN IF NOT EXISTS voiceover_id UUID REFERENCES audio_tracks(id) ON DELETE SET NULL;
ALTER TABLE video_jobs ADD COLUMN IF NOT EXISTS voiceover_volume NUMERIC(3, 2) DEFAULT 1.0; -- 0.0 to 1.0
ALTER TABLE video_jobs ADD COLUMN IF NOT EXISTS subtitle_style VARCHAR(50) DEFAULT 'Cinematic'; -- 'Cinematic', 'Standard', 'None'
ALTER TABLE video_jobs ADD COLUMN IF NOT EXISTS subtitle_path TEXT;

-- Create Subtitles table (Optional, for manual editing later)
CREATE TABLE IF NOT EXISTS subtitles (
    id UUID PRIMARY KEY,
    video_job_id UUID REFERENCES video_jobs(id) ON DELETE CASCADE,
    start_time NUMERIC(10, 2) NOT NULL,
    end_time NUMERIC(10, 2) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
