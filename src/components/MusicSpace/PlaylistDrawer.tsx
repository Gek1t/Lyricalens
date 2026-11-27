import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../db';
import {
  buildLowerWordSet,
  evaluateAndAnalyzeSong,
  getDueReviewWords,
  prioritizeSongsByNotebookAndSpacedRepetition
} from '../../utils/vocabEngine';
import { VocabDifficultyTag, SongItem, WordItem } from '../../types';
import { triggerHighRefreshBoost } from '../../utils/displayRefreshRate';
import { ArrowUpDown, RotateCcw, Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import {
  PlaylistPrimaryFilter,
  PlaylistVocabSubFilter,
  PlaylistLangSubFilter,
  extractPlaylistArtistOptions,
  filterAnalyzedSongs,
  hasActiveSecondaryFilter
} from '../../utils/playlistFilterEngine';

const EMPTY_PLAYLIST_WORDS: WordItem[] = [];

// Subtle editorial status dot (due: soft warm amber, mastered: calm emerald, learning: soft teal, collected: muted stone)
const MasteryDot: React.FC<{ level?: number; isDue?: boolean }> = ({
  level = 0,
  isDue = false,
}) => {
  const colorClass = isDue
    ? 'bg-amber-500/90 dark:bg-amber-400'
    : level === 3
    ? 'bg-emerald-500/85 dark:bg-emerald-400'
    : level === 2
    ? 'bg-teal-500/80 dark:bg-teal-400'
    : 'bg-stone-300 dark:bg-stone-600';

  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colorClass}`} />;
};

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
  const [activeFilter, setActiveFilter] = useState<PlaylistPrimaryFilter>('ALL');
  const [vocabSubFilter, setVocabSubFilter] = useState<PlaylistVocabSubFilter>('ALL');
  const [langSubFilter, setLangSubFilter] = useState<PlaylistLangSubFilter>('ALL');
  const [artistSubFilter, setArtistSubFilter] = useState<string>('ALL');
  const [isArtistGridExpanded, setIsArtistGridExpanded] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const artistGridRef = useRef<HTMLDivElement | null>(null);
  const playlistContainerRef = useRef<HTMLDivElement | null>(null);
  const activeSongItemRef = useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();

  // Live Dexie query for user's vocabulary vault & due words (suspended while drawer is closed)
  const words = useLiveQuery(
    () => (isPlaylistOpen ? db.words.toArray() : EMPTY_PLAYLIST_WORDS),
    [isPlaylistOpen]
  ) ?? EMPTY_PLAYLIST_WORDS;
  const dueWords = useMemo(() => (isPlaylistOpen ? getDueReviewWords(words) : EMPTY_PLAYLIST_WORDS), [isPlaylistOpen, words]);
  const notebookWordSet = useMemo(() => buildLowerWordSet(words), [words]);
  const dueWordSet = useMemo(() => buildLowerWordSet(dueWords), [dueWords]);

  // Map of user's notebook words for instant lookup of mastery levels
  const notebookWordMap = useMemo(() => {
    const map = new Map<string, WordItem>();
    for (const w of words) {
      if (w.word) map.set(w.word.trim().toLowerCase(), w);
    }
    return map;
  }, [words]);

  // Evaluated songs with difficulties and due-word matches (single-pass per song; suspended when drawer is closed)
  const analyzedSongs = useMemo(() => {
    if (!isPlaylistOpen) return [];
    return songs.map((song, originalIdx) => {
      const { evaluation: evalResult, analysis } = evaluateAndAnalyzeSong(song, notebookWordSet, dueWordSet);
      const isChinese = Boolean(evalResult.isChinese);

      const matchedList = analysis.matchedNotebookWords.map(wordStr => {
        const lower = wordStr.toLowerCase();
        const item = notebookWordMap.get(lower);
        const isDue = dueWordSet.has(lower);
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
  }, [isPlaylistOpen, songs, notebookWordSet, dueWordSet, notebookWordMap]);

  // Precompute filter counts in a single O(N) pass
  const filterCounts = useMemo(() => {
    let dueCount = 0;
    let notebookCount = 0;
    let chineseCount = 0;
    for (const item of analyzedSongs) {
      if (item.hasDueWords) dueCount++;
      if (item.hasNotebookWords) notebookCount++;
      if (item.isChinese) chineseCount++;
    }
    return { dueCount, notebookCount, chineseCount };
  }, [analyzedSongs]);

  // Only surface artists with at least 5 songs in the playlist to keep the filter strip clean
  const MIN_ARTIST_SONG_COUNT = 5;
  const playlistArtists = useMemo(
    () =>
      extractPlaylistArtistOptions(analyzedSongs)
        .filter(opt => opt.count >= MIN_ARTIST_SONG_COUNT)
        .map(opt => opt.name),
    [analyzedSongs]
  );

  useEffect(() => {
    if (isPlaylistOpen && artistSubFilter !== 'ALL' && !playlistArtists.includes(artistSubFilter)) {
      setArtistSubFilter('ALL');
    }
  }, [isPlaylistOpen, artistSubFilter, playlistArtists]);

  // Keep active artist visible in the first row when collapsed if selected from deeper in the grid
  const displayedArtists = useMemo(() => {
    if (isArtistGridExpanded || artistSubFilter === 'ALL') return playlistArtists;
    const idx = playlistArtists.indexOf(artistSubFilter);
    if (idx <= 0) return playlistArtists;
    return [artistSubFilter, ...playlistArtists.filter(a => a !== artistSubFilter)];
  }, [playlistArtists, artistSubFilter, isArtistGridExpanded]);

  const isSecondaryFilterActive = hasActiveSecondaryFilter({
    vocabSubFilter,
    langSubFilter,
    artistSubFilter
  });

  // Filtered song list
  const filteredList = useMemo(() => {
    return filterAnalyzedSongs(analyzedSongs, {
      primaryFilter: activeFilter,
      vocabSubFilter,
      langSubFilter,
      artistSubFilter,
      searchQuery
    });
  }, [analyzedSongs, activeFilter, vocabSubFilter, langSubFilter, artistSubFilter, searchQuery]);

  // Auto-scroll to currently playing track whenever drawer opens or active song changes
  const scrollToActiveSong = useCallback((smooth: boolean = true) => {
    if (activeSongItemRef.current && playlistContainerRef.current) {
      const container = playlistContainerRef.current;
      const activeEl = activeSongItemRef.current;
      const targetScroll = Math.max(
        0,
        activeEl.offsetTop - container.offsetTop - (container.clientHeight / 2 - activeEl.clientHeight / 2)
      );

      if (!smooth) {
        container.scrollTop = targetScroll;
        return;
      }

      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  }, []);

  const hasInitialScrolledRef = useRef(false);

  useEffect(() => {
    if (isPlaylistOpen) {
      triggerHighRefreshBoost(1200);
      const raf = requestAnimationFrame(() => {
        scrollToActiveSong(false);
        hasInitialScrolledRef.current = true;
      });
      return () => cancelAnimationFrame(raf);
    } else {
      hasInitialScrolledRef.current = false;
      setIsExpanded(false);
      setIsArtistGridExpanded(false);
      setIsSearchOpen(false);
      setSearchQuery('');
      setIsFilterMenuOpen(false);
    }
  }, [isPlaylistOpen, scrollToActiveSong]);

  const [collapsedArtistRowHeight, setCollapsedArtistRowHeight] = useState<number>(28);
  const [hasArtistRowOverflow, setHasArtistRowOverflow] = useState<boolean>(false);

  const measureArtistStrip = useCallback(() => {
    const el = artistGridRef.current;
    if (!el || el.children.length === 0) {
      setHasArtistRowOverflow(false);
      return;
    }
    const items = Array.from(el.children) as HTMLElement[];
    const firstTop = items[0].offsetTop;
    let maxRow1Height = 28;
    let wrapped = false;
    for (const child of items) {
      const relTop = child.offsetTop - firstTop;
      if (relTop > 4) {
        wrapped = true;
      } else {
        maxRow1Height = Math.max(maxRow1Height, child.offsetTop + child.offsetHeight);
      }
    }
    const nextHeight = Math.ceil(maxRow1Height);
    setCollapsedArtistRowHeight(prev => (prev === nextHeight ? prev : nextHeight));
    setHasArtistRowOverflow(prev => (prev === wrapped ? prev : wrapped));
  }, []);

  useLayoutEffect(() => {
    if (!isPlaylistOpen || displayedArtists.length === 0) {
      setHasArtistRowOverflow(false);
      return;
    }
    if (!isFilterMenuOpen) return;
    measureArtistStrip();
    const el = artistGridRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measureArtistStrip());
    ro.observe(el);
    return () => ro.disconnect();
  }, [isPlaylistOpen, isFilterMenuOpen, displayedArtists, measureArtistStrip]);

  useEffect(() => {
    if (!isArtistGridExpanded && artistGridRef.current) {
      artistGridRef.current.scrollTop = 0;
    }
  }, [isArtistGridExpanded]);

  useEffect(() => {
    if (isSearchOpen) {
      const t = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
      return () => window.clearTimeout(t);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (isPlaylistOpen && hasInitialScrolledRef.current) {
      scrollToActiveSong(true);
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
          style={{ transform: 'translate3d(0, 0, 0)' }}
          className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-auto overflow-hidden isolate"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Backdrop with Silky Fade (Zero GPU Readback) */}
          <motion.div
            key="playlist-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 bg-stone-950/50 dark:bg-black/75 cursor-pointer"
            onClick={() => {
              setIsPlaylistOpen(false);
              setIsExpanded(false);
            }}
          />

          {/* Bottom Drawer Sheet (Pure GPU Transform Expansion without CSS Height Reflow) */}
          <motion.div
            id="music-playlist-sheet"
            key="playlist-sheet"
            data-no-swipe="true"
            data-no-gesture="true"
            initial={{ y: '100%' }}
            animate={{ y: isExpanded ? '0%' : '20%' }}
            exit={{ y: '100%' }}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.08, bottom: 0.5 }}
            onDragStart={() => triggerHighRefreshBoost(1000)}
            onDragEnd={(_, info) => {
              triggerHighRefreshBoost(1000);
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
              height: '92%',
              paddingBottom: isExpanded ? '2rem' : '22%',
              willChange: 'transform',
              contain: 'layout style paint',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="relative w-full flex flex-col rounded-t-[32px] sm:rounded-t-[36px] bg-[#FAF7F2] dark:bg-[#121826] border-t border-white/90 dark:border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.35)] px-5 pt-3 z-10 overflow-hidden hardware-accelerated"
          >
            {/* Drag Pill Handle */}
            <div
              className="w-full flex flex-col items-center justify-center py-2.5 cursor-grab active:cursor-grabbing touch-none select-none group"
              onPointerDown={(e) => dragControls.start(e)}
              onClick={() => {
                triggerHighRefreshBoost(1000);
                setIsExpanded(prev => !prev);
              }}
              title={isExpanded ? "下滑或点击收起为半屏" : "上滑或点击展开全屏 / 下滑收起"}
            >
              <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600/80 group-hover:bg-stone-400 dark:group-hover:bg-stone-500 transition-all duration-200" />
            </div>

            {/* Header & Smart Spaced Sort Action */}
            <div
              onPointerDown={(e) => {
                if (!(e.target as HTMLElement)?.closest('button')) {
                  dragControls.start(e);
                }
              }}
              className="flex items-center justify-between pb-3 border-b border-stone-200/70 dark:border-slate-800/80 shrink-0 touch-none"
            >
              <div className="flex items-baseline gap-2 min-w-0">
                <h4 className="text-[16px] font-semibold text-stone-900 dark:text-stone-50 tracking-tight">
                  播放列表
                </h4>
                <span className="text-xs font-mono tabular-nums text-stone-400 dark:text-stone-500">
                  {filteredList.length} / {songs.length} 首
                </span>
              </div>

              {/* Spaced Review Smart Sort Trigger */}
              <button
                type="button"
                onClick={handleSmartSpacedSort}
                className="h-8 px-3 rounded-xl bg-white dark:bg-[#1A2234] hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200/85 dark:border-slate-700/80 text-stone-700 dark:text-stone-200 text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                title="按待复习生词优先排序"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                <span>复习优先</span>
              </button>
            </div>

            {/* Vocabulary Filter Toolbar + Animated Horizontal Search & Secondary Filter Trigger */}
            <div className="relative h-11 flex items-center justify-between gap-2 border-b border-stone-200/50 dark:border-slate-800/60 shrink-0 overflow-hidden">
              <AnimatePresence initial={false} mode="wait">
                {!isSearchOpen ? (
                  <motion.div
                    key="toolbar-normal"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full flex items-center justify-between gap-2"
                  >
                    {/* Left Primary Filter Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 min-w-0">
                      {[
                        { id: 'ALL', label: '全部', count: null as number | null },
                        {
                          id: 'DUE_REVIEW',
                          label: '待复习',
                          count: filterCounts.dueCount,
                          dot: filterCounts.dueCount > 0,
                          hide: filterCounts.dueCount === 0
                        },
                        {
                          id: 'NOTEBOOK',
                          label: '含生词',
                          count: filterCounts.notebookCount,
                          hide: filterCounts.notebookCount === 0
                        }
                      ].filter(t => !t.hide).map(tab => {
                        const isActive = activeFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveFilter(tab.id as PlaylistPrimaryFilter)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 inline-flex items-center gap-1.5 cursor-pointer tabular-nums ${
                              isActive
                                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs'
                                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-slate-800/80 hover:text-stone-900 dark:hover:text-stone-100'
                            }`}
                          >
                            {tab.dot && !isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/90 dark:bg-amber-400 shrink-0" />
                            )}
                            <span>{tab.label}</span>
                            {tab.count !== null && (
                              <span className={`font-mono text-[10px] ${isActive ? 'opacity-75' : 'text-stone-400 dark:text-stone-500'}`}>
                                {tab.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Minimalist Icon Triggers: Search & Secondary Filter */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        aria-label="Search playlist"
                        onClick={() => setIsSearchOpen(true)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                          searchQuery.trim()
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs'
                            : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-slate-800 hover:text-stone-900 dark:hover:text-stone-100'
                        }`}
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        aria-label="Filter playlist"
                        aria-expanded={isFilterMenuOpen}
                        onClick={() => setIsFilterMenuOpen(prev => !prev)}
                        className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                          isFilterMenuOpen || isSecondaryFilterActive
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs'
                            : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-slate-800 hover:text-stone-900 dark:hover:text-stone-100'
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="toolbar-search"
                    initial={{ opacity: 0, scaleX: 0.78 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0.85 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: 'right center' }}
                    className="w-full h-8 px-3 rounded-xl bg-white dark:bg-[#1A2234] border border-stone-300/80 dark:border-slate-700 flex items-center gap-2 shadow-2xs"
                  >
                    <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setSearchQuery('');
                          setIsSearchOpen(false);
                        }
                      }}
                      placeholder="搜索歌名或歌手..."
                      aria-label="Search tracks"
                      className="flex-1 min-w-0 bg-transparent text-xs text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      aria-label="Close search"
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shrink-0 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Expandable Secondary Filter Menu (Smooth Motion Height & Opacity Accordion) */}
            <AnimatePresence initial={false}>
              {isFilterMenuOpen && (
                <motion.div
                  key="playlist-secondary-filter-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden shrink-0"
                >
                  <motion.div
                    initial={{ y: -6 }}
                    animate={{ y: 0 }}
                    exit={{ y: -6 }}
                    transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    className="py-2.5 border-b border-stone-200/50 dark:border-slate-800/60 flex flex-col gap-2"
                  >
                    {/* Row 1: Mastery, Corpus & Language */}
                    <div className="min-h-7 py-0.5 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(
                          [
                            { id: 'UNMASTERED', label: '未掌握' },
                            { id: 'MASTERED', label: '已掌握' },
                            { id: 'IELTS', label: 'IELTS' }
                          ] as { id: PlaylistVocabSubFilter; label: string }[]
                        ).map(opt => {
                          const active = vocabSubFilter === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setVocabSubFilter(prev => (prev === opt.id ? 'ALL' : opt.id))}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all shrink-0 cursor-pointer ${
                                active
                                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-transparent shadow-2xs'
                                  : 'bg-white/80 dark:bg-[#1A2234]/80 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 border-stone-200/60 dark:border-slate-800'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}

                        <div className="w-px h-3.5 bg-stone-200/80 dark:bg-slate-700/80 mx-0.5 shrink-0" />

                        {(
                          [
                            { id: 'EN', label: '英文' },
                            { id: 'ZH', label: '中文' }
                          ] as { id: PlaylistLangSubFilter; label: string }[]
                        ).map(opt => {
                          const active = langSubFilter === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setLangSubFilter(prev => (prev === opt.id ? 'ALL' : opt.id))}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all shrink-0 cursor-pointer ${
                                active
                                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-transparent shadow-2xs'
                                  : 'bg-white/80 dark:bg-[#1A2234]/80 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 border-stone-200/60 dark:border-slate-800'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        aria-label="Reset filters"
                        onClick={() => {
                          setVocabSubFilter('ALL');
                          setLangSubFilter('ALL');
                          setArtistSubFilter('ALL');
                        }}
                        className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 bg-white/80 dark:bg-[#1A2234]/80 border border-stone-200/60 dark:border-slate-800 transition-all duration-200 shrink-0 cursor-pointer ${
                          isSecondaryFilterActive
                            ? 'opacity-100 scale-100 pointer-events-auto'
                            : 'opacity-0 scale-75 pointer-events-none'
                        }`}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Row 2: Artist Filter Strip */}
                    {displayedArtists.length > 0 && (
                      <div
                        className="flex items-start justify-between gap-1.5"
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                      >
                        <motion.div
                          initial={false}
                          animate={{ height: isArtistGridExpanded ? 'auto' : collapsedArtistRowHeight }}
                          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                          className="flex-1 min-w-0 overflow-hidden"
                        >
                          <div
                            ref={artistGridRef}
                            className={`relative flex flex-wrap items-center gap-1.5 no-scrollbar max-h-[140px] ${
                              isArtistGridExpanded
                                ? 'overflow-y-auto touch-pan-y pb-0.5'
                                : 'overflow-hidden'
                            }`}
                          >
                            {displayedArtists.map(artist => {
                              const active = artistSubFilter === artist;
                              return (
                                <button
                                  key={artist}
                                  type="button"
                                  onClick={() => setArtistSubFilter(prev => (prev === artist ? 'ALL' : artist))}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all shrink-0 cursor-pointer max-w-[150px] truncate ${
                                    active
                                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-transparent shadow-2xs'
                                      : 'bg-white/80 dark:bg-[#1A2234]/80 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 border-stone-200/60 dark:border-slate-800'
                                  }`}
                                >
                                  {artist}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>

                        {hasArtistRowOverflow && (
                          <button
                            type="button"
                            aria-label={isArtistGridExpanded ? 'Collapse artists' : 'Expand artists'}
                            aria-expanded={isArtistGridExpanded}
                            onClick={() => setIsArtistGridExpanded(prev => !prev)}
                            className="w-6.5 h-6.5 mt-0.5 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 bg-white/80 dark:bg-[#1A2234]/80 border border-stone-200/60 dark:border-slate-800 transition-all shrink-0 cursor-pointer"
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isArtistGridExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Track list with smooth scrolling & auto-scroll support */}
            <div
              ref={playlistContainerRef}
              className="flex-1 overflow-y-auto overscroll-contain touch-pan-y space-y-2 pt-3 min-h-0 select-none no-scrollbar bg-[#FAF7F2] dark:bg-[#121826]"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {filteredList.length > 0 ? (
                filteredList.map(({ song, originalIdx, matchedList }) => {
                  const isCur = originalIdx === currentSongIndex;
                  const visibleMatches = matchedList ? matchedList.slice(0, 2) : [];
                  const extraMatchCount = matchedList && matchedList.length > 2 ? matchedList.length - 2 : 0;

                  return (
                    <div
                      key={song.id}
                      ref={isCur ? activeSongItemRef : undefined}
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 76px' }}
                      onClick={() => handleSelectSong(originalIdx)}
                      className={`relative px-3.5 py-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all duration-150 active:scale-[0.985] ${
                        isCur
                          ? 'bg-white dark:bg-[#1B2436] border border-stone-900/12 dark:border-white/15 shadow-[0_6px_20px_-6px_rgba(28,25,23,0.12)] dark:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.5)]'
                          : 'bg-white/65 dark:bg-[#161E2E]/80 border border-stone-200/60 dark:border-slate-800/75 hover:bg-white dark:hover:bg-[#1B2436] hover:border-stone-300/80 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Clean Album Art (No duplicate equalizer overlay) */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-2xs shrink-0 ring-1 ring-black/[0.05] dark:ring-white/[0.06]">
                        <img
                          src={song.albumArtUrl}
                          alt={song.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Uniform 3-Line Editorial Layout: Title / Artist·Time / Optional Single-Line Inline Vocab */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-serif-luxury text-[15px] leading-snug truncate ${
                            isCur
                              ? 'text-stone-950 dark:text-white font-semibold'
                              : 'text-stone-800 dark:text-stone-100 font-medium'
                          }`}
                        >
                          {song.title}
                        </p>

                        <p className="text-xs text-stone-400 dark:text-stone-500 truncate mt-0.5 tabular-nums">
                          {song.artist} · {formatTime(song.duration)}
                        </p>

                        {visibleMatches.length > 0 && (
                          <div
                            className="mt-1.5 flex items-center gap-2.5 text-[11.5px] leading-tight overflow-hidden whitespace-nowrap"
                            title={`命中生词: ${matchedList.map(w => w.word).join(', ')}`}
                          >
                            {visibleMatches.map((item, wIdx) => (
                              <span
                                key={`pl-w-${wIdx}`}
                                className={`inline-flex items-center gap-1.5 min-w-0 truncate ${
                                  item.isDue
                                    ? 'text-stone-700 dark:text-stone-200 font-medium'
                                    : 'text-stone-500 dark:text-stone-400'
                                }`}
                              >
                                <MasteryDot level={item.masteryLevel} isDue={item.isDue} />
                                <span className="truncate">{item.word}</span>
                              </span>
                            ))}
                            {extraMatchCount > 0 && (
                              <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500 shrink-0 tabular-nums">
                                +{extraMatchCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Single Right-Side Active Equalizer or Track Index */}
                      {isCur ? (
                        <div className="flex items-end gap-[3px] h-3.5 pr-1 shrink-0" aria-label="Now playing">
                          <span className="w-[2px] h-2 bg-stone-800 dark:bg-stone-100 rounded-full animate-pulse" />
                          <span className="w-[2px] h-3.5 bg-stone-800 dark:bg-stone-100 rounded-full animate-pulse delay-75" />
                          <span className="w-[2px] h-1.5 bg-stone-800 dark:bg-stone-100 rounded-full animate-pulse delay-150" />
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono tabular-nums text-stone-400/85 dark:text-stone-500 px-1 shrink-0">
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
                    onClick={() => {
                      setActiveFilter('ALL');
                      setVocabSubFilter('ALL');
                      setLangSubFilter('ALL');
                      setArtistSubFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="mt-2 text-stone-700 dark:text-stone-200 underline underline-offset-4 cursor-pointer"
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
