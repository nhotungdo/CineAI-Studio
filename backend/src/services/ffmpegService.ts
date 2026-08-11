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

    // Note: use -c:a aac only if audio exists, or use default codec mapping so videos without audio don't crash stream mapping
    const cmd = `ffmpeg -y -i "${inputPath}" -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -preset fast -r ${fps} -pix_fmt yuv420p "${outputPath}"`;
    
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

  async mergeWithAudioAndSubtitles(videoPath: string, outputPath: string, options: {
    bgMusicPath?: string,
    voiceoverPath?: string,
    subtitlePath?: string
  }): Promise<boolean> {
    if (!fs.existsSync(videoPath)) return false;

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let cmd = `ffmpeg -y -i "${videoPath}"`;
    let filterComplex = '';
    let mapArgs = '-map 0:v:0';
    let inputIdx = 1;
    let audioInputs = '';
    
    // Voiceover (Input 1)
    if (options.voiceoverPath && fs.existsSync(options.voiceoverPath)) {
      cmd += ` -i "${options.voiceoverPath}"`;
      audioInputs += `[${inputIdx}:a]volume=1.0[a${inputIdx}];`;
      inputIdx++;
    }

    // BG Music (Input 2)
    if (options.bgMusicPath && fs.existsSync(options.bgMusicPath)) {
      cmd += ` -i "${options.bgMusicPath}"`;
      audioInputs += `[${inputIdx}:a]volume=0.4[a${inputIdx}];`;
      inputIdx++;
    }

    if (inputIdx > 1) {
      filterComplex = audioInputs;
      
      // Amix inputs
      const mixInputs = Array.from({ length: inputIdx - 1 }, (_, i) => `[a${i + 1}]`).join('');
      filterComplex += `${mixInputs}amix=inputs=${inputIdx - 1}:duration=shortest[aout]`;
      
      mapArgs += ' -map "[aout]"';
    } else {
      // If original video has audio, keep it
      mapArgs += ' -c:a copy';
    }

    // Subtitles
    let vfArg = '';
    if (options.subtitlePath && fs.existsSync(options.subtitlePath)) {
      // FFmpeg subtitles filter requires paths with escaped backslashes on Windows, or just forward slashes
      const escapedSubPath = options.subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\\\:');
      vfArg = `-vf "subtitles='${escapedSubPath}':force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3'"`;
    }

    if (filterComplex) {
      cmd += ` -filter_complex "${filterComplex}"`;
    }

    cmd += ` ${mapArgs} ${vfArg} -c:v libx264 -preset fast -y "${outputPath}"`;

    try {
      console.log('[FFmpeg Merge] Executing:', cmd);
      await execAsync(cmd);
      return fs.existsSync(outputPath);
    } catch (err) {
      console.error('[FFmpeg Merge Error]', (err as Error).message);
      // Fallback: just copy the input
      fs.copyFileSync(videoPath, outputPath);
      return true;
    }
  }
}

export const ffmpegService = new FFmpegService();
