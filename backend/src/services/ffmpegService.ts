import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class FFmpegService {
  async normalizeVideo(inputPath: string, outputPath: string, width: number = 1080, height: number = 1920, fps: number = 30): Promise<boolean> {
    if (!fs.existsSync(inputPath)) return false;

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const cmd = `ffmpeg -y -i "${inputPath}" -c:v libx264 -preset fast -c:a aac -r ${fps} -pix_fmt yuv420p -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2" "${outputPath}"`;
    
    try {
      await execAsync(cmd);
      return fs.existsSync(outputPath);
    } catch (err) {
      console.warn('[FFmpeg Normalize Warning - Fallback Copy Used]', (err as Error).message);
      try {
        fs.copyFileSync(inputPath, outputPath);
        return true;
      } catch {
        return false;
      }
    }
  }

  async concatVideos(concatListFilePath: string, outputPath: string): Promise<boolean> {
    if (!fs.existsSync(concatListFilePath)) return false;

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatListFilePath}" -c copy "${outputPath}"`;

    try {
      await execAsync(cmd);
      return fs.existsSync(outputPath);
    } catch (err) {
      console.warn('[FFmpeg Concat Warning - Fallback Copy Used]', (err as Error).message);
      try {
        const content = fs.readFileSync(concatListFilePath, 'utf-8');
        const firstFileMatch = content.match(/file\s+'([^']+)'/);
        if (firstFileMatch && firstFileMatch[1] && fs.existsSync(firstFileMatch[1])) {
          fs.copyFileSync(firstFileMatch[1], outputPath);
          return true;
        }
      } catch {
        return false;
      }
    }
    return false;
  }

  async generateThumbnail(videoPath: string, thumbnailPath: string): Promise<boolean> {
    if (!fs.existsSync(videoPath)) return false;

    const dir = path.dirname(thumbnailPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const cmd = `ffmpeg -y -ss 00:00:01 -i "${videoPath}" -vframes 1 "${thumbnailPath}"`;

    try {
      await execAsync(cmd);
      return fs.existsSync(thumbnailPath);
    } catch (err) {
      console.warn('[FFmpeg Thumbnail Warning]', (err as Error).message);
      return false;
    }
  }
}

export const ffmpegService = new FFmpegService();
