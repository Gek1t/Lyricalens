import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../../store/useAppStore';
import { parseLRC, findActiveLyricIndex } from '../../utils/lrcParser';
import { extractDominantPalette, applyAmbientGlowColors, withColorAlpha } from '../../utils/colorExtractor';
import { getDisplayRefreshRateState, triggerHighRefreshBoost } from '../../utils/displayRefreshRate';
import { ambientSynth, speakWord } from '../../utils/audioEngine';
import { db, collectWord, cycleWordMastery } from '../../db';
import { SEED_WORDS } from '../../db/seedData';
import { WordItem, SongItem, MasteryLevel, AudioQuality, AUDIO_QUALITY_OPTIONS } from '../../types';
import { analyzeSongVocab } from '../../utils/vocabEngine';
import { lookupLyricTerm, formatPartOfSpeech, lookupLocalWordSync } from '../../utils/lyricDictionary';
import { lookupInIeltsCorpus, estimateIpaPhonetics } from '../../utils/ieltsCorpusDictionary';
import { resolveSongAudioClient, fetchSongLyricsClient, SupportedMusicPlatform } from '../../utils/clientMusicSync';
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
  Volume2,
  Check,
  ChevronRight,
  X
} from 'lucide-react';

export type PlayMode = 'list' | 'single' | 'shuffle';

const EMPTY_DB_WORDS: WordItem[] = [];
const SEED_WORD_MAP = new Map<string, Omit<WordItem, 'id'>>(
  SEED_WORDS.map(w => [w.word.toLowerCase(), w])
);

interface MusicPlayerPanelProps {
  onOpenNotebook: () => void;
}

export const MusicPlayerPanel: React.FC<MusicPlayerPanelProps> = ({ onOpenNotebook }) => {
  const activeSpace = useAppStore(s => s.activeSpace);
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
      const nextStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      setRealTimeStr(prev => (prev === nextStr ? prev : nextStr));
    };
    const timer = setInterval(updateTime, 15000);
    return () => clearInterval(timer);
  }, []);

  // Live query database words to enrich radar data
  const dbWords = useLiveQuery(() => db.words.toArray(), []) ?? EMPTY_DB_WORDS;
  const dbWordMap = useMemo(() => {
    const map = new Map<string, WordItem>();
    for (const w of dbWords) {
      if (w.word) map.set(w.word.toLowerCase(), w);
    }
    return map;
  }, [dbWords]);

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

  // Defer heavy vocabulary regex scanning by 260ms on song switch so Frame 0 of vertical/button swipe is 100% jank-free
  const [deferredVocabSong, setDeferredVocabSong] = useState<SongItem>(currentSong);
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDeferredVocabSong(currentSong);
    }, 260);
    return () => window.clearTimeout(t);
  }, [currentSong]);

  // Resolved list of genuine vocabulary words for this song (Notebook words prioritized first)
  const songVocabList: WordItem[] = useMemo(() => {
    if (!deferredVocabSong) return [];
    const analysis = analyzeSongVocab(deferredVocabSong, dbWords);
    const keyVocabs = analysis.allKeyVocab.length > 0 ? analysis.allKeyVocab : (deferredVocabSong.keyVocab || []);
    
    return keyVocabs.map((vocabStr) => {
      const lowerVocab = vocabStr.toLowerCase();
      const matchDb = dbWordMap.get(lowerVocab);
      if (matchDb) return matchDb;
      const matchSeed = SEED_WORD_MAP.get(lowerVocab);
      if (matchSeed) {
        return {
          ...matchSeed,
        } as WordItem;
      }
      const localHit = lookupLocalWordSync(lowerVocab) || lookupInIeltsCorpus(lowerVocab);
      if (localHit) {
        return {
          word: vocabStr,
          phoneticUk: localHit.uk || estimateIpaPhonetics(vocabStr).uk,
          phoneticUs: localHit.us || estimateIpaPhonetics(vocabStr).us,
          partOfSpeech: formatPartOfSpeech(localHit.pos, vocabStr),
          definition: localHit.en || `Key vocabulary in "${deferredVocabSong.title}".`,
          definitionCn: localHit.cn,
          examples: [{
            en: `Featured in the song "${deferredVocabSong.title}"`,
            cn: `收录于《${deferredVocabSong.title}》`
          }],
          sourceContext: `Song: ${deferredVocabSong.title}`,
          isStarred: false,
          addedTimestamp: Date.now()
        } as WordItem;
      }
      const ph = estimateIpaPhonetics(vocabStr);
      return {
        word: vocabStr,
        phoneticUk: ph.uk,
        phoneticUs: ph.us,
        partOfSpeech: formatPartOfSpeech(undefined, vocabStr),
        definition: `Key vocabulary in "${deferredVocabSong.title}".`,
        definitionCn: `${vocabStr}`,
        examples: [{
          en: `Featured in the song "${deferredVocabSong.title}"`,
          cn: `收录于本曲核心意境`
        }],
        sourceContext: `Song: ${deferredVocabSong.title}`,
        isStarred: false,
        addedTimestamp: Date.now()
      } as WordItem;
    });
  }, [deferredVocabSong, dbWords, dbWordMap]);

  const [colorTheme, setColorTheme] = useState<{
    mattingBg: string;
    mattingBgDark: string;
    accentBtn: string;
    accentBtnDark: string;
  }>({
    mattingBg: 'hsl(110, 10%, 92%)',
    mattingBgDark: 'hsl(110, 12%, 14%)',
    accentBtn: 'hsl(145, 38%, 42%)',
    accentBtnDark: 'hsl(145, 44%, 50%)'
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
      triggerHighRefreshBoost(1200);
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
      showToast('随机播放');
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
    triggerHighRefreshBoost(1000);

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
    triggerHighRefreshBoost(1000);

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
    const normalizeMeta = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
    const normTitle = normalizeMeta(currentSong?.title || '');
    const normArtist = normalizeMeta(currentSong?.artist || '');

    const isMetadataLine = (raw: string): boolean => {
      const cleaned = raw.replace(/^\[.*?\]/, '').trim();
      if (!cleaned) return true;
      if (/^(作词|作曲|编曲|演唱|制作|混音|和声|词|曲)\s*[:：]/.test(cleaned)) return true;
      const norm = normalizeMeta(cleaned);
      if (!norm) return true;
      if (normTitle && norm === normTitle) return true;
      if (normTitle && normArtist && (norm === `${normTitle}${normArtist}` || norm === `${normArtist}${normTitle}`)) {
        return true;
      }
      return false;
    };

    // Prefer active lyric line; if it is merely a title/artist header line, preview the first real lyric line instead
    let candidateLine = activeLyricLine;
    if (candidateLine && isMetadataLine(candidateLine.rawText || '') && parsedLyrics.length > 1) {
      const firstRealLine = parsedLyrics.find(line => !isMetadataLine(line.rawText || ''));
      if (firstRealLine) {
        candidateLine = firstRealLine;
      }
    }

    if (candidateLine && candidateLine.rawText) {
      const text = candidateLine.rawText.replace(/^\[.*?\]/, '').trim();
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
            translation: candidateLine?.translation || ''
          };
        }

        // If no predefined vocab matched, pick the longest meaningful word
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
            translation: candidateLine?.translation || ''
          };
        }

        return {
          quotePrefix: `“${text}`,
          targetWord: '',
          quoteSuffix: '”',
          fullSentence: text,
          translation: candidateLine?.translation || ''
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
  }, [activeLyricLine, parsedLyrics, currentSong]);

  // Extract dynamic album palette and Morandi/contrast tones on song switch
  // Deferred until after the 300ms card entry spring settles so main-thread canvas readback never competes with swipe frames
  useEffect(() => {
    if (!currentSong?.albumArtUrl) return;
    let isCancelled = false;

    const timer = window.setTimeout(() => {
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
    }, 320);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentSong, setAmbientColors]);

  // On-demand lyric and translation fetcher if missing or default placeholder
  useEffect(() => {
    if (!currentSong) return;
    const isDefaultLrc =
      !currentSong.lrcText ||
      currentSong.lrcText.includes('Listening to the melodic rhythm') ||
      currentSong.lrcText.includes('LyricaLens Academic Immersion') ||
      currentSong.lrcText.includes('原声同步') ||
      currentSong.lrcText.includes('音源同步');
    if (isDefaultLrc || !currentSong.tlyricText) {
      let isCancelled = false;
      const fetchLyric = async () => {
        try {
          let lrcData = await fetchSongLyricsClient(currentSong.id, currentSong.title, currentSong.artist);
          if (!lrcData && !Capacitor.isNativePlatform()) {
            const cleanId = currentSong.id.replace(/^ncm-/, '');
            const res = await fetch(`/api/music/song-lyric?id=${cleanId}&title=${encodeURIComponent(currentSong.title)}&artist=${encodeURIComponent(currentSong.artist)}`);
            if (res.ok) {
              lrcData = await res.json();
            }
          }
          if (!isCancelled && lrcData && (lrcData.lrc || lrcData.tlyric)) {
            const updatedSongs = songs.map((s, idx) => {
              if (idx === currentSongIndex) {
                return {
                  ...s,
                  lrcText: (lrcData!.lrc && lrcData!.lrc.includes('[')) ? lrcData!.lrc : s.lrcText,
                  tlyricText: lrcData!.tlyric || s.tlyricText
                };
              }
              return s;
            });
            setSongs(updatedSongs);
            if (currentSong.id) {
              await db.songs.put(updatedSongs[currentSongIndex]);
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
  const [vipResolvedUrl, setVipResolvedUrl] = useState<string>('');

  // Proactively resolve full VIP / non-trial stream on song or quality change
  useEffect(() => {
    setFallbackStreamUrl('');
    setVipResolvedUrl('');
    if (!currentSong) return;
    const rawId = currentSong.id || '';
    if (!rawId || rawId.startsWith('local-') || rawId.startsWith('song-')) return;

    let songPlatform: SupportedMusicPlatform = 'netease';
    if (rawId.startsWith('qq-')) songPlatform = 'qq';
    else if (rawId.startsWith('kugou-')) songPlatform = 'kugou';
    else if (rawId.startsWith('kuwo-')) songPlatform = 'kuwo';
    else if (rawId.startsWith('migu-')) songPlatform = 'migu';
    else if (rawId.startsWith('spotify-')) songPlatform = 'spotify';

    let cancelled = false;
    const platformCookie = typeof window !== 'undefined'
      ? (localStorage.getItem(`lyricalens_${songPlatform}_cookie`) || (songPlatform === 'netease' ? localStorage.getItem('lyricalens_ncm_cookie') : '') || '')
      : '';

    resolveSongAudioClient(
      rawId,
      songPlatform,
      platformCookie,
      audioQuality || 'exhigh',
      currentSong.title,
      currentSong.artist,
      false
    ).then((url) => {
      if (!cancelled) {
        setVipResolvedUrl(url || currentSong.audioUrl || '');
      }
    }).catch(() => {
      if (!cancelled && currentSong.audioUrl) {
        setVipResolvedUrl(currentSong.audioUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentSong?.id, audioQuality]);

  const resolvedAudioSrc = useMemo(() => {
    if (!currentSong) return '';

    // If a fallback auto-heal stream or VIP full-track stream was resolved for this song, prioritize it
    if (fallbackStreamUrl) {
      return fallbackStreamUrl;
    }
    if (vipResolvedUrl) {
      return vipResolvedUrl;
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
    // Wait for vipResolvedUrl if audioUrl is an anonymous outer/url or meting placeholder
    if (isNative && currentSong.audioUrl && /^https?:\/\//i.test(currentSong.audioUrl)) {
      if (currentSong.audioUrl.includes('music.163.com/song/media/outer/url') || currentSong.audioUrl.includes('/meting/')) {
        return '';
      }
      return currentSong.audioUrl;
    }

    // 4. Default: Proxy through backend audio stream (in Web / Fullstack environment)
    if (currentSong.audioUrl && /^https?:\/\//i.test(currentSong.audioUrl) && !currentSong.id?.startsWith('ncm-')) {
      return currentSong.audioUrl;
    }
    
    return `/api/music/audio-stream?name=${encodeURIComponent(currentSong.title)}&artist=${encodeURIComponent(currentSong.artist)}&id=${encodeURIComponent(rawId)}&platform=${songPlatform}${cookieParam}&level=${encodeURIComponent(targetLevel)}`;
  }, [currentSong, audioQuality, fallbackStreamUrl, vipResolvedUrl]);

  // Pre-decode adjacent song album covers in background so vertical swipe transitions have 0ms image decode latency
  useEffect(() => {
    if (!songs || songs.length <= 1) return;
    const nextIdx = (currentSongIndex + 1) % songs.length;
    const prevIdx = (currentSongIndex - 1 + songs.length) % songs.length;
    [songs[nextIdx]?.albumArtUrl, songs[prevIdx]?.albumArtUrl].forEach((url) => {
      if (url) {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
        if (typeof img.decode === 'function') {
          img.decode().catch(() => {});
        }
      }
    });
  }, [currentSongIndex, songs]);

  // Trigger smooth compositor entry transition when song changes via buttons/auto-advance (when not already driven by gesture engine)
  const lastAnimatedSongIdRef = useRef<string>(currentSong.id);
  const btnSwitchRafRef = useRef<number | null>(null);
  useEffect(() => {
    if (lastAnimatedSongIdRef.current === currentSong.id) return;
    lastAnimatedSongIdRef.current = currentSong.id;

    const wrapper = document.getElementById('gallery-card-drag-stage');
    const titleStage = document.getElementById('gallery-title-stage');
    const quoteStage = document.getElementById('gallery-quote-stage');
    if (!wrapper) return;

    // Only trigger if useGestureEngine didn't already set up the vertical entry transform on this frame
    if (songTransitionDirection === 'left' || songTransitionDirection === 'right') {
      triggerHighRefreshBoost(1000);
      if (btnSwitchRafRef.current !== null) {
        cancelAnimationFrame(btnSwitchRafRef.current);
        btnSwitchRafRef.current = null;
      }

      const { fps } = getDisplayRefreshRateState();
      const settleMs = fps >= 120 ? 310 : fps >= 90 ? 325 : 340;
      const entryX = songTransitionDirection === 'right' ? 48 : -48;
      const textEntryX = songTransitionDirection === 'right' ? 18 : -18;

      wrapper.getAnimations?.().forEach(a => a.cancel());
      wrapper.style.transition = 'none';
      (wrapper.style as any).webkitTransition = 'none';
      wrapper.style.transform = 'translate3d(0, 0, 0) scale(1)';
      (wrapper.style as any).webkitTransform = 'translate3d(0, 0, 0) scale(1)';
      if (typeof wrapper.animate === 'function') {
        wrapper.animate(
          [
            { transform: `translate3d(${entryX}px, 0, 0) scale(0.94)` },
            { transform: 'translate3d(0, 0, 0) scale(1)' },
          ],
          {
            duration: settleMs,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }
        );
      }

      if (titleStage) {
        titleStage.getAnimations?.().forEach(a => a.cancel());
        titleStage.style.transition = 'none';
        titleStage.style.transform = 'translate3d(0, 0, 0)';
        titleStage.style.opacity = '1';
        if (typeof titleStage.animate === 'function') {
          titleStage.animate(
            [
              { transform: `translate3d(${textEntryX}px, 0, 0)`, opacity: 0 },
              { transform: 'translate3d(0, 0, 0)', opacity: 1 },
            ],
            {
              duration: settleMs,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }
          );
        }
      }
      if (quoteStage) {
        quoteStage.getAnimations?.().forEach(a => a.cancel());
        quoteStage.style.transition = 'none';
        quoteStage.style.transform = 'translate3d(0, 0, 0)';
        quoteStage.style.opacity = '1';
        if (typeof quoteStage.animate === 'function') {
          quoteStage.animate(
            [
              { transform: `translate3d(${textEntryX}px, 0, 0)`, opacity: 0 },
              { transform: 'translate3d(0, 0, 0)', opacity: 1 },
            ],
            {
              duration: settleMs,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }
          );
        }
      }
    }

    return () => {
      if (btnSwitchRafRef.current !== null) {
        cancelAnimationFrame(btnSwitchRafRef.current);
        btnSwitchRafRef.current = null;
      }
    };
  }, [currentSong.id, songTransitionDirection]);

  // Defer applying new audio src by 120ms on song switch so media decoder teardown never stalls frame 0 of the swipe animation
  const [deferredAudioSrc, setDeferredAudioSrc] = useState<string>(resolvedAudioSrc);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDeferredAudioSrc(resolvedAudioSrc);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [resolvedAudioSrc]);

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
  }, [isPlaying, deferredAudioSrc]);

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

  const lastDispatchedTimeRef = useRef<number>(0);
  const activeLyricIndexRef = useRef<number>(activeLyricIndex);
  activeLyricIndexRef.current = activeLyricIndex;

  useEffect(() => {
    // Pause high-frequency VSync lyric polling when paused or when user is in AR Space (0) or IELTS Space (2)
    if (!isPlaying || activeSpace !== 1) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Immediate state sync when entering Space 1 or resuming playback
    if (audioRef.current) {
      const syncTimeSec = audioRef.current.currentTime;
      currentTimeRef.current = syncTimeSec;
      if (!isFullscreenLyricsOpen) {
        lastDispatchedTimeRef.current = syncTimeSec;
        setCurrentTime(syncTimeSec);
      }
      const syncTimeMs = Math.max(0, (syncTimeSec + currentSongOffset) * 1000);
      const syncIdx = findActiveLyricIndex(parsedLyrics, syncTimeMs);
      if (syncIdx !== activeLyricIndexRef.current) {
        activeLyricIndexRef.current = syncIdx;
        setActiveLyricIndex(syncIdx);
      }
    }

    const updateLyricFrame = () => {
      const audio = audioRef.current;
      if (audio && isPlaying) {
        const curTimeSec = audio.currentTime;
        currentTimeRef.current = curTimeSec;

        // Skip bottom seekbar store updates while FullscreenLyricsView is open (seekbar is hidden)
        // Otherwise throttle global store time updates (~4Hz) to avoid 90/120Hz full React tree re-renders
        if (!isFullscreenLyricsOpen && (Math.abs(curTimeSec - lastDispatchedTimeRef.current) >= 0.24 || curTimeSec < 0.08)) {
          lastDispatchedTimeRef.current = curTimeSec;
          setCurrentTime(curTimeSec);
        }

        const curTimeMs = Math.max(0, (curTimeSec + currentSongOffset) * 1000);
        const newActiveIdx = findActiveLyricIndex(parsedLyrics, curTimeMs);

        if (newActiveIdx !== activeLyricIndexRef.current) {
          activeLyricIndexRef.current = newActiveIdx;
          setActiveLyricIndex(newActiveIdx);
        }
        animationFrameRef.current = requestAnimationFrame(updateLyricFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateLyricFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, activeSpace, isFullscreenLyricsOpen, parsedLyrics, currentSongOffset, setCurrentTime, setActiveLyricIndex]);

  // Re-calculate active index immediately if offset or parsedLyrics change even while paused
  useEffect(() => {
    const curTimeSec = audioRef.current ? audioRef.current.currentTime : currentTimeRef.current;
    const curTimeMs = Math.max(0, (curTimeSec + currentSongOffset) * 1000);
    const newActiveIdx = findActiveLyricIndex(parsedLyrics, curTimeMs);
    if (newActiveIdx !== activeLyricIndexRef.current) {
      activeLyricIndexRef.current = newActiveIdx;
      setActiveLyricIndex(newActiveIdx);
    }
  }, [currentSongOffset, parsedLyrics, setActiveLyricIndex]);

  const fallbackPalette = useMemo(() => ['#7C8F6E', '#C4AC82', '#A69880'], []);

  const handleCloseFullscreenLyrics = useCallback(() => {
    if (audioRef.current) {
      const nowSec = audioRef.current.currentTime;
      currentTimeRef.current = nowSec;
      lastDispatchedTimeRef.current = nowSec;
      setCurrentTime(nowSec);
    }
    setIsFullscreenLyricsOpen(false);
  }, [setCurrentTime, setIsFullscreenLyricsOpen]);

  const handleSeekFromLyrics = useCallback((timeSec: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeSec;
    }
    currentTimeRef.current = timeSec;
    lastDispatchedTimeRef.current = timeSec;
    setCurrentTime(timeSec);
  }, [setCurrentTime]);

  // Click target word: collect to Dexie + open Word Detail bottom sheet with dual contexts
  const handleWordClick = async (wordText: string, contextSentence: string) => {
    const cleanWord = wordText.replace(/^[^\w]+|[^\w]+$/g, '').toLowerCase();
    if (!cleanWord || cleanWord.length < 2) return;

    const wordData = await lookupLyricTerm(cleanWord, contextSentence || `From song: ${currentSong.title}`);
    const collected = await collectWord({
      ...wordData,
      isStarred: true,
      sourceContext: `Song: ${currentSong.title}`,
      categories: Array.from(new Set([...(wordData.categories || []), 'Song Lyric', 'Music Hub']))
    });

    openWordDetail(collected, null, 'drawer');
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
    const loadedDur = el.duration;
    // Detect 30-second trial preview clip (28s~35s) when actual song duration is > 60s, and auto-heal to full track
    if (loadedDur > 0 && loadedDur <= 35 && currentSong.duration > 60 && !fallbackStreamUrl) {
      setDuration(currentSong.duration);
      resolveSongAudioClient(
        currentSong.id || '',
        'netease',
        '',
        audioQuality || 'exhigh',
        currentSong.title,
        currentSong.artist,
        true
      ).then((fullUrl) => {
        if (fullUrl) setFallbackStreamUrl(fullUrl);
      }).catch(() => {});
    } else {
      setDuration(loadedDur || currentSong.duration);
    }
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
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-transparent select-none pb-[max(2.25rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]">
      {/* Hidden Audio Element */}
      <audio
        ref={(el) => {
          audioRef.current = el;
          if (el) el.volume = 0.2;
        }}
        src={deferredAudioSrc}
        loop={playMode === 'single'}
        onTimeUpdate={(e) => {
          currentTimeRef.current = e.currentTarget.currentTime;
        }}
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
            resolveSongAudioClient(
              rawId,
              platformServer === 'tencent' ? 'qq' : (platformServer as SupportedMusicPlatform),
              '',
              audioQuality || 'exhigh',
              currentSong.title,
              currentSong.artist,
              true
            ).then((fullUrl) => {
              if (fullUrl) {
                setFallbackStreamUrl(fullUrl);
              } else {
                setFallbackStreamUrl(`https://api.injahow.cn/meting/?type=url&id=${encodeURIComponent(cleanId)}&server=${platformServer}`);
              }
            }).catch(() => {
              setFallbackStreamUrl(`https://api.injahow.cn/meting/?type=url&id=${encodeURIComponent(cleanId)}&server=${platformServer}`);
            });
          }
        }}
        onEnded={handleSongEnded}
        preload="auto"
      />

      {/* Top Header: keyboard_arrow_down | NOW PLAYING | more_horiz */}
      {/* Smoothly fades out & disables pointer events when FullscreenLyricsView is open to prevent header overlap */}
      <div
        className={`relative z-40 w-full shrink-0 transition-[transform,opacity] duration-[440ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isFullscreenLyricsOpen ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100'
        }`}
      >
        <TopHeader
          centerLabel="NOW PLAYING"
          onOpenNotebook={onOpenNotebook}
        />
      </div>

      {/* Center Gallery Art Frame Area (Fluid Golden Ratio & Adaptive Vertical Rhythm across all mobile heights) */}
      <div
        className={`relative flex-1 min-h-0 flex flex-col items-center justify-center px-4 z-10 my-auto py-1 gap-y-2.5 sm:gap-y-4 overflow-hidden transition-[transform,opacity] duration-[440ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isFullscreenLyricsOpen ? 'opacity-0 scale-[0.95] pointer-events-none' : 'opacity-100 scale-100'
        }`}
      >
        {/* 1. Header Title Area (Directly above the frame) with 120fps Compositor Transform */}
        <div className="min-h-[44px] sm:min-h-[52px] shrink-0 flex items-center justify-center w-full px-3">
          <div
            id="gallery-title-stage"
            style={{
              transform: 'translate3d(0, 0, 0)',
              WebkitTransform: 'translate3d(0, 0, 0)',
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
            className="text-center select-none max-w-full overflow-hidden hardware-accelerated"
          >
            <p
              className="font-sans text-[11px] uppercase tracking-[0.3em] text-[#78716C] dark:text-stone-400 font-normal truncate"
            >
              {currentSong.artist ? currentSong.artist.toUpperCase() : 'ETHEREAL SOUNDS'}
            </p>
            <h1
              className="font-serif-luxury text-[21px] font-normal text-[#292524] dark:text-stone-100 tracking-[0.15em] uppercase mt-1 truncate"
            >
              {currentSong.title}
            </h1>
          </div>
        </div>

        {/* 2. Realistic Photo Mount Frame with Real-Time Finger Drag & Pure GPU Compositor Slide */}
        <div
          id="gallery-card-drag-stage"
          style={{
            transform: 'translate3d(0, 0, 0) scale(1)',
            WebkitTransform: 'translate3d(0, 0, 0) scale(1)',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
          className="relative flex items-center justify-center min-h-0 shrink w-full hardware-accelerated"
        >
          {/* Gentle, ethereal ambient backlight (Zero GPU Gaussian Blur Re-Convolution Cost) */}
          <div
            className={`absolute -inset-10 rounded-full transition-opacity duration-700 pointer-events-none ${
              isPlaying ? 'opacity-30 dark:opacity-25' : 'opacity-18 dark:opacity-12'
            }`}
            style={{
              background: `radial-gradient(circle, ${currentSong?.palette?.[0] || '#E8E4DC'} 0%, transparent 70%)`,
              transform: 'translate3d(0, 0, 0)'
            }}
          />

          <div
            id="gallery-polaroid-frame"
            onPointerDown={handleCardPointerDown}
            onClick={handleCardClick}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
            className="relative w-[min(264px,68vw,35dvh)] p-[11px] pb-[38px] sm:p-[12px] sm:pb-[42px] rounded-[4px] bg-white dark:bg-[#1E242C] shadow-[0_20px_45px_-10px_rgba(0,0,0,0.18),0_6px_18px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_55px_-12px_rgba(0,0,0,0.8)] select-none border border-stone-100/90 dark:border-white/5 cursor-pointer active:scale-[0.99] transition-transform hardware-accelerated"
          >
            {/* Inner Picture Frame Area — Full-Bleed Album Artwork */}
            <div
              className="relative w-full aspect-square rounded-[2px] flex items-center justify-center overflow-hidden transition-colors duration-500"
              style={{
                backgroundColor: isDark ? colorTheme.mattingBgDark : colorTheme.mattingBg,
                backgroundImage: `radial-gradient(circle at 22% 24%, ${withColorAlpha(currentSong?.palette?.[0] || '#7C8F6E', isDark ? 0.36 : 0.45)} 0%, transparent 72%), radial-gradient(circle at 78% 76%, ${withColorAlpha(currentSong?.palette?.[1] || '#C4AC82', isDark ? 0.32 : 0.42)} 0%, transparent 72%)`,
                contain: 'paint'
              }}
            >
              {/* 1:1 Album Artwork Tile with Soft Natural Shadow */}
              <div
                className={`relative w-full h-full rounded-[2px] overflow-hidden bg-stone-900 transition-transform duration-500 ${
                  isPlaying ? 'scale-[1.015]' : 'scale-100'
                }`}
                style={{
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden'
                }}
              >
                <img
                  src={currentSong.albumArtUrl}
                  alt={currentSong.title}
                  decoding="async"
                  className="w-full h-full object-cover block"
                />
                {/* Subtle Inner Frame Hairline */}
                <div className="pointer-events-none absolute inset-0 rounded-[2px] ring-1 ring-inset ring-black/[0.06] dark:ring-white/[0.08]" />
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
                className="flex items-center gap-1.5 py-0.5 -mr-0.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 active:scale-95 transition-all cursor-pointer group"
                title="查看本曲核心生词"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full transition-transform group-hover:scale-125"
                  style={{ backgroundColor: isDark ? colorTheme.accentBtnDark : colorTheme.accentBtn }}
                />
                <span className="tracking-[0.12em] text-[10px] font-sans font-semibold uppercase tabular-nums">
                  {songVocabList.length} WORDS
                </span>
                <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-90 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Highlight Golden Quote with 120fps Compositor Transform & Safe Line Clamp */}
        <div className="w-full max-w-[320px] text-center px-2 min-h-[30px] max-h-[54px] flex items-center justify-center overflow-hidden">
          <p
            id="gallery-quote-stage"
            style={{
              transform: 'translate3d(0, 0, 0)',
              WebkitTransform: 'translate3d(0, 0, 0)',
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
            className="font-serif-luxury italic text-[16px] sm:text-[17px] text-stone-800 dark:text-stone-200 leading-snug font-normal line-clamp-2 hardware-accelerated"
          >
            {curQuote.quotePrefix}
            {curQuote.targetWord && (
              <span
                onClick={() => handleWordClick(curQuote.targetWord, curQuote.fullSentence)}
                className="font-medium italic text-stone-900 dark:text-stone-50 cursor-pointer transition-opacity hover:opacity-70 no-underline"
                title={`点击查询 “${curQuote.targetWord}”`}
              >
                {curQuote.targetWord}
              </span>
            )}
            {curQuote.quoteSuffix}
          </p>
        </div>
      </div>

      {/* 4. Bottom Playback Controls Bar with timeline */}
      <div
        className={`relative w-full max-w-[356px] mx-auto px-6 z-20 pb-2 shrink-0 transition-[transform,opacity] duration-[440ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isFullscreenLyricsOpen ? 'opacity-0 translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
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
            className="p-2.5 active:scale-90 transition-all text-stone-800 dark:text-stone-200 hover:opacity-80"
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
              backgroundColor: isDark ? colorTheme.accentBtnDark : colorTheme.accentBtn,
              boxShadow: `0 10px 24px -4px ${withColorAlpha(isDark ? colorTheme.accentBtnDark : colorTheme.accentBtn, isDark ? 0.42 : 0.36)}`
            }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white active:scale-95 transition-[transform,filter,background-color,box-shadow] duration-300 hover:brightness-105 cursor-pointer"
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
                ? 'text-stone-900 dark:text-stone-100'
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
            onClose={handleCloseFullscreenLyrics}
            onSeek={handleSeekFromLyrics}
            albumArtUrl={currentSong?.albumArtUrl || ''}
            palette={currentSong?.palette || fallbackPalette}
            savedWords={dbWords}
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
            style={{ transform: 'translate3d(0, 0, 0)' }}
            className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-auto isolate"
          >
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setIsVocabRadarOpen(false)}
              className="absolute inset-0 bg-black/45 dark:bg-black/70"
            />

            {/* Bottom Drawer Sheet */}
            <motion.div
              id="vocab-radar-sheet"
              data-no-swipe="true"
              data-no-gesture="true"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 235, mass: 0.92 }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="relative isolate w-full max-h-[82%] flex flex-col overflow-hidden rounded-t-[32px] bg-[#FAF7F2] dark:bg-[#121826] border-t border-stone-200/90 dark:border-stone-800 shadow-2xl p-5 pb-7 z-10 text-stone-900 dark:text-stone-100"
            >
              {/* Drag Pill Handle */}
              <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-600 mx-auto mb-4 shrink-0" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/80 dark:border-stone-800 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-[15px] font-semibold text-stone-900 dark:text-stone-50 tracking-tight">
                      本曲核心词
                    </h4>
                    <span className="text-xs font-mono tabular-nums text-stone-400 dark:text-stone-500">
                      {songVocabList.length} 词
                    </span>
                  </div>
                  <p className="text-[11px] font-serif-luxury text-stone-500 dark:text-stone-400 truncate mt-0.5">
                    {currentSong.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVocabRadarOpen(false)}
                  className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer shrink-0"
                  aria-label="Close vocab radar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Word List — Clean editorial card hierarchy aligned with Vocabulary Vault */}
              <div className="flex-1 min-h-0 space-y-2.5 pt-3.5 overflow-y-auto no-scrollbar bg-[#FAF7F2] dark:bg-[#121826]">
                {songVocabList.length === 0 ? (
                  <div className="py-10 text-center text-stone-400 dark:text-stone-500 text-xs space-y-1">
                    <p className="font-medium text-stone-600 dark:text-stone-300">当前歌曲暂未检测到核心生词</p>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500">点击全屏歌词中的任意英文单词即可查词收录</p>
                  </div>
                ) : (
                  songVocabList.map((item) => {
                    const mastery = (item.masteryLevel ?? (item.isStarred ? 1 : 0)) as MasteryLevel;
                    const isCollected = dbWords.some(w => w.word.toLowerCase() === item.word.toLowerCase());
                    const shortPos = item.partOfSpeech
                      ? item.partOfSpeech.split(/\s+/)[0]
                      : 'vocab';

                  return (
                    <div
                      key={item.id || item.word}
                      onClick={() => {
                        setIsVocabRadarOpen(false);
                        openWordDetail(item);
                      }}
                      className="relative px-4 py-3.5 rounded-2xl transition-all duration-200 cursor-pointer select-none flex items-center justify-between gap-3 bg-white dark:bg-[#151D2E] border border-stone-200/75 dark:border-slate-800/90 hover:border-stone-300 dark:hover:border-slate-700 shadow-2xs active:scale-[0.99]"
                    >
                      {/* Card Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <h4 className="font-serif-luxury text-[18px] font-medium text-stone-900 dark:text-stone-100 capitalize shrink-0 max-w-[68%] truncate">
                            {item.word}
                          </h4>
                          <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500 truncate min-w-0">
                            {item.phoneticUk || item.phoneticUs || `/${item.word}/`}
                          </span>
                        </div>

                        {/* Chinese Definition */}
                        <p className="text-xs text-stone-700 dark:text-stone-300 mt-1 font-normal line-clamp-1">
                          {item.definitionCn || item.definition}
                        </p>

                        {/* Single Unboxed Inline Metadata Row */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 min-w-0">
                          <span className="font-mono italic text-stone-500 dark:text-stone-400 shrink-0">
                            {shortPos}
                          </span>
                          {isCollected && (
                            <>
                              <span aria-hidden="true" className="opacity-45 shrink-0">·</span>
                              <span className="font-medium text-amber-700/90 dark:text-amber-400/90 shrink-0">
                                已收录
                              </span>
                            </>
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
                          className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 active:scale-95 transition-all cursor-pointer"
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
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 bg-stone-950/45 dark:bg-black/75"
              onClick={() => setIsQualityModalOpen(false)}
            />

            <motion.div
              id="audio-quality-sheet"
              data-no-swipe="true"
              data-no-gesture="true"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 235, mass: 0.92 }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="relative w-full rounded-t-3xl bg-white dark:bg-[#1C1C1E] border-t border-stone-200/80 dark:border-white/10 shadow-2xl p-5 pb-8 z-10"
            >
              {/* Drag Handle */}
              <div className="w-9 h-1 rounded-full bg-stone-300 dark:bg-stone-600 mx-auto mb-3.5" />

              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100 dark:border-stone-800">
                <h4 className="text-[15px] font-semibold text-stone-900 dark:text-white tracking-tight">
                  播放音质
                </h4>
                <button
                  type="button"
                  onClick={() => setIsQualityModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                  aria-label="Close quality selector"
                >
                  <X className="w-4 h-4 stroke-[2.25]" />
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
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-11 h-6 flex items-center justify-center rounded-md font-mono text-[10px] font-semibold uppercase tracking-tight shrink-0 ${
                          isSelected
                            ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                            : opt.vipOnly
                              ? 'bg-amber-500/12 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 border border-amber-500/20'
                              : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                        }`}>
                          {opt.badge}
                        </span>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-stone-900 dark:text-white">
                              {opt.label}
                            </span>
                            <span className="text-[10px] font-mono tabular-nums text-stone-400">
                              {opt.bitrate}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">
                            {opt.desc}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#30D158] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[2.75]" />
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


