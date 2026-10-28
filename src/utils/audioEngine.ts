/**
 * Audio and Speech Engine for Lyricalens
 */

export function getStoredAccentPreference(): 'en-GB' | 'en-US' {
  try {
    const saved = localStorage.getItem('lyricalens_accent_preference');
    if (saved === 'en-US' || saved === 'en-GB') return saved;
  } catch {
    // ignore
  }
  return 'en-GB'; // Default British for IELTS
}

export function isAutoPronounceEnabled(): boolean {
  try {
    const saved = localStorage.getItem('lyricalens_auto_pronounce');
    if (saved !== null) return saved === 'true';
  } catch {
    // ignore
  }
  return true; // Default auto pronounce
}

// Pronounce a word with chosen accent ('en-GB' for UK, 'en-US' for US)
export function speakWord(text: string, accent?: 'en-GB' | 'en-US'): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this device.');
    return;
  }

  const targetAccent = accent || getStoredAccentPreference();
  window.speechSynthesis.cancel(); // Stop any pending speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = targetAccent;
  utterance.rate = 0.85; // Slightly slower, elegant articulation
  utterance.pitch = 1.0;
  utterance.volume = 0.85;

  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(targetAccent) || (targetAccent === 'en-GB' ? v.name.includes('British') || v.name.includes('UK') : v.name.includes('US') || v.name.includes('United States')));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
}

// Procedural soothing background synth audio fallback if external mp3 is blocked
class AmbientSynthPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: number | null = null;

  start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.isPlaying = true;
      this.playZenPad();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  private playZenPad() {
    if (!this.ctx || !this.isPlaying) return;

    const chords = [
      [220.0, 277.18, 329.63, 415.3], // A maj7
      [174.61, 220.0, 261.63, 329.63], // F maj7
      [196.0, 246.94, 293.66, 392.0],  // G
      [146.83, 185.0, 220.0, 277.18],  // D maj7
    ];

    let chordIdx = 0;

    const triggerChord = () => {
      if (!this.ctx || !this.isPlaying) return;
      const now = this.ctx.currentTime;
      const freqs = chords[chordIdx % chords.length];
      chordIdx++;

      freqs.forEach((f) => {
        if (!this.ctx) return;
        try {
          const osc = this.ctx.createOscillator?.();
          const gain = this.ctx.createGain?.();
          const filter = this.ctx.createBiquadFilter?.();

          if (!osc || !gain || !filter) return;

          if ('type' in osc) {
            osc.type = 'sine';
          }
          if (osc.frequency && typeof osc.frequency.setValueAtTime === 'function') {
            osc.frequency.setValueAtTime(f, now);
          }

          if ('type' in filter) {
            filter.type = 'lowpass';
          }
          if (filter.frequency && typeof filter.frequency.setValueAtTime === 'function') {
            filter.frequency.setValueAtTime(650, now);
          }

          if (gain.gain && typeof gain.gain.setValueAtTime === 'function') {
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 2.5);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 7.5);
          }

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 8.0);
        } catch (audioErr) {
          console.warn('Synth note error:', audioErr);
        }
      });
    };

    triggerChord();
    this.intervalId = window.setInterval(triggerChord, 6000);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const ambientSynth = new AmbientSynthPlayer();
