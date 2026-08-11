import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

const STORAGE_DIR = path.join(process.cwd(), 'storage');
const AUDIO_DIR = path.join(STORAGE_DIR, 'audio');

// Ensure directories exist
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

export const ttsService = {
  /**
   * Mocks generating a Text-to-Speech audio file using ElevenLabs or Google TTS.
   * For MVP Phase 2, we generate a silent MP3 file of estimated duration using FFmpeg's anullsrc.
   */
  async generateVoiceover(text: string): Promise<{ audioPath: string, duration: number }> {
    console.log(`[ttsService] Generating TTS for text: "${text.substring(0, 50)}..."`);
    
    // Estimate duration: ~3 words per second
    const wordCount = text.split(/\s+/).length;
    const durationSeconds = Math.max(3, Math.ceil(wordCount / 3)); 
    
    const fileName = `vo_${uuidv4()}.mp3`;
    const outputPath = path.join(AUDIO_DIR, fileName);

    try {
      // Generate a silent audio track using FFmpeg
      await execAsync(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t ${durationSeconds} -q:a 9 -acodec libmp3lame ${outputPath}`);
      console.log(`[ttsService] TTS Mock generated at ${outputPath} (Duration: ${durationSeconds}s)`);
      
      return { audioPath: outputPath, duration: durationSeconds };
    } catch (error) {
      console.error('[ttsService] Error generating mock TTS audio:', error);
      throw new Error('Failed to generate TTS audio.');
    }
  }
};
