import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../../store/useAppStore';
import { parseLRC, findActiveLyricIndex } from '../../utils/lrcParser';
import { extractDominantPalette, applyAmbientGlowColors } from '../../utils/colorExtractor';
import { ambientSynth, speakWord } from '../../utils/audioEngine';
import { db, collectWord, cycleWordMastery } from '../../db';
import { SEED_WORDS } from '../../db/seedData';
import { WordItem, SongItem, MasteryLevel, AudioQuality, AUDIO_QUALITY_OPTIONS } from '../../types';
import { analyzeSongVocab } from '../../utils/vocabEngine';
import { TopHeader } from '../TopHeader';
import { AmbientBackground } from '../AmbientBackground';
import { FullscreenLyricsView } from './FullscreenLyricsView';
import { MasteryBadge, MASTERY_CONFIG } from '../MasteryBadge';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  Sparkles,
  Volume2,
  BookOpen,
  ArrowUpRight,
  Quote,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';

export type PlayMode = 'list' | 'single' | 'shuffle';

interface MusicPlayerPanelProps {
  onOpenNotebook: () => void;
}

export const MusicPlayerPanel: React.FC<MusicPlayerPanelProps> = ({ onOpenNotebook }) => {
  const songs = useAppStore(s => s.songs);
  const currentSongIndex = useAppStore(s => s.currentSongIndex);
  const isPlaying = useAppStore(s => s.isPlaying);
  const currentTime = useAppStore(s => s.currentTime);
  const duration = useAppStore(s => s.duration);
  const activeLyricIndex = useAppStore(s => s.activeLyricIndex);
  const lyricsOffsets = useAppStore(s => s.lyricsOffsets);

  const setCurrentSongIndex = useAppStore(s => s.setCurrentSongIndex);
  const setIsPlaying = useAppStore(s => s.setIsPlaying);
  const setCurrentTime = useAppStore(s => s.setCurrentTime);
  const setDuration = useAppStore(s => s.setDuration);
  const setAmbientColors = useAppStore(s => s.setAmbientColors);
  const setActiveLyricIndex = useAppStore(s => s.setActiveLyricIndex);
  const songTransitionDirection = useAppStore(s => s.songTransitionDirection);
  const nextSong = useAppStore(s => s.nextSong);
  const prevSong = useAppStore(s => s.prevSong);
  const openWordDetail = useAppStore(s => s.openWordDetail);
  const showToast = useAppStore(s => s.showToast);
  const setSongs = useAppStore(s => s.setSongs);
  const audioQuality = useAppStore(s => s.audioQuality);
  const setAudioQuality = useAppStore(s => s.setAudioQuality);

  const isPlaylistOpen = useAppStore(s => s.isPlaylistOpen);
  const setIsPlaylistOpen = useAppStore(s => s.setIsPlaylistOpen);
  const isFullscreenLyricsOpen = useAppStore(s => s.isFullscreenLyricsOpen);
  const setIsFullscreenLyricsOpen = useAppStore(s => s.setIsFullscreenLyricsOpen);
  const isVocabRadarOpen = useAppStore(s => s.isVocabRadarOpen);
  const setIsVocabRadarOpen = useAppStore(s => s.setIsVocabRadarOpen);
  const isDark = useAppStore(s => s.isDark);
  const isQualityModalOpen = useAppStore(s => s.isAudioQualityModalOpen);
  const setIsQualityModalOpen = useAppStore(s => s.setIsAudioQualityModalOpen);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cardPointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const currentTimeRef = useRef<number>(0);
  const resumeTimeRef = useRef<number | null>(null);
  const prevSongIdRef = useRef<string | null>(null);
  const prevAudioQualityRef = useRef<string>(audioQuality);
  const [playMode, setPlayMode] = useState<PlayMode>('list');
  // 伪随机洗牌队列状态（维护确定性的洗牌顺序索引链）
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);
  const [shuffledCursor, setShuffledCursor] = useState<number>(0);

  // Real world time tracking for polaroid stamp
  const [realTimeStr, setRealTimeStr] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setRealTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live query database words to enrich radar data
  const dbWords = useLiveQuery(() => {
    return db.words.toArray();
  }, []) || [];

  const fallbackSong: SongItem = useMemo(() => ({
    id: 'seed-serenity-bloom',
    title: 'Serenity & Solitude',
    artist: 'Aether Bloom',
    duration: 184,
    albumArtUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
    audioUrl: 'https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3',
    palette: ['#7C8F6E', '#C4AC82', '#A69880'],
    keyVocab: ['ephemeral', 'resilience', 'solitude'],
    lrcText: `[00:00.00]Serenity & Solitude - Aether Bloom\n[00:04.00]In the quiet morning light, gentle moments bloom\n[00:10.00]Ephemeral beauty whispers through the room\n[00:18.00]Finding inner resilience when the world is fast\n[00:26.00]In the sweet embrace of solitude that will last`,
    tlyricText: `[00:00.00]宁静与独处 - Aether Bloom\n[00:04.00]在清晨静谧的微光中，温柔的时光悄然绽放\n[00:10.00]转瞬即逝的美丽在室中轻柔低语\n[00:18.00]在纷扰喧嚣的世界里，找寻内心的韧性与坚定\n[00:26.00]沉浸于这份持久而甘甜的静谧独处`
  }), []);

  const currentSong: SongItem = songs[currentSongIndex] || songs[0] || fallbackSong;

  // Resolved list of genuine vocabulary words for this song (Notebook words prioritized first)
  const songVocabList: WordItem[] = useMemo(() => {
    if (!currentSong) return [];
    const analysis = analyzeSongVocab(currentSong, dbWords);
    const keyVocabs = analysis.allKeyVocab.length > 0 ? analysis.allKeyVocab : (currentSong.keyVocab || []);
    
    return keyVocabs.map((vocabStr) => {
      const matchDb = dbWords.find(w => w.word.toLowerCase() === vocabStr.toLowerCase());
      if (matchDb) return matchDb;
      const matchSeed = SEED_WORDS.find(w => w.word.toLowerCase() === vocabStr.toLowerCase());
      if (matchSeed) {
        return {
          ...matchSeed,
        } as WordItem;
      }
      return {
        word: vocabStr,
        phoneticUk: `/${vocabStr}/`,
        phoneticUs: `/${vocabStr}/`,
        partOfSpeech: 'VOCAB',
        definition: `Target key vocabulary in ${currentSong.title}`,
        definitionCn: '雅思核心高频词汇',
        examples: [{
          en: `Featured in the song "${currentSong.title}"`,
          cn: `收录于本曲核心意境`
        }],
        isStarred: false,
        addedTimestamp: Date.now()
      } as WordItem;
    });
  }, [currentSong, dbWords]);

  const [colorTheme, setColorTheme] = useState<{
    mattingBg: string;
    mattingBgDark: string;
    accentBtn: string;
    accentBtnDark: string;
  }>({
    mattingBg: 'hsl(110, 10%, 92%)',
    mattingBgDark: 'hsl(110, 12%, 14%)',
    accentBtn: 'hsl(110, 20%, 35%)',
    accentBtnDark: 'hsl(110, 25%, 45%)'
  });

  const handleCardPointerDown = (e: React.PointerEvent) => {
    cardPointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (!cardPointerStartRef.current) return;
    const dx = Math.abs(e.clientX - cardPointerStartRef.current.x);
    const dy = Math.abs(e.clientY - cardPointerStartRef.current.y);
    const dt = Date.now() - cardPointerStartRef.current.time;

    // Only open fullscreen lyrics if it was a genuine, non-moving stationary tap
    // (less than 8px movement and completed within 350ms, not a vertical or horizontal swipe)
    if (dx < 8 && dy < 8 && dt < 350) {
      setIsFullscreenLyricsOpen(true);
    }
  };

  // 生成确定性洗牌队列（当前正在听的曲目始终固定在序列首部作为锚点）
  const generateShuffleQueue = useCallback((songCount: number, currentIdx: number) => {
    if (songCount <= 0) return [];
    const indices = Array.from({ length: songCount }, (_, i) => i);
    
    // Fisher-Yates 算法确定性洗牌
    for (let i = songCount - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // 将当前播放曲目固定置于队列游标 0 位置
    const foundPos = indices.indexOf(currentIdx);
    if (foundPos !== -1) {
      indices.splice(foundPos, 1);
      indices.unshift(currentIdx);
    }

    return indices;
  }, []);

  const togglePlayMode = () => {
    if (playMode === 'list') {
      setPlayMode('single');
      showToast('单曲循环');
    } else if (playMode === 'single') {
      setPlayMode('shuffle');
      if (songs.length > 0) {
        const newQueue = generateShuffleQueue(songs.length, currentSongIndex);
        setShuffledOrder(newQueue);
        setShuffledCursor(0);
      }
      showToast('伪随机洗牌播放（队列已固定）');
    } else {
      setPlayMode('list');
      showToast('列表循环');
    }
  };

  // 当用户在歌单中手动点播某首歌时，同步对齐洗牌队列游标
  useEffect(() => {
    if (playMode === 'shuffle' && songs.length > 0) {
      if (shuffledOrder.length === songs.length) {
        const pos = shuffledOrder.indexOf(currentSongIndex);
        if (pos !== -1) {
          setShuffledCursor(pos);
        } else {
          const newQueue = generateShuffleQueue(songs.length, currentSongIndex);
          setShuffledOrder(newQueue);
          setShuffledCursor(0);
        }
      } else {
        const newQueue = generateShuffleQueue(songs.length, currentSongIndex);
        setShuffledOrder(newQueue);
        setShuffledCursor(0);
      }
    }
  }, [currentSongIndex, playMode, songs.length, shuffledOrder, generateShuffleQueue]);

  const handleNext = useCallback(() => {
    if (songs.length === 0) return;

    if (playMode === 'shuffle' && songs.length > 1) {
      if (shuffledOrder.length !== songs.length || shuffledOrder.length === 0) {
        const newQueue = generateShuffleQueue(songs.length, currentSongIndex);
        setShuffledOrder(newQueue);
        setShuffledCursor(newQueue.length > 1 ? 1 : 0);
        const targetIdx = newQueue.length > 1 ? newQueue[1] : newQueue[0];
        setCurrentSongIndex(targetIdx, 'right');
      } else {
        // 沿既定洗牌队列前进一步；全轮播放完毕后自动生成下一轮序列
        const nextCursor = (shuffledCursor + 1) % shuffledOrder.length;
        if (nextCursor === 0 && shuffledOrder.length > 1) {
          const newQueue = generateShuffleQueue(songs.length, shuffledOrder[shuffledCursor]);
          setShuffledOrder(newQueue);
          setShuffledCursor(1);
          setCurrentSongIndex(newQueue[1] ?? newQueue[0], 'right');
        } else {
          setShuffledCursor(nextCursor);
          setCurrentSongIndex(shuffledOrder[nextCursor], 'right');
        }
      }
    } else {
      nextSong('right');
    }
  }, [playMode, songs.length, currentSongIndex, shuffledOrder, shuffledCursor, generateShuffleQueue, setCurrentSongIndex, nextSong]);

  const handlePrev = useCallback(() => {
    if (songs.length === 0) return;

    // 如果播放超过 3 秒，先回到歌曲开头
    if (currentTimeRef.current > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      currentTimeRef.current = 0;
      setCurrentTime(0);
      return;
    }

    if (playMode === 'shuffle' && songs.length > 1) {
      if (shuffledOrder.length !== songs.length || shuffledOrder.length === 0) {
        const newQueue = generateShuffleQueue(songs.length, currentSongIndex);
        setShuffledOrder(newQueue);
        setShuffledCursor(0);
        setCurrentSongIndex(newQueue[0], 'left');
      } else {
        // 精确回溯到洗牌队列中的上一首（固定可追溯）
        const prevCursor = (shuffledCursor - 1 + shuffledOrder.length) % shuffledOrder.length;
        setShuffledCursor(prevCursor);
        setCurrentSongIndex(shuffledOrder[prevCursor], 'left');
      }
    } else {
      prevSong('left');
    }
  }, [playMode, songs.length, currentSongIndex, shuffledOrder, shuffledCursor, generateShuffleQueue, setCurrentSongIndex, prevSong, setCurrentTime]);

  const handleSongEnded = useCallback(() => {
    if (playMode === 'single') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      setCurrentTime(0);
    } else {
      handleNext();
    }
  }, [playMode, handleNext, setCurrentTime]);

  const handleSelectSong = (index: number) => {
    const dir = index >= currentSongIndex ? 'right' : 'left';
    setCurrentSongIndex(index, dir);
    setIsPlaylistOpen(false);
    setIsPlaying(true);
    showToast(`Playing: ${songs[index]?.title || ''}`);
  };

  // Parse LRC into millisecond-accurate lines
  const parsedLyrics = useMemo(() => {
    if (!currentSong) return [];
    return parseLRC(currentSong.lrcText || '', currentSong.duration || 168, currentSong.tlyricText || '');
  }, [currentSong]);

  // Active lyric line quote computation
  const activeLyricLine = (parsedLyrics && parsedLyrics.length > 0) 
    ? (parsedLyrics[activeLyricIndex] || parsedLyrics[0]) 
    : null;
  
  const curQuote = useMemo(() => {
    if (activeLyricLine && activeLyricLine.rawText) {
      const text = activeLyricLine.rawText.replace(/^\[.*?\]/, '').trim();
      if (text) {
        // Look for any key vocabulary in this line
        const targetVocab = ((currentSong && currentSong.keyVocab) || []).find(v => v && text.toLowerCase().includes(v.toLowerCase()));
        if (targetVocab) {
          const lower = text.toLowerCase();
          const vIdx = lower.indexOf(targetVocab.toLowerCase());
          const prefix = text.slice(0, vIdx);
          const matchedWord = text.slice(vIdx, vIdx + targetVocab.length);
          const suffix = text.slice(vIdx + targetVocab.length);
          return {
            quotePrefix: `“${prefix}`,
            targetWord: matchedWord,
            quoteSuffix: `${suffix}”`,
            fullSentence: text,
            translation: activeLyricLine?.translation || ''
          };
        }

        // If no predefined vocab matched, pick the longest meaningful word or first word
        const words = text.split(/\s+/).filter(w => w.length > 3 && /^[a-zA-Z]+$/.test(w));
        const pickedWord = words.length > 0 ? words.sort((a, b) => b.length - a.length)[0] : '';
        if (pickedWord) {
          const lower = text.toLowerCase();
          const wIdx = lower.indexOf(pickedWord.toLowerCase());
          return {
            quotePrefix: `“${text.slice(0, wIdx)}`,
            targetWord: text.slice(wIdx, wIdx + pickedWord.length),
            quoteSuffix: `${text.slice(wIdx + pickedWord.length)}”`,
            fullSentence: text,
            translation: activeLyricLine?.translation || ''
          };
        }

        return {
          quotePrefix: `“${text}`,
          targetWord: '',
          quoteSuffix: '”',
          fullSentence: text,
          translation: activeLyricLine?.translation || ''
        };
      }
    }

    const title = currentSong?.title || 'Lyricalens';
    const artist = currentSong?.artist || 'Ambient Soundscape';

    return {
      quotePrefix: `“${title}`,
      targetWord: artist,
      quoteSuffix: '”',
      fullSentence: `${title} - ${artist}`,
      translation: ''
    };
  }, [activeLyricLine, currentSong]);

  // Extract dynamic album palette and Morandi/contrast tones on song switch
  useEffect(() => {
    if (!currentSong?.albumArtUrl) return;
    let isCancelled = false;

    extractDominantPalette(currentSong.albumArtUrl).then((theme) => {
      if (!isCancelled && theme?.palette) {
        setAmbientColors(theme.palette);
        applyAmbientGlowColors(theme.palette);
        setColorTheme({
          mattingBg: theme.mattingBg,
          mattingBgDark: theme.mattingBgDark,
          accentBtn: theme.accentBtn,
          accentBtnDark: theme.accentBtnDark
        });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [currentSong, setAmbientColors]);

  // On-demand lyric and translation fetcher if missing or default placeholder
  useEffect(() => {
    if (!currentSong) return;
    const isDefaultLrc = !currentSong.lrcText || currentSong.lrcText.includes('Listening to the melodic rhythm');
    if (isDefaultLrc || !currentSong.tlyricText) {
      let isCancelled = false;
      const fetchLyric = async () => {
        try {
          const cleanId = currentSong.id.replace(/^ncm-/, '');
          const res = await fetch(`/api/music/song-lyric?id=${cleanId}&title=${encodeURIComponent(currentSong.title)}&artist=${encodeURIComponent(currentSong.artist)}`);
          if (res.ok) {
            const data = await res.json();
            if (!isCancelled && (data.lrc || data.tlyric)) {
              const updatedSongs = songs.map((s, idx) => {
                if (idx === currentSongIndex) {
                  return {
                    ...s,
                    lrcText: (data.lrc && data.lrc.includes('[')) ? data.lrc : s.lrcText,
                    tlyricText: data.tlyric || s.tlyricText
                  };
                }
                return s;
              });
              setSongs(updatedSongs);
              if (currentSong.id) {
                await db.songs.put(updatedSongs[currentSongIndex]);
              }
            }
          }
        } catch {
          // ignore
        }
      };
      fetchLyric();
      return () => {
        isCancelled = true;
      };
    }
  }, [currentSong?.id, currentSongIndex, songs, setSongs]);

  const [fallbackStreamUrl, setFallbackStreamUrl] = useState<string>('');

  const resolvedAudioSrc = useMemo(() => {
    if (!currentSong) return '';

    // If a fallback auto-heal stream was triggered for this song, prioritize it
    if (fallbackStreamUrl) {
      return fallbackStreamUrl;
    }
    
    // 1. Local offline files or blob/data streams: NEVER proxy, return directly
    if (
      currentSong.id?.startsWith('local-') ||
      currentSong.audioUrl?.startsWith('blob:') ||
      currentSong.audioUrl?.startsWith('data:')
    ) {
      return currentSong.audioUrl || '';
    }

    const rawId = currentSong.id || '';
    let songPlatform = 'netease';
    let cleanId = rawId;

    if (rawId.startsWith('qq-')) {
      songPlatform = 'qq';
      cleanId = rawId.replace(/^qq-/, '');
    } else if (rawId.startsWith('kugou-')) {
      songPlatform = 'kugou';
      cleanId = rawId.replace(/^kugou-/, '');
    } else if (rawId.startsWith('kuwo-')) {
      songPlatform = 'kuwo';
      cleanId = rawId.replace(/^kuwo-/, '');
    } else if (rawId.startsWith('migu-')) {
      songPlatform = 'migu';
      cleanId = rawId.replace(/^migu-/, '');
    } else if (rawId.startsWith('spotify-')) {
      songPlatform = 'spotify';
      cleanId = rawId.replace(/^spotify-/, '');
    } else {
      cleanId = rawId.replace(/^ncm-/, '');
    }

    const platformCookie = typeof window !== 'undefined'
      ? (localStorage.getItem(`lyricalens_${songPlatform}_cookie`) || (songPlatform === 'netease' ? localStorage.getItem('lyricalens_ncm_cookie') : '') || '')
      : '';
    const cookieParam = platformCookie ? `&cookie=${encodeURIComponent(platformCookie)}` : '';
    const targetLevel = audioQuality || 'exhigh';
    const isNative = Capacitor.isNativePlatform();

    // 2. If it's already an absolute working audio stream endpoint, accurately update/append level & cookie
    if (currentSong.audioUrl && currentSong.audioUrl.includes('/api/music/audio-stream')) {
      let finalUrl = currentSong.audioUrl;
      if (finalUrl.includes('level=')) {
        finalUrl = finalUrl.replace(/level=[^&]*/, `level=${encodeURIComponent(targetLevel)}`);
      } else {
        finalUrl += `&level=${encodeURIComponent(targetLevel)}`;
      }
      if (cookieParam) {
        if (finalUrl.includes('cookie=')) {
          finalUrl = finalUrl.replace(/cookie=[^&]*/, `cookie=${encodeURIComponent(platformCookie)}`);
        } else {
          finalUrl += cookieParam;
        }
      }
      return finalUrl;
    }

    // 3. For Standalone Mobile APK (no local Node server running):
    // If the song already has a valid direct HTTP/HTTPS URL (Meting, CDN, external outer URL), KEEP IT!
    if (isNative && currentSong.audioUrl && /^https?:\/\//i.test(currentSong.audioUrl)) {
      return currentSong.audioUrl;
    }

    // 4. Default: Proxy through backend audio stream (in Web / Fullstack environment)
    if (currentSong.audioUrl && /^https?:\/\//i.test(currentSong.audioUrl) && !currentSong.id?.startsWith('ncm-')) {
      return currentSong.audioUrl;
    }
    
    return `/api/music/audio-stream?name=${encodeURIComponent(currentSong.title)}&artist=${encodeURIComponent(currentSong.artist)}&id=${encodeURIComponent(rawId)}&platform=${songPlatform}${cookieParam}&level=${encodeURIComponent(targetLevel)}`;
  }, [currentSong, audioQuality, fallbackStreamUrl]);

  // Reset fallback stream url when switching songs
  useEffect(() => {
    setFallbackStreamUrl('');
  }, [currentSong?.id]);

  // Track audio quality transitions to seamlessly preserve position and continue playing
  useEffect(() => {
    if (prevAudioQualityRef.current !== audioQuality) {
      const audio = audioRef.current;
      const currentPos = (audio && audio.currentTime > 0) ? audio.currentTime : currentTimeRef.current;
      if (currentPos > 0) {
        resumeTimeRef.current = currentPos;
      }
      prevAudioQualityRef.current = audioQuality;
    }
  }, [audioQuality]);

  useEffect(() => {
    if (prevSongIdRef.current !== currentSong?.id) {
      prevSongIdRef.current = currentSong?.id || null;
      resumeTimeRef.current = null;
    }
  }, [currentSong?.id]);

  // Audio Playback synchronization
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.2; // 20% phone volume

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio streaming fallback to ambient synth:', err);
          ambientSynth.start();
        });
      }
    } else {
      audio.pause();
      ambientSynth.stop();
    }
  }, [isPlaying, currentSongIndex, resolvedAudioSrc]);

  // Helper to safely restore seek position on media stream reload/switch
  const tryRestorePlaybackPosition = (el: HTMLAudioElement) => {
    if (resumeTimeRef.current !== null && resumeTimeRef.current > 0) {
      const targetTime = resumeTimeRef.current;
      try {
        if (Number.isFinite(targetTime) && targetTime <= (el.duration || Infinity)) {
          el.currentTime = targetTime;
          currentTimeRef.current = targetTime;
          setCurrentTime(targetTime);
        }
      } catch (err) {
        console.warn('Failed to restore currentTime on audio reload:', err);
      }
      // Clear after successful seek or keep if duration not ready yet
      if (el.duration && el.duration > 0) {
        resumeTimeRef.current = null;
      }
    }
  };

  // RequestAnimationFrame Lyric Engine Loop
  const currentSongOffset = lyricsOffsets[currentSong.id] || 0;

  useEffect(() => {
    const updateLyricFrame = () => {
      const audio = audioRef.current;
      if (audio && isPlaying) {
        const curTimeSec = audio.currentTime;
        currentTimeRef.current = curTimeSec;
        setCurrentTime(curTimeSec);

        const curTimeMs = Math.max(0, (curTimeSec + currentSongOffset) * 1000);
        const newActiveIdx = findActiveLyricIndex(parsedLyrics, curTimeMs);

        if (newActiveIdx !== activeLyricIndex) {
          setActiveLyricIndex(newActiveIdx);
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateLyricFrame);
    };

    animationFrameRef.current = requestAnimationFrame(updateLyricFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, parsedLyrics, activeLyricIndex, currentSongOffset, setCurrentTime, setActiveLyricIndex]);

  // Re-calculate active index immediately if offset or parsedLyrics change even while paused
  useEffect(() => {
    const curTimeMs = Math.max(0, (currentTime + currentSongOffset) * 1000);
    const newActiveIdx = findActiveLyricIndex(parsedLyrics, curTimeMs);
    if (newActiveIdx !== activeLyricIndex) {
      setActiveLyricIndex(newActiveIdx);
    }
  }, [currentSongOffset, currentTime, parsedLyrics]);

  // Click target word: collect to Dexie + open Word Detail bottom sheet with dual contexts
  const handleWordClick = async (wordText: string, contextSentence: string) => {
    const cleanWord = wordText.replace(/^[^\w]+|[^\w]+$/g, '').toLowerCase();
    if (!cleanWord || cleanWord.length < 2) return;

    const collected = await collectWord({
      word: cleanWord,
      phoneticUk: cleanWord === 'ephemeral' ? '/ɪˈfem.ər.əl/' : cleanWord === 'meticulous' ? '/məˈtɪk.jə.ləs/' : `/${cleanWord}/`,
      phoneticUs: cleanWord === 'ephemeral' ? '/əˈfem.ɚ.əl/' : cleanWord === 'meticulous' ? '/məˈtɪk.jə.ləs/' : `/${cleanWord}/`,
      partOfSpeech: cleanWord === 'ephemeral' || cleanWord === 'meticulous' ? 'adj.' : 'vocab',
      definition: cleanWord === 'ephemeral'
        ? 'Lasting for only a very short time; transitory.'
        : cleanWord === 'meticulous'
        ? 'Showing great attention to detail; very careful and precise.'
        : `Key vocabulary in ${currentSong.title}.`,
      definitionCn: cleanWord === 'ephemeral'
        ? '短暂的，转瞬即逝的'
        : cleanWord === 'meticulous'
        ? '一丝不苟的，缜密的，精致的'
        : '核心语境生词',
      examples: [
        {
          en: contextSentence,
          cn: cleanWord === 'ephemeral' ? '落日的晚风中，芬芳低语随风转瞬即逝。' : '如深蓝夜幕下，一丝不苟的精致回忆。',
          source: `Song: ${currentSong.title}`
        },
        {
          en: cleanWord === 'ephemeral'
            ? 'The ephemeral blooming cycle of alpine flora enables survival in harsh urban microclimates.'
            : 'City planners obsess over meticulously curated parks while spontaneous flora pioneers urban margins.',
          cn: cleanWord === 'ephemeral'
            ? '城市高山植物短暂的开花周期使其能够在严酷的微气候中生存繁衍。'
            : '城市规划者潜心于一丝不苟规划的公园，而自生植物则在城市边缘拓荒。',
          source: 'IELTS Academic Reading'
        }
      ],
      sourceContext: `Song: ${currentSong.title}`,
      categories: ['Song Lyric', 'Music Hub', 'IELTS Academic']
    });

    openWordDetail(collected);
    speakWord(cleanWord, 'en-GB');
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
    currentTimeRef.current = val;
    setCurrentTime(val);
  };

  const handleAudioLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const el = e.currentTarget;
    el.volume = 0.2;
    setDuration(el.duration || currentSong.duration);
    tryRestorePlaybackPosition(el);

    if (isPlaying) {
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio tag playback error after source change:', err);
        });
      }
    }
  };

  const handleAudioCanPlay = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const el = e.currentTarget;
    tryRestorePlaybackPosition(el);

    if (isPlaying && el.paused) {
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#FAF8F5] dark:bg-[#0B0F17] select-none pb-[max(2.25rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]">
      {/* Dynamic Ambient Breathing Glow Orbs */}
      <AmbientBackground />

      {/* Hidden Audio Element */}
      <audio
        ref={(el) => {
          audioRef.current = el;
          if (el) el.volume = 0.2;
        }}
        src={resolvedAudioSrc}
        loop={playMode === 'single'}
        onLoadedMetadata={handleAudioLoadedMetadata}
        onLoadedData={(e) => tryRestorePlaybackPosition(e.currentTarget)}
        onCanPlay={handleAudioCanPlay}
        onError={() => {
          const rawId = currentSong.id || '';
          if (!rawId || rawId.startsWith('song-') || rawId.startsWith('local-')) {
            return;
          }
          let platformServer = 'netease';
          let cleanId = rawId;

          if (rawId.startsWith('qq-')) {
            platformServer = 'tencent';
            cleanId = rawId.replace(/^qq-/, '');
          } else if (rawId.startsWith('kugou-')) {
            platformServer = 'kugou';
            cleanId = rawId.replace(/^kugou-/, '');
          } else if (rawId.startsWith('kuwo-')) {
            platformServer = 'kuwo';
            cleanId = rawId.replace(/^kuwo-/, '');
          } else if (rawId.startsWith('migu-')) {
            platformServer = 'migu';
            cleanId = rawId.replace(/^migu-/, '');
          } else {
            cleanId = rawId.replace(/^ncm-/, '');
          }

          if (cleanId && !fallbackStreamUrl) {
            const fallbackUrl = `https://api.injahow.cn/meting/?type=url&id=${encodeURIComponent(cleanId)}&server=${platformServer}`;
            setFallbackStreamUrl(fallbackUrl);
          }
        }}
        onEnded={handleSongEnded}
        preload="auto"
      />

      {/* Top Header: keyboard_arrow_down | NOW PLAYING | more_horiz */}
      <TopHeader
        centerLabel="NOW PLAYING"
        onOpenNotebook={onOpenNotebook}
      />

      {/* Center Gallery Art Frame Area (Fluid Golden Ratio & Adaptive Vertical Rhythm across all mobile heights) */}
      <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center px-4 z-10 my-auto py-1 gap-y-2.5 sm:gap-y-4 overflow-hidden">
        {/* 1. Header Title Area (Directly above the frame) with animated crossfade */}
        <div className="min-h-[44px] sm:min-h-[52px] shrink-0 flex items-center justify-center">
          <AnimatePresence mode="wait" custom={songTransitionDirection}>
            <motion.div
              key={currentSong.id + '-title'}
              custom={songTransitionDirection}
              variants={{
                initial: (dir: 'up' | 'down' | 'left' | 'right') => {
                  if (dir === 'up') return { opacity: 0, y: 16, x: 0 };
                  if (dir === 'down') return { opacity: 0, y: -16, x: 0 };
                  return { opacity: 0, y: 0, x: dir === 'right' ? 12 : -12 };
                },
                animate: { opacity: 1, y: 0, x: 0 },
                exit: (dir: 'up' | 'down' | 'left' | 'right') => {
                  if (dir === 'up') return { opacity: 0, y: -16, x: 0 };
                  if (dir === 'down') return { opacity: 0, y: 16, x: 0 };
                  return { opacity: 0, y: 0, x: dir === 'right' ? -12 : 12 };
                }
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="text-center select-none"
            >
              <motion.p
                layoutId={`track-artist-${currentSong.id}`}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="font-sans text-[11px] uppercase tracking-[0.3em] text-[#78716C] dark:text-stone-400 font-normal"
              >
                {currentSong.artist ? currentSong.artist.toUpperCase() : 'ETHEREAL SOUNDS'}
              </motion.p>
              <motion.h1
                layoutId={`track-title-${currentSong.id}`}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="font-serif-luxury text-[21px] font-normal text-[#292524] dark:text-stone-100 tracking-[0.15em] uppercase mt-1"
              >
                {currentSong.title}
              </motion.h1>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 2. Realistic Photo Mount Frame with Card Slide & Depth Push */}
        <div className="relative flex items-center justify-center min-h-0 shrink w-full">
          {/* Gentle, ethereal ambient backlight (Ultra-clean) */}
          <div
            className={`absolute -inset-4 rounded-full blur-[70px] transition-all duration-1000 pointer-events-none ${
              isPlaying ? 'opacity-25 dark:opacity-20 scale-105' : 'opacity-15 dark:opacity-10 scale-95'
            }`}
            style={{
              backgroundColor: currentSong?.palette?.[0] || '#E8E4DC'
            }}
          />

          <AnimatePresence mode="popLayout" custom={songTransitionDirection}>
            <motion.div
              key={currentSong.id}
              custom={songTransitionDirection}
              variants={{
                initial: (dir: 'up' | 'down' | 'left' | 'right') => {
                  if (dir === 'up') {
                    return {
                      y: 75,
                      x: 0,
                      opacity: 0,
                      scale: 0.92,
                      rotateX: -10,
                      rotate: 0,
                      filter: 'blur(3px)'
                    };
                  }
                  if (dir === 'down') {
                    return {
                      y: -75,
                      x: 0,
                      opacity: 0,
                      scale: 0.92,
                      rotateX: 10,
                      rotate: 0,
                      filter: 'blur(3px)'
                    };
                  }
                  return {
                    x: dir === 'right' ? 55 : -55,
                    y: 0,
                    opacity: 0,
                    scale: 0.94,
                    rotateX: 0,
                    rotate: dir === 'right' ? 1.5 : -1.5,
                    filter: 'blur(3px)'
                  };
                },
                animate: {
                  x: 0,
                  y: 0,
                  opacity: 1,
                  scale: 1,
                  rotateX: 0,
                  rotate: 0,
                  filter: 'blur(0px)',
                  transition: {
                    x: { type: 'spring', stiffness: 300, damping: 26, mass: 0.8 },
                    y: { type: 'spring', stiffness: 280, damping: 24, mass: 0.85 },
                    opacity: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                    scale: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
                    rotateX: { duration: 0.36, ease: [0.16, 1, 0.3, 1] },
                    rotate: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                    filter: { duration: 0.25 }
                  }
                },
                exit: (dir: 'up' | 'down' | 'left' | 'right') => {
                  if (dir === 'up') {
                    return {
                      y: -75,
                      x: 0,
                      opacity: 0,
                      scale: 0.92,
                      rotateX: 10,
                      rotate: 0,
                      filter: 'blur(3px)',
                      transition: {
                        y: { duration: 0.28, ease: [0.32, 0, 0.67, 0] },
                        opacity: { duration: 0.2 },
                        scale: { duration: 0.25 },
                        rotateX: { duration: 0.25 },
                        filter: { duration: 0.18 }
                      }
                    };
                  }
                  if (dir === 'down') {
                    return {
                      y: 75,
                      x: 0,
                      opacity: 0,
                      scale: 0.92,
                      rotateX: -10,
                      rotate: 0,
                      filter: 'blur(3px)',
                      transition: {
                        y: { duration: 0.28, ease: [0.32, 0, 0.67, 0] },
                        opacity: { duration: 0.2 },
                        scale: { duration: 0.25 },
                        rotateX: { duration: 0.25 },
                        filter: { duration: 0.18 }
                      }
                    };
                  }
                  return {
                    x: dir === 'right' ? -55 : 55,
                    y: 0,
                    opacity: 0,
                    scale: 0.94,
                    rotateX: 0,
                    rotate: dir === 'right' ? -1.5 : 1.5,
                    filter: 'blur(3px)',
                    transition: {
                      x: { duration: 0.25, ease: [0.32, 0, 0.67, 0] },
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.25 },
                      rotate: { duration: 0.25 },
                      filter: { duration: 0.18 }
                    }
                  };
                }
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              id="gallery-polaroid-frame"
              onPointerDown={handleCardPointerDown}
              onClick={handleCardClick}
              className="relative w-[min(264px,68vw,35dvh)] p-[11px] pb-[38px] sm:p-[12px] sm:pb-[42px] rounded-[4px] bg-white dark:bg-[#1E242C] shadow-[0_20px_45px_-10px_rgba(0,0,0,0.18),0_6px_18px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_55px_-12px_rgba(0,0,0,0.8)] select-none border border-stone-100/90 dark:border-white/5 cursor-pointer active:scale-[0.99] transition-transform"
            >
              {/* Inner Matting Layer with Gaussian Blur Bleed from Cover */}
              <div
                className="relative w-full aspect-[4/4.5] rounded-[2px] flex items-center justify-center overflow-hidden p-3.5 sm:p-4 transition-colors duration-700"
                style={{
                  backgroundColor: isDark ? colorTheme.mattingBgDark : colorTheme.mattingBg
                }}
              >
                {/* Blur Bleed Extension Layer */}
                <img
                  src={currentSong.albumArtUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover scale-125 pointer-events-none transition-all duration-1000"
                  style={{
                    filter: 'blur(20px) saturate(1.3) brightness(1.05)',
                    opacity: 0.55
                  }}
                />

                {/* Upper 1:1 Album Artwork Tile with Soft Natural Shadow */}
                <div
                  className={`relative w-full aspect-square rounded-[2px] overflow-hidden bg-stone-900 shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-700 ${
                    isPlaying ? 'scale-[1.018]' : 'scale-100'
                  }`}
                >
                  <img
                    src={currentSong.albumArtUrl}
                    alt={currentSong.title}
                    className="w-full h-full object-cover block"
                  />
                </div>
              </div>

              {/* Bottom Subtle Photo Margin Metadata & Vocab Radar */}
              <div className="absolute bottom-3 left-0 right-0 px-4 flex items-center justify-between text-[10px] tracking-wider text-stone-400 dark:text-stone-500 font-mono">
                <span className="tabular-nums font-mono text-[10px] text-stone-400 dark:text-stone-500 font-medium">
                  {realTimeStr}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVocabRadarOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2 py-0.5 -mr-1 rounded-full bg-stone-100/90 dark:bg-stone-800/90 hover:bg-[#516050]/15 dark:hover:bg-[#8FB996]/20 border border-stone-200/80 dark:border-stone-700/80 text-stone-600 dark:text-stone-300 hover:text-[#516050] dark:hover:text-[#8FB996] active:scale-95 transition-all cursor-pointer group shadow-2xs"
                  title="查看本曲核心生词雷达"
                >
                  <span className="text-[#516050] dark:text-[#8FB996] group-hover:scale-125 transition-transform text-[10px] leading-none">✦</span>
                  <span className="tracking-wider text-[9px] font-sans font-semibold uppercase">
                    {songVocabList.length} WORDS
                  </span>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3. Highlight Golden Quote with smooth animated transition */}
        <div className="w-full max-w-[320px] text-center px-2 min-h-[30px] flex items-center justify-center">
          <AnimatePresence mode="wait" custom={songTransitionDirection}>
            <motion.p
              key={currentSong.id + '-quote'}
              custom={songTransitionDirection}
              variants={{
                initial: (dir: 'up' | 'down' | 'left' | 'right') => {
                  if (dir === 'up') return { opacity: 0, y: 12, x: 0 };
                  if (dir === 'down') return { opacity: 0, y: -12, x: 0 };
                  return { opacity: 0, y: 0, x: dir === 'right' ? 10 : -10 };
                },
                animate: { opacity: 1, y: 0, x: 0 },
                exit: (dir: 'up' | 'down' | 'left' | 'right') => {
                  if (dir === 'up') return { opacity: 0, y: -12, x: 0 };
                  if (dir === 'down') return { opacity: 0, y: 12, x: 0 };
                  return { opacity: 0, y: 0, x: dir === 'right' ? -10 : 10 };
                }
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif-luxury italic text-[17px] sm:text-[18px] text-stone-800 dark:text-stone-200 leading-relaxed font-normal"
            >
              {curQuote.quotePrefix}
              <span
                onClick={() => handleWordClick(curQuote.targetWord, curQuote.fullSentence)}
                className="vocab-target font-normal italic text-stone-900 dark:text-white underline decoration-amber-600/60 dark:decoration-amber-400/70 underline-offset-4 decoration-2 cursor-pointer hover:bg-amber-100/40 dark:hover:bg-amber-950/30 px-1 py-0.5 rounded transition-all"
                title={`Click '${curQuote.targetWord}' to view Cambridge phonetics & dual context`}
              >
                {curQuote.targetWord}
              </span>
              {curQuote.quoteSuffix}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* 4. Bottom Playback Controls Bar with timeline */}
      <div className="relative w-full max-w-[356px] mx-auto px-6 z-20 pb-2 shrink-0">
        {/* Custom Rounded Dual-Layer Timeline Slider */}
        <div className="w-full mb-3">
          <div className="relative h-5 flex items-center group cursor-pointer">
            {/* Invisible accessible native range input for seamless click & drag scrubbing */}
            <input
              id="music-seekbar"
              type="range"
              min={0}
              max={duration || 168}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Seek audio timeline"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0"
            />

            {/* Visual Rounded Track + Dynamic Morandi Fill + Tactile Thumb Dot */}
            <div className="w-full h-[3.5px] group-hover:h-[4.5px] rounded-full bg-stone-300/75 dark:bg-stone-700/75 relative flex items-center transition-all duration-200 pointer-events-none">
              <div
                className="h-full rounded-full transition-[width] duration-75"
                style={{
                  width: `${Math.min(100, Math.max(0, (currentTime / (duration || 168)) * 100))}%`,
                  backgroundColor: isDark ? colorTheme.accentBtnDark : colorTheme.accentBtn
                }}
              />
              <div
                className="w-2.5 h-2.5 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.22)] -ml-[5px] transition-transform duration-150 group-hover:scale-125 group-active:scale-135 shrink-0"
                style={{
                  backgroundColor: isDark ? colorTheme.accentBtnDark : colorTheme.accentBtn
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono tabular-nums tracking-wider text-stone-400 dark:text-stone-500 mt-0.5 font-medium">
            <span>{formatTime(currentTime)}</span>
            
            {/* Minimalist Audio Quality Text Switcher */}
            <button
              id="music-quality-switcher-btn"
              type="button"
              onClick={() => setIsQualityModalOpen(true)}
              className="text-[10px] font-mono font-medium text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors cursor-pointer select-none tracking-wide"
              title="切换播放音质规格"
            >
              {AUDIO_QUALITY_OPTIONS.find(o => o.key === audioQuality)?.badge || '320K'}
            </button>

            <span>{formatTime(duration || 168)}</span>
          </div>
        </div>

        {/* Playback Button Row (Loop, Previous, Play/Pause, Next, Playlist) */}
        <div className="flex items-center justify-between px-2 pt-1">
          {/* Playback Mode Toggle: List Loop, Single Track Repeat, Shuffle */}
          <button
            id="music-play-mode-btn"
            onClick={togglePlayMode}
            className="p-2.5 active:scale-90 transition-all text-[#262E25] dark:text-[#7EA783] hover:opacity-80"
            aria-label={`Play mode: ${playMode}`}
            title={
              playMode === 'list'
                ? 'List loop (Click to switch to Single Repeat)'
                : playMode === 'single'
                ? 'Single repeat (Click to switch to Shuffle)'
                : 'Shuffle playback (Click to switch to List Loop)'
            }
          >
            {playMode === 'list' && <Repeat className="w-4 h-4" />}
            {playMode === 'single' && <Repeat1 className="w-4 h-4 stroke-[2.5]" />}
            {playMode === 'shuffle' && <Shuffle className="w-4 h-4" />}
          </button>

          {/* Previous Song */}
          <button
            id="music-prev-btn"
            onClick={handlePrev}
            className="p-2.5 text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white active:scale-90 transition-transform"
            aria-label="Previous track"
            title="Previous track"
          >
            <SkipBack className="w-5 h-5 fill-stone-700 dark:fill-stone-300 stroke-stone-700 dark:stroke-stone-300" />
          </button>

          {/* Centered Large Circular Play/Pause Button */}
          <button
            id="music-play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              backgroundColor: isDark ? colorTheme.accentBtnDark : colorTheme.accentBtn
            }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)] active:scale-95 transition-all duration-500 hover:brightness-110"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>

          {/* Next Song */}
          <button
            id="music-next-btn"
            onClick={handleNext}
            className="p-2.5 text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white active:scale-90 transition-transform"
            aria-label="Next track"
            title="Next track"
          >
            <SkipForward className="w-5 h-5 fill-stone-700 dark:fill-stone-300 stroke-stone-700 dark:stroke-stone-300" />
          </button>

          {/* Playlist Selector Button */}
          <button
            id="music-playlist-btn"
            onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
            className={`p-2.5 active:scale-90 transition-all ${
              isPlaylistOpen
                ? 'text-[#262E25] dark:text-[#7EA783]'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
            aria-label="Open playlist"
            title="Playlist"
          >
            <ListMusic className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Fullscreen Flowing Lyrics Space (Smooth 3D Flip / Scale-in Transition) */}
      <AnimatePresence>
        {isFullscreenLyricsOpen && (
          <FullscreenLyricsView
            parsedLyrics={parsedLyrics}
            activeLyricIndex={activeLyricIndex}
            onClose={() => setIsFullscreenLyricsOpen(false)}
            onSeek={(timeSec) => {
              if (audioRef.current) {
                audioRef.current.currentTime = timeSec;
              }
              setCurrentTime(timeSec);
            }}
            albumArtUrl={currentSong?.albumArtUrl || ''}
            palette={currentSong?.palette || ['#7C8F6E', '#C4AC82', '#A69880']}
          />
        )}
      </AnimatePresence>

      {/* 5. IELTS Vocab Radar Capsule Drawer */}
      <AnimatePresence>
        {isVocabRadarOpen && (
          <div
            id="vocab-radar-modal"
            data-no-swipe="true"
            data-no-gesture="true"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-auto"
          >
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setIsVocabRadarOpen(false)}
              className="absolute inset-0 bg-black/45 dark:bg-black/70 backdrop-blur-sm"
            />

            {/* Bottom Drawer Sheet */}
            <motion.div
              id="vocab-radar-sheet"
              data-no-swipe="true"
              data-no-gesture="true"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 34, stiffness: 185, mass: 1.05 }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="relative w-full max-h-[85%] overflow-y-auto no-scrollbar rounded-t-[32px] bg-[#FAF7F2] dark:bg-[#121826] border-t border-stone-200/90 dark:border-stone-800 shadow-2xl p-5 pb-7 z-10 text-stone-900 dark:text-stone-100"
            >
              {/* Drag Pill Handle */}
              <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-600 mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/80 dark:border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#516050]/15 dark:bg-[#8FB996]/20 flex items-center justify-center text-[#516050] dark:text-[#8FB996]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif-luxury text-base font-semibold text-stone-900 dark:text-stone-50">
                        Vocab Radar
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#516050] text-white dark:bg-[#8FB996] dark:text-stone-950 font-bold tracking-wider">
                        {songVocabList.length} WORDS
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5 font-sans">
                      Track: <span className="font-serif-luxury font-medium text-stone-700 dark:text-stone-300">{currentSong.title}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVocabRadarOpen(false)}
                  className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                  aria-label="Close vocab radar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Word List - Styled exactly like Notebook Modal Word Card */}
              <div className="space-y-2.5 mt-3.5 max-h-[380px] overflow-y-auto no-scrollbar">
                {songVocabList.length === 0 ? (
                  <div className="py-10 text-center text-stone-400 dark:text-stone-500 text-xs space-y-1">
                    <p className="font-medium text-stone-600 dark:text-stone-300">当前歌曲暂未检测到学术生词</p>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500">点击全屏歌词中的任意英文单词，即可即时查词并加入生词本</p>
                  </div>
                ) : (
                  songVocabList.map((item) => {
                    const mastery = (item.masteryLevel ?? (item.isStarred ? 1 : 0)) as MasteryLevel;

                  return (
                    <div
                      key={item.id || item.word}
                      onClick={() => {
                        setIsVocabRadarOpen(false);
                        openWordDetail(item);
                      }}
                      className="relative p-3.5 sm:p-4 rounded-2xl transition-all duration-200 cursor-pointer select-none flex items-center justify-between gap-3 bg-white dark:bg-[#151D2E] border border-stone-200/80 dark:border-slate-800/90 hover:border-stone-300 dark:hover:border-slate-700 shadow-2xs active:scale-[0.99]"
                    >
                      {/* Card Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif-luxury text-lg sm:text-[19px] font-medium text-stone-900 dark:text-stone-100 capitalize truncate">
                            {item.word}
                          </h4>
                          <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
                            {item.phoneticUk || item.phoneticUs || `/${item.word}/`}
                          </span>
                        </div>

                        {/* Part of Speech Tag & Notebook match tag */}
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300 uppercase font-mono">
                            {item.partOfSpeech || 'VOCAB'}
                          </span>
                          {dbWords.some(w => w.word.toLowerCase() === item.word.toLowerCase()) && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-amber-500/15 text-amber-800 dark:text-amber-300 flex items-center gap-0.5 border border-amber-500/25">
                              <span>★</span> 单词本重点生词
                            </span>
                          )}
                        </div>

                        {/* Chinese Definition */}
                        <p className="text-xs text-stone-700 dark:text-stone-300 mt-1 font-normal line-clamp-1">
                          {item.definitionCn || item.definition}
                        </p>

                        {/* Context & Tag Badges */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {item.sourceContext && (
                            <span className="text-[9px] uppercase tracking-wider text-stone-400 dark:text-stone-500 bg-stone-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                              {item.sourceContext}
                            </span>
                          )}
                          {item.categories && item.categories.length > 0 ? (
                            item.categories.slice(0, 2).map((cat) => (
                              <span
                                key={cat}
                                className="text-[9px] font-medium text-[#516050] dark:text-[#8FB996] bg-[#516050]/10 dark:bg-[#8FB996]/15 px-2 py-0.5 rounded-md"
                              >
                                {cat}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] font-medium text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              Track: {currentSong.title}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Right Action Strip (Audio Pronounce + 4-Tier Mastery Indicator) */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Audio Pronunciation Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord(item.word, 'en-GB');
                          }}
                          className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400 hover:text-[#516050] dark:hover:text-[#8FB996] active:scale-95 transition-all cursor-pointer"
                          title="朗读发音 (UK)"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {/* 3-State Scenario-Driven Mastery Ring Indicator */}
                        <div className="relative flex items-center justify-center p-1">
                          <MasteryBadge
                            level={mastery}
                            size={28}
                            interactive={true}
                            onClick={async (e) => {
                              e?.stopPropagation();
                              const current = (item.masteryLevel ?? 0) as number;
                              const next: MasteryLevel = ((current + 1) % 3) as MasteryLevel;
                              const existing = await db.words.where('word').equalsIgnoreCase(item.word.trim()).first();
                              if (existing && existing.id) {
                                await db.words.update(existing.id, { masteryLevel: next });
                              } else {
                                await collectWord({
                                  ...item,
                                  masteryLevel: next,
                                  isStarred: next > 0
                                });
                              }
                              showToast(`「${item.word}」状态：${MASTERY_CONFIG[next].label}`);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Audio Quality Selection Modal Sheet */}
      <AnimatePresence>
        {isQualityModalOpen && (
          <div
            data-no-swipe="true"
            data-no-gesture="true"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-auto overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 bg-stone-950/45 dark:bg-black/75 backdrop-blur-xs"
              onClick={() => setIsQualityModalOpen(false)}
            />

            <motion.div
              id="audio-quality-sheet"
              data-no-swipe="true"
              data-no-gesture="true"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 34, stiffness: 185, mass: 1.05 }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="relative w-full rounded-t-3xl bg-white dark:bg-[#1C1C1E] border-t border-stone-200/80 dark:border-white/10 shadow-2xl p-5 pb-8 z-10"
            >
              {/* Drag Handle */}
              <div className="w-9 h-1 rounded-full bg-stone-300 dark:bg-stone-600 mx-auto mb-3.5" />

              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <h4 className="text-base font-bold text-stone-900 dark:text-white">
                    播放音质与规格
                  </h4>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                    网易云流媒体 · 自由选择音频格式
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQualityModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* iOS Inset Grouped Options */}
              <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/50 divide-y divide-stone-100 dark:divide-stone-700/50 overflow-hidden">
                {AUDIO_QUALITY_OPTIONS.map((opt) => {
                  const isSelected = audioQuality === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setAudioQuality(opt.key);
                        setIsQualityModalOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left transition-colors flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-stone-100/80 dark:hover:bg-stone-700/60"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-11 h-6 flex items-center justify-center rounded-md font-mono text-[10px] font-bold uppercase tracking-tight ${
                          opt.vipOnly
                            ? 'bg-amber-500 text-white'
                            : isSelected
                              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                              : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                        }`}>
                          {opt.badge}
                        </span>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900 dark:text-white">
                              {opt.label}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400">
                              {opt.bitrate}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                            {opt.desc}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <span className="text-[11px] font-bold leading-none">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


