import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_DIR = path.join(process.cwd(), 'storage');
const SUBTITLES_DIR = path.join(STORAGE_DIR, 'subtitles');

// Ensure directories exist
if (!fs.existsSync(SUBTITLES_DIR)) {
  fs.mkdirSync(SUBTITLES_DIR, { recursive: true });
}

export const subtitleService = {
  /**
   * Mocks generating an SRT subtitle file from a script.
   * Splits the script into roughly equal time chunks across the given duration.
   */
  async generateSubtitles(script: string, totalDuration: number): Promise<string> {
    console.log(`[subtitleService] Generating Subtitles for ${totalDuration}s`);
    
    const fileName = `sub_${uuidv4()}.srt`;
    const outputPath = path.join(SUBTITLES_DIR, fileName);

    // Naive sentence splitting
    const sentences = script.replace(/([.?!])\s*/g, "$1|").split("|").filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) {
      sentences.push(script); // Fallback if no punctuation
    }

    const timePerSentence = totalDuration / sentences.length;
    let srtContent = '';

    for (let i = 0; i < sentences.length; i++) {
      const startTime = i * timePerSentence;
      const endTime = (i + 1) * timePerSentence;
      
      srtContent += `${i + 1}\n`;
      srtContent += `${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n`;
      srtContent += `${sentences[i].trim()}\n\n`;
    }

    try {
      fs.writeFileSync(outputPath, srtContent, 'utf8');
      console.log(`[subtitleService] SRT generated at ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('[subtitleService] Error generating SRT:', error);
      throw new Error('Failed to generate Subtitles.');
    }
  }
};

/**
 * Format seconds to SRT timestamp: HH:MM:SS,mmm
 */
function formatSrtTime(seconds: number): string {
  const date = new Date(0);
  date.setMilliseconds(seconds * 1000);
  const iso = date.toISOString(); // "1970-01-01T00:00:05.123Z"
  const timeStr = iso.substring(11, 23); // "00:00:05.123"
  return timeStr.replace('.', ',');
}
