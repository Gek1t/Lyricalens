import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, cycleWordMastery, setWordMastery, bulkUpdateMastery, bulkAddTags, bulkDeleteWords, recordWordReview } from '../db';
import { WordItem, MasteryLevel } from '../types';
import { useAppStore } from '../store/useAppStore';
import { speakWord, speakWordIfAutoEnabled } from '../utils/audioEngine';
import { MasteryBadge, MASTERY_CONFIG } from './MasteryBadge';
import { formatPartOfSpeech } from '../utils/lyricDictionary';
import { calculateEbbinghausRetention } from '../utils/vocabEngine';
import { triggerHighRefreshBoost } from '../utils/displayRefreshRate';
import {
  Search,
  Volume2,
  X,
  BookOpen,
  Trash2,
  CheckCircle2,
  Tag,
  ListChecks,
  Check,
  RotateCcw,
  Plus,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  Download
} from 'lucide-react';

interface NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_TAGS = ['IELTS', 'Academic', 'Daily', 'High Frequency', 'Exam 8.0+', 'Nature & Art', 'Business'];

export const NotebookModal: React.FC<NotebookModalProps> = ({ isOpen, onClose }) => {
  const notebookInitialFilter = useAppStore(s => s.notebookInitialFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'ALL' | 'DUE_REVIEW' | 'UNMASTERED' | 'MASTERED' | 'LEVEL_1' | 'LEVEL_0' | 'IELTS' | 'MUSIC' | 'AR'
  >('ALL');
  const [isPrewarmed, setIsPrewarmed] = useState(false);

  // Pre-warm NotebookModal DOM in background after startup idle so opening has 0ms mount stall
  useEffect(() => {
    const t = window.setTimeout(() => {
      setIsPrewarmed(true);
    }, 750);
    return () => window.clearTimeout(t);
  }, []);

  // Sync initial filter from store when opened
  useEffect(() => {
    if (isOpen) {
      setIsPrewarmed(true);
      triggerHighRefreshBoost(1200);
      setActiveFilter(notebookInitialFilter || 'ALL');
    }
  }, [isOpen, notebookInitialFilter]);

  // Batch Management Mode State
  const isBatchMode = useAppStore(s => s.isNotebookBatchMode);
  const setIsBatchMode = useAppStore(s => s.setIsNotebookBatchMode);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  
  // Batch Tagging Modal State
  const isTagModalOpen = useAppStore(s => s.isNotebookTagModalOpen);
  const setIsTagModalOpen = useAppStore(s => s.setIsNotebookTagModalOpen);
  const [customTagInput, setCustomTagInput] = useState('');

  // Flashcard Rapid Review State
  const isFlashcardOpen = useAppStore(s => s.isNotebookFlashcardOpen);
  const setIsFlashcardOpen = useAppStore(s => s.setIsNotebookFlashcardOpen);
  const [flashcardDeck, setFlashcardDeck] = useState<WordItem[]>([]);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardDirection, setFlashcardDirection] = useState<1 | -1>(1);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [flashcardStats, setFlashcardStats] = useState<{ mastered: number; learning: number }>({
    mastered: 0,
    learning: 0
  });
  const isCardSwipingRef = useRef(false);
  
  // Long-press detection references
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isMovedRef = useRef(false);
  const lastPointerEndRef = useRef(0);
  const activeLongPressWordRef = useRef<string | null>(null);
  const [elevatedWord, setElevatedWord] = useState<string | null>(null);

  const openWordDetail = useAppStore(s => s.openWordDetail);
  const setActiveSpace = useAppStore(s => s.setActiveSpace);
  const generateIELTSTestFromWords = useAppStore(s => s.generateIELTSTestFromWords);
  const showToast = useAppStore(s => s.showToast);

  // Live Dexie database query (suspended sorting & Ebbinghaus math when modal is closed)
  const rawAllWords = useLiveQuery(
    () => db.words.toArray(),
    []
  );
  const allWords = useMemo(
    () => (isPrewarmed && rawAllWords ? [...rawAllWords].sort((a, b) => (b.addedTimestamp || 0) - (a.addedTimestamp || 0)) : undefined),
    [isPrewarmed, rawAllWords]
  );

  // Precompute Ebbinghaus retention once per word in a single O(N) pass
  const { retentionMap, dueWordsCount } = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateEbbinghausRetention>>();
    let dueCount = 0;
    if (!isPrewarmed || !allWords) return { retentionMap: map, dueWordsCount: 0 };
    const now = Date.now();
    for (const w of allWords) {
      const info = calculateEbbinghausRetention(w, now);
      map.set(w.word, info);
      if (info.isDue) dueCount++;
    }
    return { retentionMap: map, dueWordsCount: dueCount };
  }, [isPrewarmed, allWords]);

  const [sessionReviewedWords, setSessionReviewedWords] = useState<Set<string>>(new Set());
  const [sessionModifiedWords, setSessionModifiedWords] = useState<Set<string>>(new Set());

  const isWordFromSource = (w: WordItem, sourceType: 'IELTS' | 'MUSIC' | 'AR'): boolean => {
    const ctx = (w.sourceContext || '').toLowerCase();
    const cats = (w.categories || []).map(c => c.toLowerCase());
    if (sourceType === 'IELTS') {
      return (
        cats.some(c => c.includes('ielts') || c.includes('cambridge') || c.includes('academic')) ||
        ctx.includes('ielts') ||
        ctx.includes('cambridge') ||
        ctx.includes('passage') ||
        ctx.includes('真题')
      );
    }
    if (sourceType === 'AR') {
      return (
        cats.some(c => c.includes('ar') || c.includes('spatial') || c.includes('vision')) ||
        ctx.includes('ar ') ||
        ctx.includes('spatial') ||
        ctx.includes('实景') ||
        ctx.includes('camera') ||
        Boolean(w.arObjectLabel)
      );
    }
    // MUSIC
    return (
      cats.some(c => c.includes('music') || c.includes('lyric') || c.includes('song')) ||
      ctx.includes('lyric') ||
      ctx.includes('song') ||
      ctx.includes('歌词') ||
      (!isWordFromSource(w, 'IELTS') && !isWordFromSource(w, 'AR') && Boolean(w.sourceContext))
    );
  };

  // Filtered words list (maintains session stability so clicked/reviewed items don't suddenly vanish)
  const filteredWords = useMemo(() => {
    if (!isPrewarmed || !allWords) return [];
    return allWords.filter(w => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        w.word.toLowerCase().includes(term) ||
        w.definitionCn.includes(term) ||
        (w.categories && w.categories.some(c => c.toLowerCase().includes(term))) ||
        (w.sourceContext && w.sourceContext.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      const isReviewedInSession = sessionReviewedWords.has(w.word);
      const isModifiedInSession = sessionModifiedWords.has(w.word);

      if (activeFilter === 'DUE_REVIEW') {
        const retention = retentionMap.get(w.word) || calculateEbbinghausRetention(w);
        return retention.isDue || isReviewedInSession || isModifiedInSession;
      }

      if (isModifiedInSession) {
        return true;
      }

      const level = (w.masteryLevel ?? (w.isStarred ? 1 : 0)) as MasteryLevel;
      if (activeFilter === 'UNMASTERED') return level === 2;
      if (activeFilter === 'MASTERED') return level === 3;
      if (activeFilter === 'LEVEL_1') return level === 1;
      if (activeFilter === 'LEVEL_0') return level === 0;
      if (activeFilter === 'IELTS') return isWordFromSource(w, 'IELTS');
      if (activeFilter === 'MUSIC') return isWordFromSource(w, 'MUSIC');
      if (activeFilter === 'AR') return isWordFromSource(w, 'AR');
      return true;
    });
  }, [isPrewarmed, allWords, searchTerm, activeFilter, sessionReviewedWords, sessionModifiedWords, retentionMap]);

  const visibleWords = isOpen ? filteredWords : filteredWords.slice(0, 12);

  // Quick mark single word as reviewed today
  const handleMarkReviewed = async (e: React.MouseEvent, item: WordItem) => {
    e.stopPropagation();
    try {
      await recordWordReview(item.word, false);
      setSessionReviewedWords(prev => new Set(prev).add(item.word));
      showToast(`已完成「${item.word}」今日复习打卡`);
    } catch (err) {
      console.error(err);
    }
  };

  // Mastery Statistics (0: 未收录, 1: 已加入单词集, 2: 熟悉/学习中, 3: 已掌握)
  const masteryStats = useMemo(() => {
    if (!allWords) return { 0: 0, 1: 0, 2: 0, 3: 0, total: 0 };
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, total: allWords.length };
    allWords.forEach(w => {
      const lvl = Math.max(0, Math.min(3, (w.masteryLevel ?? (w.isStarred ? 1 : 0)))) as MasteryLevel;
      counts[lvl] = (counts[lvl] || 0) + 1;
    });
    return counts;
  }, [allWords]);

  // Reset batch selection & session lists when closed or mode toggled off
  useEffect(() => {
    if (!isOpen) {
      setIsBatchMode(false);
      setSelectedWords(new Set());
      setIsTagModalOpen(false);
      setIsFlashcardOpen(false);
      setFlashcardDeck([]);
      setSessionReviewedWords(new Set());
      setSessionModifiedWords(new Set());
    }
  }, [isOpen]);

  // Start Flashcard Rapid Review Session
  const notebookAutoFlashcard = useAppStore(s => s.notebookAutoFlashcard);

  const handleStartFlashcardReview = () => {
    if (!allWords || allWords.length === 0) {
      showToast('生词本暂无词汇可供速刷');
      return;
    }
    const now = Date.now();
    const basePool = filteredWords.length > 0 ? [...filteredWords] : [...allWords];
    // Sort so due and unmastered words come first, while keeping the full deck available for swiping
    basePool.sort((a, b) => {
      const aDue = calculateEbbinghausRetention(a, now).isDue ? 1 : 0;
      const bDue = calculateEbbinghausRetention(b, now).isDue ? 1 : 0;
      if (aDue !== bDue) return bDue - aDue;
      const aLvl = a.masteryLevel ?? (a.isStarred ? 1 : 0);
      const bLvl = b.masteryLevel ?? (b.isStarred ? 1 : 0);
      return aLvl - bLvl;
    });

    const deck = basePool.slice(0, 30);
    setFlashcardDeck(deck);
    setFlashcardIndex(0);
    setFlashcardDirection(1);
    setIsFlashcardFlipped(false);
    setFlashcardStats({ mastered: 0, learning: 0 });
    setIsFlashcardOpen(true);

    if (deck[0]) {
      setTimeout(() => speakWordIfAutoEnabled(deck[0].word), 180);
    }
  };

  useEffect(() => {
    if (isOpen && notebookAutoFlashcard && allWords && allWords.length > 0 && flashcardDeck.length === 0) {
      handleStartFlashcardReview();
    }
  }, [isOpen, notebookAutoFlashcard, allWords, flashcardDeck.length]);

  const handleNavigateFlashcard = (dir: -1 | 1) => {
    const nextIdx = flashcardIndex + dir;
    if (nextIdx < 0 || nextIdx >= flashcardDeck.length) return;
    setFlashcardDirection(dir);
    setIsFlashcardFlipped(false);
    setFlashcardIndex(nextIdx);
    if (flashcardDeck[nextIdx]) {
      setTimeout(() => speakWordIfAutoEnabled(flashcardDeck[nextIdx].word), 140);
    }
  };

  // Support Left / Right arrow keys when flashcard modal is open
  useEffect(() => {
    if (!isFlashcardOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleNavigateFlashcard(-1);
      } else if (e.key === 'ArrowRight') {
        handleNavigateFlashcard(1);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsFlashcardFlipped(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFlashcardOpen, flashcardIndex, flashcardDeck]);

  const handleFlashcardDecision = async (targetLevel: 1 | 2 | 3) => {
    const currentCard = flashcardDeck[flashcardIndex];
    if (!currentCard) return;

    const isMastered = targetLevel === 3;
    const nextIdx = flashcardIndex + 1;

    // Advance card UI immediately for zero-latency tactile responsiveness
    setFlashcardStats(prev => ({
      mastered: prev.mastered + (isMastered ? 1 : 0),
      learning: prev.learning + (isMastered ? 0 : 1)
    }));
    setFlashcardDirection(1);
    setIsFlashcardFlipped(false);
    setFlashcardIndex(nextIdx);

    if (nextIdx < flashcardDeck.length) {
      setTimeout(() => speakWordIfAutoEnabled(flashcardDeck[nextIdx].word), 160);
    }

    try {
      await recordWordReview(currentCard.word, isMastered);
      await setWordMastery(currentCard.word, targetLevel);
      setSessionReviewedWords(prev => new Set(prev).add(currentCard.word));
      setSessionModifiedWords(prev => new Set(prev).add(currentCard.word));
    } catch (e) {
      console.error(e);
    }
  };

  const handleFilterChange = (filterId: typeof activeFilter) => {
    setActiveFilter(filterId);
    setSessionReviewedWords(new Set());
    setSessionModifiedWords(new Set());
  };

  // Toggle selection for a single word
  const toggleSelectWord = (wordStr: string) => {
    setSelectedWords(prev => {
      const next = new Set(prev);
      if (next.has(wordStr)) {
        next.delete(wordStr);
      } else {
        next.add(wordStr);
      }
      return next;
    });
  };

  // Select all or deselect all in current view
  const handleToggleSelectAll = () => {
    if (selectedWords.size === filteredWords.length && filteredWords.length > 0) {
      setSelectedWords(new Set());
    } else {
      const allKeys = new Set(filteredWords.map(w => w.word));
      setSelectedWords(allKeys);
    }
  };

  // Exit Batch Mode
  const handleExitBatchMode = () => {
    setIsBatchMode(false);
    setSelectedWords(new Set());
    setElevatedWord(null);
  };

  // --- Long-Press Handlers (Haptic Vibration + Elevation + Auto-check) ---
  const handleTouchStart = (item: WordItem, e: React.TouchEvent | React.MouseEvent) => {
    // If the touch or click was on an interactive control (button, mastery badge, checkbox), ignore
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, [role="button"], input, a')) {
      return;
    }

    isMovedRef.current = false;
    isLongPressTriggeredRef.current = false;
    activeLongPressWordRef.current = item.word;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    touchStartPosRef.current = { x: clientX, y: clientY };

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      // Trigger subtle haptic vibration (20ms)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(20);
        } catch {
          // Ignore if vibration permissions are restricted
        }
      }

      // Elevate card visually and activate batch mode
      setElevatedWord(item.word);
      setIsBatchMode(true);
      setSelectedWords(prev => {
        const next = new Set(prev);
        next.add(item.word);
        return next;
      });

      setTimeout(() => {
        setElevatedWord(null);
      }, 500);
    }, 420);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartPosRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const distance = Math.hypot(clientX - touchStartPosRef.current.x, clientY - touchStartPosRef.current.y);

    // If user scrolled > 8px, cancel long-press and mark scroll move
    if (distance > 8) {
      isMovedRef.current = true;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handleTouchEnd = (item: WordItem, e?: React.TouchEvent | React.MouseEvent) => {
    // Mark touch/mouse-end so the synthetic onClick that follows does not double-trigger
    lastPointerEndRef.current = Date.now();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (e) {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, [role="button"], input, a')) {
        touchStartPosRef.current = null;
        isMovedRef.current = false;
        return;
      }
    }

    // If user scrolled > 8px, cancel tap action
    if (isMovedRef.current) {
      isMovedRef.current = false;
      touchStartPosRef.current = null;
      return;
    }

    // If long press was not started on card body, ignore
    if (!touchStartPosRef.current && !isLongPressTriggeredRef.current) {
      return;
    }
    touchStartPosRef.current = null;

    // If long press was triggered, do not trigger tap
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }

    // Normal Tap Action on Card -> Open Fullscreen WordDetailSheet
    if (isBatchMode) {
      toggleSelectWord(item.word);
    } else {
      openWordDetail(item, null, 'fullscreen');
    }
  };

  // --- Mastery Badge Toggle (Click Mastery Ring) ---
  const handleToggleMastery = async (item: WordItem) => {
    setSessionModifiedWords(prev => new Set(prev).add(item.word));
    await cycleWordMastery(item.word);
  };

  // --- Batch Actions ---
  // 1. 🎯 Match Cambridge IELTS Official Passage with Selected Words
  const handleBatchGenerateIELTS = () => {
    if (selectedWords.size === 0) {
      showToast('请先勾选需要匹配真题的生词');
      return;
    }
    const wordsList: string[] = Array.from(selectedWords);
    onClose();
    generateIELTSTestFromWords(wordsList);
    showToast(`已匹配包含这 ${wordsList.length} 个生词的剑雅真题`);
  };

  // 2. ✔ Batch Mark Mastered or Reset
  const handleBatchSetMastery = async (level: MasteryLevel) => {
    if (selectedWords.size === 0) return;
    const wordsList: string[] = Array.from(selectedWords);
    await bulkUpdateMastery(wordsList, level);
    const config = MASTERY_CONFIG[level];
    showToast(`已批量将 ${wordsList.length} 个词汇标记为：${config.label}`);
    setIsBatchMode(false);
    setSelectedWords(new Set());
  };

  // 3. 🏷 Batch Add Tag
  const handleApplyBatchTag = async (tagToAdd: string) => {
    const cleanTag = tagToAdd.trim();
    if (!cleanTag || selectedWords.size === 0) return;
    const wordsList: string[] = Array.from(selectedWords);
    await bulkAddTags(wordsList, [cleanTag]);
    showToast(`已为 ${wordsList.length} 个词汇添加标签 "${cleanTag}"`);
    setCustomTagInput('');
    setIsTagModalOpen(false);
  };

  // 4. 🗑 Batch Delete Words
  const handleBatchDelete = async () => {
    if (selectedWords.size === 0) return;
    const wordsList: string[] = Array.from(selectedWords);
    await bulkDeleteWords(wordsList);
    showToast(`已从生词本中移除 ${wordsList.length} 个词汇`);
    setIsBatchMode(false);
    setSelectedWords(new Set());
  };

  // 5. 📥 Export Vocabulary Sheet (CSV with UTF-8 BOM for Excel/Numbers)
  const handleExportWordsCsv = (onlySelected = false) => {
    const targetList = onlySelected
      ? (allWords || []).filter(w => selectedWords.has(w.word))
      : filteredWords;

    if (targetList.length === 0) {
      showToast('当前列表没有可导出的词汇');
      return;
    }

    const levelLabels: Record<number, string> = {
      0: '未收录',
      1: '已加入',
      2: '学习中',
      3: '已掌握'
    };

    const escapeCsv = (val: string) => `"${String(val || '').replace(/"/g, '""')}"`;
    const headers = ['单词 (Word)', '音标 (Phonetic)', '词性 (POS)', '中文释义 (Meaning)', '掌握程度 (Mastery)', '来源语境 (Context)', '分类标签 (Tags)'];
    const rows = targetList.map(w => {
      const lvl = (w.masteryLevel ?? (w.isStarred ? 1 : 0)) as number;
      return [
        escapeCsv(w.word),
        escapeCsv(w.phoneticUk || `/${w.word}/`),
        escapeCsv(formatPartOfSpeech(w.partOfSpeech, w.word)),
        escapeCsv(w.definitionCn),
        escapeCsv(levelLabels[lvl] || '已加入'),
        escapeCsv(w.sourceContext || ''),
        escapeCsv((w.categories || []).join(' / '))
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lyricalens_vocab_sheet_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`已导出 ${targetList.length} 个词汇的背诵表 (.csv)`);
  };

  return (
    <div
      aria-hidden={!isOpen}
      style={{
        visibility: isOpen ? 'visible' : 'hidden',
        transform: isOpen ? 'translate3d(0, 0%, 0)' : 'translate3d(0, 102%, 0)',
        WebkitTransform: isOpen ? 'translate3d(0, 0%, 0)' : 'translate3d(0, 102%, 0)',
        transition: isOpen
          ? 'transform var(--spring-duration-modal, 280ms) cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0s'
          : 'transform var(--spring-duration-modal, 280ms) cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 280ms',
        WebkitTransition: isOpen
          ? '-webkit-transform var(--spring-duration-modal, 280ms) cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0s'
          : '-webkit-transform var(--spring-duration-modal, 280ms) cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 280ms',
        pointerEvents: isOpen ? 'auto' : 'none',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        contain: 'layout paint style',
      }}
      className="absolute inset-0 z-50 flex flex-col bg-[#FAF8F5] dark:bg-[#0F1523] text-stone-900 dark:text-stone-100 select-none overflow-hidden hardware-accelerated"
    >
          {/* Top Header Bar */}
          <div className="relative w-full px-4 sm:px-5 pt-[var(--android-safe-top,max(3.25rem,calc(env(safe-area-inset-top,44px)+0.85rem)))] pb-3.5 border-b border-stone-200/70 dark:border-slate-800/80 flex items-center justify-between gap-2 bg-white/95 dark:bg-[#151D2E]/95 z-30">
            {!isBatchMode ? (
              // Normal Header
              <>
                <div className="min-w-0 flex-1 pr-1">
                  <h2 className="font-serif-luxury text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-50 leading-tight truncate">
                    Vocabulary Vault
                  </h2>
                  <span className="text-[11px] font-sans text-stone-400 dark:text-stone-500 block truncate tabular-nums">
                    生词本 · {allWords?.length || 0} 词
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  {/* Flashcard Rapid Review Button */}
                  <button
                    type="button"
                    onClick={handleStartFlashcardReview}
                    className="h-8 px-3 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-stone-50 dark:text-stone-900 rounded-xl inline-flex items-center gap-1.5 text-xs font-medium transition-colors active:scale-[0.98] shrink-0 cursor-pointer"
                    title="闪卡复习"
                  >
                    <span>闪卡复习</span>
                    {dueWordsCount > 0 && (
                      <span className="font-mono text-[11px] opacity-70 tabular-nums">
                        {dueWordsCount}
                      </span>
                    )}
                  </button>

                  {/* Enter Batch Mode Button */}
                  <button
                    id="vault-enter-batch-mode-btn"
                    onClick={() => setIsBatchMode(true)}
                    className="p-1.5 sm:p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-slate-800/60 rounded-xl flex items-center justify-center transition-colors active:scale-95 shrink-0 cursor-pointer"
                    title="批量管理"
                    aria-label="批量管理"
                  >
                    <ListChecks className="w-4.5 h-4.5 shrink-0" />
                  </button>

                  {/* Close Button */}
                  <button
                    id="vault-close-btn"
                    onClick={onClose}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-stone-200/60 dark:hover:bg-slate-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              // Batch Mode Active Header
              <div className="w-full flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={handleToggleSelectAll}
                    className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center transition-all duration-200 shrink-0 ${
                      selectedWords.size === filteredWords.length && filteredWords.length > 0
                        ? 'bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-white dark:text-stone-950 shadow-xs scale-105'
                        : selectedWords.size > 0
                        ? 'bg-stone-900/12 dark:bg-white/15 border-stone-900 dark:border-stone-100 text-stone-900 dark:text-stone-100'
                        : 'border-stone-300 dark:border-slate-600 bg-stone-100/70 dark:bg-slate-800/80 hover:border-stone-400'
                    }`}
                    title="全选 / 取消全选"
                  >
                    {selectedWords.size === filteredWords.length && filteredWords.length > 0 ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : selectedWords.size > 0 ? (
                      <div className="w-2 h-0.5 bg-stone-900 dark:bg-stone-100 rounded-full" />
                    ) : null}
                  </button>

                  <div className="min-w-0">
                    <h3 className="font-sans-ui text-sm font-semibold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                      已选择 <span className="text-stone-900 dark:text-stone-100 font-bold text-base font-mono tabular-nums">{selectedWords.size}</span> 项
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleToggleSelectAll}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200/80 transition-colors whitespace-nowrap"
                  >
                    {selectedWords.size === filteredWords.length && filteredWords.length > 0 ? '取消全选' : '全选'}
                  </button>
                  <button
                    onClick={handleExitBatchMode}
                    className="px-3.5 py-1 rounded-full text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-white active:scale-95 transition-all shadow-xs whitespace-nowrap"
                  >
                    完成
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Bar & Filter Strip */}
          <div className="px-5 py-3 border-b border-stone-200/50 dark:border-slate-800/60 bg-[#FAF8F5]/80 dark:bg-[#0F1523]/80 space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索单词、释义或来源"
                className="w-full pl-10 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-[#151D2E] border border-stone-200/80 dark:border-slate-800 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-400/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Cohesive Editorial Filter Tabs */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-0.5">
              <div className="flex items-center gap-1 shrink-0">
                {[
                  {
                    id: 'DUE_REVIEW',
                    label: `待复习 ${dueWordsCount}`,
                    isDueHighlight: dueWordsCount > 0
                  },
                  { id: 'ALL', label: `全部 ${allWords?.length || 0}` },
                  { id: 'IELTS', label: '剑桥真题' },
                  { id: 'MUSIC', label: '音乐歌词' },
                  { id: 'AR', label: 'AR 实景' },
                  { id: 'MASTERED', label: `已掌握 ${masteryStats[3] || 0}` },
                  { id: 'UNMASTERED', label: `学习中 ${masteryStats[2] || 0}` },
                  { id: 'LEVEL_1', label: `已加入 ${masteryStats[1] || 0}` },
                  { id: 'LEVEL_0', label: `未收录 ${masteryStats[0] || 0}` }
                ].map((f) => {
                  const isActive = activeFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleFilterChange(f.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer tabular-nums ${
                        isActive
                          ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-950 font-semibold'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-900/[0.04] dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      {f.isDueHighlight && !isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C4845C] dark:bg-[#D89B75]" />
                      )}
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mastery Visual Mini Legend (4 States) */}
              <div className="hidden sm:flex items-center gap-2.5 shrink-0 text-[10px] text-stone-400 dark:text-stone-500 pl-2">
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xs">○</span> 未收录
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xs text-stone-700 dark:text-stone-300">⊚</span> 已加入
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xs text-[#C4845C] dark:text-[#D89B75]">⊙</span> 学习中
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xs text-stone-900 dark:text-stone-100">◉</span> 已掌握
                </span>
              </div>
            </div>
          </div>

          {/* Vocabulary Word Cards Scroll List */}
          <div
            aria-hidden={isFlashcardOpen}
            className={`flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-2.5 pb-32 ${isFlashcardOpen ? 'invisible pointer-events-none' : ''}`}
          >
            {visibleWords.length > 0 ? (
              visibleWords.map((item) => {
                const isSelected = selectedWords.has(item.word);
                const isElevated = elevatedWord === item.word;
                const mastery = (item.masteryLevel ?? (item.isStarred ? 1 : 0)) as MasteryLevel;
                const ebbinghaus = retentionMap.get(item.word) || calculateEbbinghausRetention(item);
                const isReviewedInSession = sessionReviewedWords.has(item.word);

                return (
                  <div
                    key={item.id || item.word}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '0 88px' }}
                    onMouseDown={(e) => handleTouchStart(item, e)}
                    onMouseMove={handleTouchMove}
                    onMouseUp={(e) => handleTouchEnd(item, e)}
                    onMouseLeave={() => {
                      if (longPressTimerRef.current) {
                        clearTimeout(longPressTimerRef.current);
                        longPressTimerRef.current = null;
                      }
                      touchStartPosRef.current = null;
                      isMovedRef.current = false;
                      isLongPressTriggeredRef.current = false;
                      setElevatedWord(null);
                    }}
                    onTouchStart={(e) => handleTouchStart(item, e)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={(e) => handleTouchEnd(item, e)}
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={(e) => {
                      const target = e.target as HTMLElement | null;
                      if (target && target.closest('button, [role="button"], input, a')) {
                        return;
                      }
                      // Already handled by touchend/mouseup handler
                      if (Date.now() - lastPointerEndRef.current < 700) {
                        return;
                      }
                      if (isBatchMode) {
                        toggleSelectWord(item.word);
                      } else {
                        openWordDetail(item, null, 'fullscreen');
                      }
                    }}
                    className={`relative p-3.5 sm:p-4 rounded-2xl transition-[transform,background-color,border-color] duration-150 cursor-pointer select-none flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-stone-900/[0.04] dark:bg-white/[0.07] border border-stone-900/45 dark:border-stone-200/45 shadow-xs ring-1 ring-stone-900/15 dark:ring-white/15'
                        : 'bg-white dark:bg-[#151D2E] border border-stone-200/80 dark:border-slate-800/90 hover:border-stone-300 dark:hover:border-slate-700 shadow-2xs'
                    } ${isElevated ? 'scale-[1.015] shadow-lg ring-2 ring-stone-900 dark:ring-stone-100' : 'active:scale-[0.99]'}`}
                  >
                    {/* Left: Refined Apple-Style Circular Checkbox for Batch Mode */}
                    {isBatchMode && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectWord(item.word);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="shrink-0 animate-in zoom-in-75 duration-150 py-0.5"
                      >
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? 'bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-white dark:text-stone-950 shadow-xs scale-105'
                              : 'border-stone-300 dark:border-slate-600 bg-stone-100/60 dark:bg-slate-800/60 hover:border-stone-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    )}

                    {/* Card Center Info — Zero-Pill Editorial Typography */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <h4 className="font-serif-luxury text-[18px] font-medium text-stone-900 dark:text-stone-100 capitalize shrink-0 max-w-[68%] truncate">
                          {item.word}
                        </h4>
                        <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500 truncate min-w-0">
                          {item.phoneticUk || `/${item.word}/`}
                        </span>
                      </div>

                      <p className="text-[13px] text-stone-700 dark:text-stone-300 mt-0.5 font-normal line-clamp-1">
                        {item.definitionCn}
                      </p>

                      {/* Quiet Unboxed Inline Metadata Row */}
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-stone-400 dark:text-stone-500 min-w-0 overflow-hidden">
                        <span className="font-mono italic text-stone-500 dark:text-stone-400 shrink-0">
                          {formatPartOfSpeech(item.partOfSpeech, item.word).split(' ')[0]}
                        </span>

                        <span aria-hidden="true" className="opacity-45 shrink-0">·</span>

                        {isReviewedInSession ? (
                          <span className="font-mono tabular-nums font-medium text-stone-800 dark:text-stone-200 shrink-0">
                            已打卡 100%
                          </span>
                        ) : ebbinghaus.isDue ? (
                          <span className="font-mono tabular-nums font-medium text-[#B86E42] dark:text-[#E0A378] shrink-0">
                            需复习 {ebbinghaus.retentionScore}%
                          </span>
                        ) : mastery === 3 ? (
                          <span className="font-mono tabular-nums text-stone-700 dark:text-stone-300 shrink-0">
                            稳固 {ebbinghaus.retentionScore}%
                          </span>
                        ) : (
                          <span className="font-mono tabular-nums text-stone-500 dark:text-stone-400 shrink-0">
                            留存 {ebbinghaus.retentionScore}%
                          </span>
                        )}

                        {item.sourceContext && (
                          <>
                            <span aria-hidden="true" className="opacity-45 shrink-0">·</span>
                            <span className="truncate">{item.sourceContext}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Card Right Action Strip (Compact Checkoff + Audio + 4-Tier Mastery Indicator) */}
                    <div 
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      {/* One-Tap Spaced Review Checkoff Button (if Due) or Checked State */}
                      {isReviewedInSession ? (
                        <div
                          className="p-1.5 rounded-lg bg-stone-900/[0.06] dark:bg-white/[0.1] text-stone-800 dark:text-stone-200 flex items-center justify-center"
                          title="今日已完成复习打卡"
                          aria-label="今日已完成复习打卡"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : ebbinghaus.isDue ? (
                        <button
                          type="button"
                          onClick={(e) => handleMarkReviewed(e, item)}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-[#C4845C]/10 hover:bg-[#C4845C] text-[#A8623B] dark:text-[#E0A378] hover:text-white dark:hover:text-stone-950 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                          title="记录今日复习打卡"
                          aria-label="记录今日复习打卡"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      ) : null}

                      {/* Audio Pronunciation Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakWord(item.word, 'en-GB');
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 active:scale-95 transition-colors"
                        title="朗读发音 (UK)"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      {/* 4-Tier Scenario-Driven Mastery Ring Indicator */}
                      <div 
                        className="relative flex items-center justify-center p-1"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                      >
                        <MasteryBadge
                          level={mastery}
                          size={28}
                          interactive={true}
                          onClick={(e) => {
                            e?.stopPropagation();
                            handleToggleMastery(item);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 px-4 text-stone-400 dark:text-stone-500">
                <BookOpen className="w-10 h-10 mx-auto stroke-1 text-stone-300 dark:text-stone-600 mb-2" />
                <p className="text-sm font-medium">未找到符合条件的词汇</p>
                <p className="text-xs mt-1">
                  可在听歌歌词、AR 空间或雅思阅读中点击生词即刻收录
                </p>
              </div>
            )}
          </div>

          {/* Floating Aesthetic Glass Batch Action Dock */}
          <AnimatePresence>
            {isBatchMode && (
              <motion.div
                initial={{ y: 80, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 350 } }}
                exit={{ y: 80, opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
                className="absolute bottom-5 left-3.5 right-3.5 z-40 bg-white/[0.98] dark:bg-[#151D2E]/[0.98] border border-stone-200/90 dark:border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)] flex flex-col gap-2"
              >
                {/* Micro Status Hint */}
                <div className="flex items-center px-1 text-[11px] text-stone-500 dark:text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-900 dark:bg-stone-100" />
                    <span className="tabular-nums">
                      已选 <strong className="text-stone-900 dark:text-stone-100 font-semibold">{selectedWords.size}</strong> 词
                    </span>
                  </div>
                </div>

                {/* 5 Refined Action Buttons (Aligned with 4-Tier Mastery System) */}
                <div className="grid grid-cols-5 gap-1.5">
                  {/* 1. Match Cambridge IELTS Official Reading Passage */}
                  <button
                    id="batch-generate-ielts-btn"
                    onClick={handleBatchGenerateIELTS}
                    disabled={selectedWords.size === 0}
                    className="py-2 px-1 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 text-white text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 disabled:opacity-35 disabled:pointer-events-none"
                    title="根据所选生词匹配剑雅真题"
                  >
                    <BookOpen className="w-3.5 h-3.5 opacity-85" />
                    <span className="tracking-tight text-[10px]">真题匹配</span>
                  </button>

                  {/* 2. Mark Learning (Level 2) */}
                  <button
                    id="batch-mark-learning-btn"
                    onClick={() => handleBatchSetMastery(2)}
                    disabled={selectedWords.size === 0}
                    className="py-2 px-1 rounded-xl bg-[#C4845C]/10 dark:bg-[#D89B75]/15 text-[#A8623B] dark:text-[#E0A378] hover:bg-[#C4845C]/18 text-xs font-medium flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 disabled:opacity-35 disabled:pointer-events-none"
                    title="批量标记为学习中"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="tracking-tight text-[10px]">标学习中</span>
                  </button>

                  {/* 3. Mark Mastered (Level 3) */}
                  <button
                    id="batch-mark-mastered-btn"
                    onClick={() => handleBatchSetMastery(3)}
                    disabled={selectedWords.size === 0}
                    className="py-2 px-1 rounded-xl bg-stone-900/[0.06] dark:bg-white/[0.1] text-stone-800 dark:text-stone-200 hover:bg-stone-900/[0.12] dark:hover:bg-white/[0.16] text-xs font-medium flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 disabled:opacity-35 disabled:pointer-events-none"
                    title="批量标记为已掌握"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="tracking-tight text-[10px]">标已掌握</span>
                  </button>

                  {/* 4. Batch Add Tag */}
                  <button
                    id="batch-add-tags-btn"
                    onClick={() => setIsTagModalOpen(true)}
                    disabled={selectedWords.size === 0}
                    className="py-2 px-1 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200/80 text-xs font-medium flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 disabled:opacity-35 disabled:pointer-events-none"
                    title="批量添加标签"
                  >
                    <Tag className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                    <span className="tracking-tight text-[10px]">加标签</span>
                  </button>

                  {/* 5. Batch Delete */}
                  <button
                    id="batch-delete-btn"
                    onClick={handleBatchDelete}
                    disabled={selectedWords.size === 0}
                    className="py-2 px-1 rounded-xl bg-rose-500/8 dark:bg-rose-500/12 text-rose-600 dark:text-rose-400 hover:bg-rose-500/14 text-xs font-medium flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 disabled:opacity-35 disabled:pointer-events-none"
                    title="从生词本中批量移除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="tracking-tight text-[10px]">移除</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sub-modal: Batch Tag Selector Popover */}
          {isTagModalOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/65 animate-in fade-in duration-150">
              <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#151D2E] border border-stone-200 dark:border-slate-700 p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                    <h4 className="font-serif-luxury text-base font-semibold text-stone-900 dark:text-stone-100">
                      为 {selectedWords.size} 个生词批量添加标签
                    </h4>
                  </div>
                  <button
                    onClick={() => setIsTagModalOpen(false)}
                    className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Preset Tags Grid */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-stone-400">快速推荐标签</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleApplyBatchTag(tag)}
                        className="px-2.5 py-1 rounded-full text-xs bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-900 hover:text-white dark:hover:bg-stone-100 dark:hover:text-stone-950 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Tag Input */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-mono text-stone-400">自定义新标签</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      placeholder="输入标签名称 (如: Topic 3, Daily Talk)..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customTagInput.trim()) {
                          handleApplyBatchTag(customTagInput);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleApplyBatchTag(customTagInput)}
                      disabled={!customTagInput.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-950 text-xs font-semibold disabled:opacity-40 transition-all shadow-xs"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Editorial Stacked Index-Card Flashcard Review Overlay */}
          <AnimatePresence>
            {isFlashcardOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 z-[60] flex flex-col bg-[#F5F1E9] dark:bg-[#0C1017] px-5 pb-5 pt-[var(--android-safe-top,max(3.25rem,calc(env(safe-area-inset-top,44px)+0.85rem)))] select-none overflow-hidden"
              >
                {/* Soft Editorial Ambient Warmth */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-80 dark:opacity-35"
                  style={{
                    background:
                      'radial-gradient(circle at 18% 12%, rgba(235, 218, 198, 0.55) 0%, transparent 55%), radial-gradient(circle at 84% 88%, rgba(212, 222, 215, 0.48) 0%, transparent 55%)'
                  }}
                />

                {/* Minimalist Top Bar: Close / Progress Title / Detail Trigger */}
                <div className="relative z-10 flex items-center justify-between pb-3">
                  <button
                    type="button"
                    aria-label="关闭闪卡复习"
                    onClick={() => setIsFlashcardOpen(false)}
                    className="w-9 h-9 rounded-full bg-white/75 hover:bg-white dark:bg-white/[0.08] dark:hover:bg-white/[0.14] border border-stone-900/[0.06] dark:border-white/[0.08] text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-800 dark:text-stone-100 tabular-nums">
                    <span>语境闪卡</span>
                    {flashcardIndex < flashcardDeck.length && (
                      <>
                        <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">·</span>
                        <span className="font-mono text-xs text-stone-500 dark:text-stone-400">
                          {flashcardIndex + 1} / {flashcardDeck.length}
                        </span>
                      </>
                    )}
                  </div>

                  {flashcardIndex < flashcardDeck.length ? (
                    <button
                      type="button"
                      onClick={() => {
                        const card = flashcardDeck[flashcardIndex];
                        if (card) {
                          openWordDetail(card, null, 'fullscreen');
                        }
                      }}
                      className="h-9 px-2.5 rounded-full text-xs font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-900/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      详情
                    </button>
                  ) : (
                    <div className="w-9" />
                  )}
                </div>

                {/* Hairline Progress Indicator */}
                <div className="relative z-10 w-full h-[2px] bg-stone-900/[0.08] dark:bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-stone-900 dark:bg-stone-100 transition-all duration-300 ease-out"
                    style={{
                      width: `${
                        flashcardDeck.length > 0
                          ? Math.min(100, Math.round(((flashcardIndex + 1) / flashcardDeck.length) * 100))
                          : 100
                      }%`
                    }}
                  />
                </div>

                {/* Main Stacked Index Card or Completion Screen */}
                {flashcardIndex < flashcardDeck.length ? (
                  (() => {
                    const currentCard = flashcardDeck[flashcardIndex];
                    const mastery = (currentCard.masteryLevel ?? (currentCard.isStarred ? 1 : 0)) as MasteryLevel;
                    const primaryExample = currentCard.examples?.[0];
                    const escapedTarget = currentCard.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const highlightParts = primaryExample?.en
                      ? primaryExample.en.split(new RegExp(`(${escapedTarget}[a-z]*)`, 'gi'))
                      : [];
                    return (
                      <div className="relative z-10 flex-1 flex flex-col justify-between pt-5 pb-1 min-h-0">
                        {/* Physical 3-Layer Stacked Index Card Deck */}
                        <div className="flex-1 relative flex flex-col min-h-0 mb-6">
                          {/* Depth Layer 3 (Bottom-most physical card) */}
                          {flashcardIndex + 2 < flashcardDeck.length && (
                            <div className="absolute inset-x-7 top-4 -bottom-3.5 rounded-[28px] bg-[#FAF8F3]/75 dark:bg-[#111827]/70 border border-stone-900/[0.06] dark:border-white/[0.06] pointer-events-none transition-all" />
                          )}
                          {/* Depth Layer 2 (Middle physical card) */}
                          {flashcardIndex + 1 < flashcardDeck.length && (
                            <div className="absolute inset-x-3.5 top-2 -bottom-2 rounded-[28px] bg-[#FDFCF9]/92 dark:bg-[#141D2E]/90 border border-stone-900/[0.07] dark:border-white/[0.09] shadow-[0_12px_28px_rgba(28,25,23,0.06)] dark:shadow-[0_14px_30px_rgba(0,0,0,0.4)] pointer-events-none transition-all" />
                          )}

                          <AnimatePresence mode="wait" initial={false} custom={flashcardDirection}>
                            <motion.div
                              key={currentCard.word}
                              custom={flashcardDirection}
                              initial={{ opacity: 0, x: flashcardDirection * 28, scale: 0.985 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, x: flashcardDirection * -28, scale: 0.985 }}
                              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                              drag="x"
                              dragConstraints={{ left: 0, right: 0 }}
                              dragElastic={0.42}
                              onDragStart={() => {
                                isCardSwipingRef.current = true;
                              }}
                              onDragEnd={(_, info) => {
                                const swipeThreshold = 45;
                                const velocityThreshold = 280;
                                if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
                                  if (flashcardIndex < flashcardDeck.length - 1) {
                                    handleNavigateFlashcard(1);
                                  }
                                } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
                                  if (flashcardIndex > 0) {
                                    handleNavigateFlashcard(-1);
                                  }
                                }
                                setTimeout(() => {
                                  isCardSwipingRef.current = false;
                                }, 60);
                              }}
                              onClick={() => {
                                if (isCardSwipingRef.current) return;
                                setIsFlashcardFlipped(prev => !prev);
                              }}
                              className="flex-1 rounded-[28px] bg-gradient-to-b from-white to-[#FCFBF8] dark:from-[#161F31] dark:to-[#121A2A] border border-stone-900/[0.07] dark:border-white/[0.08] shadow-[0_22px_50px_-12px_rgba(28,25,23,0.11)] dark:shadow-[0_24px_54px_-12px_rgba(0,0,0,0.55)] px-6 py-5 flex flex-col justify-between cursor-grab active:cursor-grabbing relative overflow-y-auto no-scrollbar touch-pan-y z-10"
                            >
                              {/* Top Quiet Editorial Metadata Kicker */}
                              <div className="flex items-center justify-between gap-2 text-[11.5px] text-stone-500 dark:text-stone-400">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-mono font-medium text-stone-600 dark:text-stone-300 tabular-nums shrink-0">
                                    No.{String(flashcardIndex + 1).padStart(2, '0')}
                                  </span>
                                  {currentCard.sourceContext && (
                                    <>
                                      <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">·</span>
                                      <span className="truncate">{currentCard.sourceContext}</span>
                                    </>
                                  )}
                                  {currentCard.categories?.[0] && (
                                    <>
                                      <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">·</span>
                                      <span className="text-amber-700/90 dark:text-amber-400/90 font-medium shrink-0">
                                        {currentCard.categories[0]}
                                      </span>
                                    </>
                                  )}
                                </div>

                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="shrink-0"
                                >
                                  <MasteryBadge level={mastery} size={22} interactive={false} />
                                </div>
                              </div>

                              {/* Editorial Center: Grand Serif Headword + Phonetic + Context Memory */}
                              <div className="my-auto py-4 flex flex-col">
                                <div className="text-center space-y-2.5 pb-5">
                                  <h2 className="font-serif-luxury text-[40px] leading-[1.12] font-semibold text-stone-900 dark:text-stone-50 tracking-tight break-words">
                                    {currentCard.word}
                                  </h2>

                                  <div className="flex items-center justify-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                                    <span className="font-serif-luxury italic text-stone-600 dark:text-stone-300">
                                      {formatPartOfSpeech(currentCard.partOfSpeech, currentCard.word)}
                                    </span>
                                    <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">·</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        speakWord(currentCard.word, 'en-GB');
                                      }}
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-stone-900/[0.05] dark:hover:bg-white/[0.08] text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
                                    >
                                      <span className="font-mono text-[12.5px]">
                                        {currentCard.phoneticUk || `/${currentCard.word}/`}
                                      </span>
                                      <Volume2 className="w-3.5 h-3.5 text-stone-700 dark:text-stone-200" />
                                    </button>
                                  </div>
                                </div>

                                {/* Clean Hairline Divider + Contextual Quote (Zero nested box) */}
                                {primaryExample && (
                                  <div className="border-t border-stone-900/[0.07] dark:border-white/[0.08] pt-4 space-y-2 text-left">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10.5px] font-semibold tracking-[0.14em] text-stone-400 dark:text-stone-500 uppercase">
                                        原文语境
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          speakWord(primaryExample.en, 'en-GB');
                                        }}
                                        className="p-1.5 -mr-1.5 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-900/[0.05] dark:hover:bg-white/[0.08] transition-colors shrink-0 cursor-pointer"
                                        title="朗读例句"
                                      >
                                        <Volume2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <p className="font-serif-luxury text-[15.5px] leading-[1.68] text-stone-700 dark:text-stone-200">
                                      “
                                      {highlightParts.map((part, pIdx) =>
                                        part.toLowerCase().startsWith(currentCard.word.toLowerCase()) ? (
                                          <strong
                                            key={pIdx}
                                            className="font-semibold text-stone-950 dark:text-white border-b-[1.5px] border-amber-700 dark:border-amber-400 pb-[1px]"
                                          >
                                            {part}
                                          </strong>
                                        ) : (
                                          <React.Fragment key={pIdx}>{part}</React.Fragment>
                                        )
                                      )}
                                      ”
                                    </p>
                                    {isFlashcardFlipped && primaryExample.cn && (
                                      <motion.p
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.16 }}
                                        className="text-xs leading-relaxed text-stone-500 dark:text-stone-400 pt-1"
                                      >
                                        {primaryExample.cn}
                                      </motion.p>
                                    )}
                                  </div>
                                )}

                                {/* Revealed Definition (Seamless on paper — zero dashed wireframe!) */}
                                <AnimatePresence mode="wait" initial={false}>
                                  {isFlashcardFlipped && (
                                    <motion.div
                                      key="meaning-revealed"
                                      initial={{ opacity: 0, y: 8 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -4 }}
                                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                      className="mt-4 pt-4 border-t border-stone-900/[0.07] dark:border-white/[0.08] text-center space-y-1.5"
                                    >
                                      <p className="text-[17px] font-semibold text-stone-900 dark:text-stone-50 leading-snug">
                                        {currentCard.definitionCn}
                                      </p>
                                      {currentCard.definition && (
                                        <p className="text-xs text-stone-500 dark:text-stone-400 italic leading-relaxed">
                                          {currentCard.definition}
                                        </p>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Quiet Editorial Card Footer: Prev / Flip Hint / Next */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-between pt-2 text-[11.5px] text-stone-400 dark:text-stone-500"
                              >
                                <button
                                  type="button"
                                  aria-label="上一词"
                                  onClick={() => handleNavigateFlashcard(-1)}
                                  disabled={flashcardIndex === 0}
                                  className="w-8 h-8 -ml-1.5 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-900/[0.04] dark:hover:bg-white/[0.06] disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setIsFlashcardFlipped(prev => !prev)}
                                  className="px-2 py-1 text-[11.5px] text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300 transition-colors cursor-pointer"
                                >
                                  {isFlashcardFlipped ? '轻触收起释义' : '轻触卡片任意处查看释义'}
                                </button>

                                <button
                                  type="button"
                                  aria-label="下一词"
                                  onClick={() => handleNavigateFlashcard(1)}
                                  disabled={flashcardIndex >= flashcardDeck.length - 1}
                                  className="w-8 h-8 -mr-1.5 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-900/[0.04] dark:hover:bg-white/[0.06] disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          </AnimatePresence>
                        </div>

                        {/* Tactile 3-Tier Spaced-Repetition Action Bar */}
                        <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-2.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleFlashcardDecision(1)}
                            className="py-2.5 px-2 rounded-2xl bg-white/85 hover:bg-white dark:bg-white/[0.07] dark:hover:bg-white/[0.12] border border-stone-900/[0.08] dark:border-white/[0.08] text-center transition-all active:scale-[0.97] cursor-pointer"
                          >
                            <span className="block text-[13px] font-semibold text-stone-900 dark:text-stone-100 leading-tight">
                              生疏
                            </span>
                            <span className="block text-[10.5px] text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums">
                              10 分钟后
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleFlashcardDecision(2)}
                            className="py-2.5 px-2 rounded-2xl bg-white/85 hover:bg-white dark:bg-white/[0.07] dark:hover:bg-white/[0.12] border border-stone-900/[0.08] dark:border-white/[0.08] text-center transition-all active:scale-[0.97] cursor-pointer"
                          >
                            <span className="block text-[13px] font-semibold text-stone-900 dark:text-stone-100 leading-tight">
                              模糊
                            </span>
                            <span className="block text-[10.5px] text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums">
                              1 天后
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleFlashcardDecision(3)}
                            className="py-2.5 px-2 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white border border-stone-900 dark:border-stone-100 text-center shadow-[0_8px_20px_-6px_rgba(28,25,23,0.28)] dark:shadow-none transition-all active:scale-[0.97] cursor-pointer"
                          >
                            <span className="block text-[13px] font-semibold text-stone-50 dark:text-stone-950 leading-tight">
                              已掌握
                            </span>
                            <span className="block text-[10.5px] text-stone-300 dark:text-stone-600 mt-0.5 tabular-nums">
                              7 天后复习
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* Editorial Session Complete State */
                  <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/90 dark:bg-white/[0.08] border border-stone-900/[0.07] dark:border-white/[0.1] shadow-sm flex items-center justify-center text-stone-900 dark:text-stone-100">
                      <CheckCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif-luxury text-2xl font-semibold text-stone-900 dark:text-stone-100">
                        本轮语境复习完成
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        记忆曲线已同步更新
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                      <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#151D2E] border border-stone-900/[0.07] dark:border-white/[0.08]">
                        <span className="text-xs text-stone-500 dark:text-stone-400 block">待强化</span>
                        <span className="font-mono text-2xl font-bold text-stone-800 dark:text-stone-200 tabular-nums mt-1 block">
                          {flashcardStats.learning}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#151D2E] border border-stone-900/[0.07] dark:border-white/[0.08]">
                        <span className="text-xs text-stone-500 dark:text-stone-400 block">已掌握</span>
                        <span className="font-mono text-2xl font-bold text-stone-950 dark:text-white tabular-nums mt-1 block">
                          {flashcardStats.mastered}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFlashcardOpen(false)}
                      className="px-7 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-stone-50 dark:text-stone-950 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
                    >
                      返回生词本
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
    </div>
  );
};
