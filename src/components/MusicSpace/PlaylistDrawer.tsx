import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../db';
import {
  evaluateSongVocabDifficulty,
  analyzeSongVocab,
  getDueReviewWords,
  isChineseSong,
  prioritizeSongsByNotebookAndSpacedRepetition
} from '../../utils/vocabEngine';
import { VocabDifficultyTag, SongItem } from '../../types';
import { Sparkles, ArrowUpDown, Filter, RotateCcw, Volume2, Check } from 'lucide-react';

// Mastery status circle indicator matching the app design system (0: hollow, 1: needle-dot, 2: mid-dot, 3: solid)
const MasteryCircleIndicator: React.FC<{ level?: number; isDue?: boolean; size?: number }> = ({
  level = 0,
  isDue = false,
  size = 11,
}) => {
  if (isDue) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block shrink-0">
        <circle cx="12" cy="12" r="8.5" stroke="#D97706" strokeWidth="2.2" className="text-amber-500" />
        <circle cx="12" cy="12" r="3.8" fill="#D97706" className="fill-amber-500" />
      </svg>
    );
  }
  if (level === 3) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block shrink-0">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.2" className="text-[#516050] dark:text-[#8FB996]" />
        <circle cx="12" cy="12" r="5.8" fill="currentColor" className="text-[#516050] dark:text-[#8FB996]" />
      </svg>
    );
  }
  if (level === 2) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block shrink-0">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.2" className="text-[#8C7A5B] dark:text-amber-400" />
        <circle cx="12" cy="12" r="3.6" fill="currentColor" className="text-[#8C7A5B] dark:text-amber-400" />
      </svg>
    );
  }
  if (level === 1) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block shrink-0">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.2" className="text-[#516050] dark:text-[#8FB996]" />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" className="text-[#516050] dark:text-[#8FB996]" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block shrink-0">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.2" className="text-stone-400 dark:text-stone-500" />
    </svg>
  );
};

type PlaylistFilterType = 'ALL' | 'DUE_REVIEW' | 'NOTEBOOK' | 'CHINESE';

export const PlaylistDrawer: React.FC = () => {
  const isPlaylistOpen = useAppStore(s => s.isPlaylistOpen);
  const setIsPlaylistOpen = useAppStore(s => s.setIsPlaylistOpen);
  const songs = useAppStore(s => s.songs);
  const setSongs = useAppStore(s => s.setSongs);
  const currentSongIndex = useAppStore(s => s.currentSongIndex);
  const setCurrentSongIndex = useAppStore(s => s.setCurrentSongIndex);
  const setIsPlaying = useAppStore(s => s.setIsPlaying);
  const showToast = useAppStore(s => s.showToast);

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<PlaylistFilterType>('ALL');
  const playlistContainerRef = useRef<HTMLDivElement | null>(null);
  const activeSongItemRef = useRef<HTMLDivElement | null>(null);

  // Live Dexie query for user's vocabulary vault & due words
  const words = useLiveQuery(() => db.words.toArray(), []) || [];
  const dueWords = useMemo(() => getDueReviewWords(words), [words]);
  const dueWordStrs = useMemo(() => dueWords.map(w => w.word.toLowerCase()), [dueWords]);

  // Map of user's notebook words for instant lookup of mastery levels
  const notebookWordMap = useMemo(() => {
    const map = new Map<string, any>();
    words.forEach(w => {
      if (w.word) map.set(w.word.trim().toLowerCase(), w);
    });
    return map;
  }, [words]);

  // Evaluated songs with difficulties and due-word matches
  const analyzedSongs = useMemo(() => {
    return songs.map((song, originalIdx) => {
      const evalResult = evaluateSongVocabDifficulty(song, words, dueWordStrs);
      const analysis = analyzeSongVocab(song, words, dueWordStrs);
      const isChinese = isChineseSong(song) || evalResult.isChinese;

      const matchedList = analysis.matchedNotebookWords.map(wordStr => {
        const lower = wordStr.toLowerCase();
        const item = notebookWordMap.get(lower);
        const isDue = dueWordStrs.includes(lower);
        const masteryLevel = (item?.masteryLevel ?? (item?.isStarred ? 1 : 0)) as number;
        return {
          word: wordStr,
          masteryLevel,
          isDue,
        };
      });

      matchedList.sort((a, b) => {
        if (a.isDue && !b.isDue) return -1;
        if (!a.isDue && b.isDue) return 1;
        return 0;
      });

      return {
        song: {
          ...song,
          vocabLevel: evalResult.level,
          vocabStats: evalResult.stats
        },
        originalIdx,
        isChinese,
        level: evalResult.level,
        stats: evalResult.stats,
        matchedList,
        hasDueWords: (evalResult.stats.matchedDueCount || 0) > 0,
        hasNotebookWords: (evalResult.stats.matchedNotebookCount || 0) > 0
      };
    });
  }, [songs, words, dueWordStrs, notebookWordMap]);

  // Filtered song list
  const filteredList = useMemo(() => {
    return analyzedSongs.filter(item => {
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'DUE_REVIEW') return item.hasDueWords;
      if (activeFilter === 'NOTEBOOK') return item.hasNotebookWords;
      if (activeFilter === 'CHINESE') return item.isChinese;
      return true;
    });
  }, [analyzedSongs, activeFilter]);

  // Auto-scroll to currently playing track whenever drawer opens or active song changes
  const scrollToActiveSong = useCallback(() => {
    if (activeSongItemRef.current && playlistContainerRef.current) {
      const container = playlistContainerRef.current;
      const activeEl = activeSongItemRef.current;
      const targetScroll =
        activeEl.offsetTop - container.offsetTop - (container.clientHeight / 2 - activeEl.clientHeight / 2);

      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    if (isPlaylistOpen) {
      const timer = setTimeout(() => {
        scrollToActiveSong();
      }, 80);
      return () => clearTimeout(timer);
    } else {
      setIsExpanded(false);
    }
  }, [isPlaylistOpen, scrollToActiveSong]);

  useEffect(() => {
    if (isPlaylistOpen) {
      scrollToActiveSong();
    }
  }, [currentSongIndex, isPlaylistOpen, scrollToActiveSong]);

  const handleSelectSong = (originalIdx: number) => {
    const dir = originalIdx >= currentSongIndex ? 'right' : 'left';
    setCurrentSongIndex(originalIdx, dir);
    setIsPlaying(true);
    showToast(`播放: ${songs[originalIdx]?.title || ''}`);
  };

  // One-tap intelligent spaced repetition re-ranking
  const handleSmartSpacedSort = () => {
    const currentPlayingSong = songs[currentSongIndex];
    const reordered = prioritizeSongsByNotebookAndSpacedRepetition(songs, words);
    setSongs(reordered);
    if (currentPlayingSong) {
      const newIdx = reordered.findIndex(s => s.id === currentPlayingSong.id);
      if (newIdx !== -1) {
        setCurrentSongIndex(newIdx);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      {isPlaylistOpen && (
        <div
          id="playlist-modal-wrapper"
          data-no-swipe="true"
          data-no-gesture="true"
          className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-auto overflow-hidden"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Gaussian Blur Backdrop with Silky Fade */}
          <motion.div
            key="playlist-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 bg-stone-950/45 dark:bg-black/75 backdrop-blur-xs cursor-pointer"
            onClick={() => {
              setIsPlaylistOpen(false);
              setIsExpanded(false);
            }}
          />

          {/* Bottom Drawer Sheet */}
          <motion.div
            id="music-playlist-sheet"
            key="playlist-sheet"
            data-no-swipe="true"
            data-no-gesture="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.08, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -30 || info.velocity.y < -200) {
                setIsExpanded(true);
              } else if (info.offset.y > 50 || info.velocity.y > 220) {
                if (isExpanded) {
                  setIsExpanded(false);
                } else {
                  setIsPlaylistOpen(false);
                  setIsExpanded(false);
                }
              }
            }}
            transition={{
              type: 'spring',
              damping: 32,
              stiffness: 320,
              mass: 0.8
            }}
            style={{
              height: isExpanded ? '92%' : '72%',
              transition: 'height 280ms cubic-bezier(0.22, 1, 0.36, 1)',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="relative w-full flex flex-col rounded-t-[32px] sm:rounded-t-[36px] bg-[#FAF7F2] dark:bg-[#121826] border-t border-white/90 dark:border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.35)] px-5 pt-3 pb-8 z-10 overflow-hidden hardware-accelerated"
          >
            {/* Drag Pill Handle */}
            <div
              className="w-full flex flex-col items-center justify-center py-2.5 cursor-grab active:cursor-grabbing touch-none select-none group"
              onClick={() => setIsExpanded(prev => !prev)}
              title={isExpanded ? "下滑或点击收起为半屏" : "上滑或点击展开全屏 / 下滑收起"}
            >
              <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600/80 group-hover:bg-stone-400 dark:group-hover:bg-stone-500 transition-all duration-200" />
            </div>

            {/* Header & Smart Spaced Sort Action */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/70 dark:border-slate-800/80 shrink-0">
              <div>
                <h4 className="font-serif-luxury text-lg font-medium text-stone-900 dark:text-stone-50">
                  Playlist
                </h4>
                <p className="text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-0.5">
                  {filteredList.length} / {songs.length} SOUNDTRACKS
                </p>
              </div>

              {/* Spaced Review Smart Sort Trigger */}
              <button
                type="button"
                onClick={handleSmartSpacedSort}
                className="px-3 py-1.5 rounded-xl bg-[#516050]/10 hover:bg-[#516050]/20 dark:bg-[#8FB996]/15 dark:hover:bg-[#8FB996]/25 border border-[#516050]/20 dark:border-[#8FB996]/30 text-[#516050] dark:text-[#8FB996] text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Sort by review priority"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>按复习优先排序</span>
              </button>
            </div>

            {/* Vocabulary Difficulty Filter Toolbar */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5 border-b border-stone-200/50 dark:border-slate-800/60 shrink-0">
              {[
                { id: 'ALL', label: '全部' },
                {
                  id: 'DUE_REVIEW',
                  label: `待复习 (${analyzedSongs.filter(s => s.hasDueWords).length})`,
                  highlight: analyzedSongs.some(s => s.hasDueWords),
                  hide: analyzedSongs.filter(s => s.hasDueWords).length === 0
                },
                {
                  id: 'NOTEBOOK',
                  label: `生词 (${analyzedSongs.filter(s => s.hasNotebookWords).length})`,
                  hide: analyzedSongs.filter(s => s.hasNotebookWords).length === 0
                },
                {
                  id: 'CHINESE',
                  label: `中文 (${analyzedSongs.filter(s => s.isChinese).length})`,
                  hide: analyzedSongs.filter(s => s.isChinese).length === 0
                }
              ].filter(t => !t.hide).map(tab => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id as PlaylistFilterType)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 flex items-center gap-1 ${
                      isActive
                        ? tab.id === 'DUE_REVIEW'
                          ? 'bg-amber-500 text-white shadow-2xs font-semibold'
                          : 'bg-[#516050] text-white shadow-2xs font-semibold'
                        : tab.highlight
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-white dark:bg-[#1A2234] text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200/60 dark:border-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Track list with smooth scrolling & auto-scroll support */}
            <div
              ref={playlistContainerRef}
              className="flex-1 overflow-y-auto space-y-2.5 mt-3 min-h-0 select-none scroll-smooth no-scrollbar"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {filteredList.length > 0 ? (
                filteredList.map(({ song, originalIdx, matchedList }) => {
                  const isCur = originalIdx === currentSongIndex;

                  return (
                    <div
                      key={song.id}
                      ref={isCur ? activeSongItemRef : undefined}
                      onClick={() => handleSelectSong(originalIdx)}
                      className={`p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-transform duration-150 active:scale-[0.98] ${
                        isCur
                          ? 'bg-[#262E25]/10 dark:bg-[#7EA783]/15 border-2 border-[#262E25]/35 dark:border-[#7EA783]/45 shadow-sm ring-1 ring-[#262E25]/10 dark:ring-[#7EA783]/20'
                          : 'bg-white dark:bg-[#1A2234] border border-stone-200/60 dark:border-slate-800/80 hover:border-stone-400 dark:hover:border-slate-700 hover:bg-stone-50/80 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Album Art with Equalizer Overlay for Active Song */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-2xs flex-shrink-0">
                        <img
                          src={song.albumArtUrl}
                          alt={song.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {isCur && (
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                            <div className="flex items-center gap-0.5">
                              <span className="w-1 h-3 bg-white rounded-full animate-pulse" />
                              <span className="w-1 h-4.5 bg-white rounded-full animate-pulse delay-75" />
                              <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-150" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Title, Artist & Vocab Match Badges */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p
                            className={`font-serif-luxury text-sm font-medium truncate ${
                              isCur
                                ? 'text-[#262E25] dark:text-[#7EA783] font-bold'
                                : 'text-stone-900 dark:text-stone-100'
                            }`}
                          >
                            {song.title}
                          </p>

                          {/* When few words (1 or 2): directly show the word with its circle indicator */}
                          {matchedList && matchedList.length > 0 && matchedList.length <= 2 && (
                            matchedList.map((item, wIdx) => (
                              <span
                                key={`pl-w-${wIdx}`}
                                title={item.isDue ? `待复习生词: ${item.word}` : `生词: ${item.word}`}
                                className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono flex items-center gap-1 border transition-colors ${
                                  item.isDue
                                    ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/30'
                                    : 'bg-[#516050]/10 dark:bg-[#8FB996]/15 text-[#516050] dark:text-[#8FB996] border-[#516050]/20 dark:border-[#8FB996]/20'
                                }`}
                              >
                                <MasteryCircleIndicator level={item.masteryLevel} isDue={item.isDue} size={10} />
                                <span>{item.word}</span>
                              </span>
                            ))
                          )}

                          {/* When many words (>= 3): show first word + circle state count badge */}
                          {matchedList && matchedList.length >= 3 && (
                            <>
                              <span
                                title={matchedList[0].isDue ? `待复习: ${matchedList[0].word}` : `生词: ${matchedList[0].word}`}
                                className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono flex items-center gap-1 border transition-colors ${
                                  matchedList[0].isDue
                                    ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/30'
                                    : 'bg-[#516050]/10 dark:bg-[#8FB996]/15 text-[#516050] dark:text-[#8FB996] border-[#516050]/20 dark:border-[#8FB996]/20'
                                }`}
                              >
                                <MasteryCircleIndicator level={matchedList[0].masteryLevel} isDue={matchedList[0].isDue} size={10} />
                                <span>{matchedList[0].word}</span>
                              </span>

                              <span
                                title={`命中 ${matchedList.length} 个生词: ${matchedList.map(w => w.word).join(', ')}`}
                                className="text-[9px] px-1.5 py-0.5 rounded-md font-mono flex items-center gap-0.5 bg-stone-500/10 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60 cursor-help"
                              >
                                <MasteryCircleIndicator level={matchedList[1]?.masteryLevel ?? 1} isDue={matchedList.some(w => w.isDue)} size={10} />
                                <span>+{matchedList.length - 1}</span>
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-xs text-stone-400 dark:text-stone-500 truncate mt-0.5">
                          {song.artist} · {formatTime(song.duration)}
                        </p>
                      </div>

                      {/* Current Playing Audio Wave or Index */}
                      {isCur ? (
                        <div className="flex items-center gap-1 text-[#262E25] dark:text-[#7EA783] pr-1">
                          <span className="w-1 h-3.5 bg-[#262E25] dark:bg-[#7EA783] rounded-full animate-pulse" />
                          <span className="w-1 h-5 bg-[#262E25] dark:bg-[#7EA783] rounded-full animate-pulse delay-75" />
                          <span className="w-1 h-2.5 bg-[#262E25] dark:bg-[#7EA783] rounded-full animate-pulse delay-150" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-stone-400 px-1">
                          {String(originalIdx + 1).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-stone-400 dark:text-stone-500 text-xs">
                  <p>当前分类下暂无匹配歌曲</p>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('ALL')}
                    className="mt-2 text-[#516050] dark:text-[#8FB996] underline cursor-pointer"
                  >
                    查看全部曲目
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
