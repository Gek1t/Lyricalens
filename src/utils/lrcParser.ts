import { LyricLine, LyricSpan } from '../types';

/**
 * Parses raw LRC format string into structured LyricLine array
 */
export function parseLRC(lrc: string = '', totalDurationSec: number = 180, tlyric: string = ''): LyricLine[] {
  if (!lrc || typeof lrc !== 'string') return [];
  const lines = lrc.split('\n');
  const parsedLines: LyricLine[] = [];

  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  // 1. Build translation map & list if tlyric is provided
  const transMap = new Map<number, string>();
  const transList: { timeMs: number; text: string }[] = [];

  if (tlyric && typeof tlyric === 'string') {
    const tLines = tlyric.split('\n');
    for (let i = 0; i < tLines.length; i++) {
      const raw = tLines[i].trim();
      if (!raw) continue;

      timeRegex.lastIndex = 0;
      const match = timeRegex.exec(raw);
      if (!match) continue;

      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const frac = match[3] ? (match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10)) : 0;
      const timeMs = min * 60 * 1000 + sec * 1000 + frac;

      const textContent = raw.replace(/\[.*?\]/g, '').trim();
      if (textContent && !textContent.startsWith('by:')) {
        transMap.set(timeMs, textContent);
        transList.push({ timeMs, text: textContent });
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    timeRegex.lastIndex = 0;
    const match = timeRegex.exec(raw);
    if (!match) continue;

    const min = parseInt(match[1], 10);
    const sec = parseInt(match[2], 10);
    const frac = match[3] ? (match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10)) : 0;
    const timeMs = min * 60 * 1000 + sec * 1000 + frac;

    const textContent = raw.replace(/\[.*?\]/g, '').trim();
    if (!textContent) continue;

    // Match translation by exact time or closest time within ±1.8s
    let translation = transMap.get(timeMs);
    if (!translation && transList.length > 0) {
      const closest = transList.find(t => Math.abs(t.timeMs - timeMs) <= 1800);
      if (closest) translation = closest.text;
    }

    parsedLines.push({
      timeMs,
      rawText: textContent,
      translation,
      spans: [] // Spans will be computed below
    });
  }

  // Sort chronologically
  parsedLines.sort((a, b) => a.timeMs - b.timeMs);

  // Compute word spans for word-level karaoke progress
  for (let i = 0; i < parsedLines.length; i++) {
    const currentLine = parsedLines[i];
    const nextTimeMs = i + 1 < parsedLines.length ? parsedLines[i + 1].timeMs : totalDurationSec * 1000;
    const lineDurationMs = Math.max(1500, nextTimeMs - currentLine.timeMs);

    const words = currentLine.rawText.split(/\s+/).filter(Boolean);
    const wordDuration = lineDurationMs / Math.max(1, words.length);

    const spans: LyricSpan[] = words.map((w, wIdx) => {
      const startMs = currentLine.timeMs + wIdx * wordDuration;
      const endMs = startMs + wordDuration;
      return {
        text: w,
        startMs,
        endMs
      };
    });

    currentLine.spans = spans;
  }

  return parsedLines;
}

/**
 * Binary search to find current active lyric line in O(log N)
 */
export function findActiveLyricIndex(lyrics: LyricLine[], currentTimeMs: number): number {
  if (lyrics.length === 0) return 0;
  if (currentTimeMs < lyrics[0].timeMs) return 0;
  if (currentTimeMs >= lyrics[lyrics.length - 1].timeMs) return lyrics.length - 1;

  let low = 0;
  let high = lyrics.length - 1;
  let result = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lyrics[mid].timeMs <= currentTimeMs) {
      result = mid;
      low = mid + 1; // Try to find a closer later line
    } else {
      high = mid - 1;
    }
  }

  return result;
}
