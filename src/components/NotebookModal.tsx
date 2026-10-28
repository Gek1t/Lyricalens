import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, cycleWordMastery, setWordMastery, bulkUpdateMastery, bulkAddTags, bulkDeleteWords, recordWordReview } from '../db';
import { WordItem, MasteryLevel } from '../types';
import { useAppStore } from '../store/useAppStore';
import { speakWord } from '../utils/audioEngine';
import { MasteryBadge, MASTERY_CONFIG } from './MasteryBadge';
import { formatPartOfSpeech } from '../utils/lyricDictionary';
import { calculateEbbinghausRetention } from '../utils/vocabEngine';
import {
  Search,
  Volume2,
  Sparkles,
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
  Clock,
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
  
  // Sync initial filter from store when opened
  useEffect(() => {
    if (isOpen) {
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
  const activeLongPressWordRef = useRef<string | null>(null);
  const [elevatedWord, setElevatedWord] = useState<string | null>(null);

  const openWordDetail = useAppStore(s => s.openWordDetail);
  const setActiveSpace = useAppStore(s => s.setActiveSpace);
  const generateIELTSTestFromWords = useAppStore(s => s.generateIELTSTestFromWords);
  const showToast = useAppStore(s => s.showToast);

  // Live Dexie database query
  const allWords = useLiveQuery(
    () => db.words.orderBy('addedTimestamp').reverse().toArray(),
    []
  );

  // Spaced Repetition Due Words Calculation
  const dueWordsCount = useMemo(() => {
    if (!allWords) return 0;
    const now = Date.now();
    return allWords.filter(w => calculateEbbinghausRetention(w, now).isDue).length;
  }, [allWords]);

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
    if (!allWords) return [];
    const now = Date.now();
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
        const retention = calculateEbbinghausRetention(w, now);
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
  }, [allWords, searchTerm, activeFilter, sessionReviewedWords, sessionModifiedWords]);

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
      setTimeout(() => speakWord(deck[0].word, 'en-GB'), 180);
    }
  };

  useEffect(() => {
    if (isOpen && notebookAutoFlashcard && allWords && allWords.length > 0 && !isFlashcardOpen) {
      handleStartFlashcardReview();
    }
  }, [isOpen, notebookAutoFlashcard, allWords]);

  const handleNavigateFlashcard = (dir: -1 | 1) => {
    const nextIdx = flashcardIndex + dir;
    if (nextIdx < 0 || nextIdx >= flashcardDeck.length) return;
    setFlashcardDirection(dir);
    setIsFlashcardFlipped(false);
    setFlashcardIndex(nextIdx);
    if (flashcardDeck[nextIdx]) {
      setTimeout(() => speakWord(flashcardDeck[nextIdx].word, 'en-GB'), 140);
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

  const handleFlashcardDecision = async (targetLevel: 2 | 3) => {
    const currentCard = flashcardDeck[flashcardIndex];
    if (!currentCard) return;

    const isMastered = targetLevel === 3;
    try {
      await recordWordReview(currentCard.word, isMastered);
      await setWordMastery(currentCard.word, targetLevel);
      setSessionReviewedWords(prev => new Set(prev).add(currentCard.word));
      setSessionModifiedWords(prev => new Set(prev).add(currentCard.word));
    } catch (e) {
      console.error(e);
    }

    setFlashcardStats(prev => ({
      mastered: prev.mastered + (isMastered ? 1 : 0),
      learning: prev.learning + (isMastered ? 0 : 1)
    }));

    const nextIdx = flashcardIndex + 1;
    setFlashcardDirection(1);
    setIsFlashcardFlipped(false);
    setFlashcardIndex(nextIdx);

    if (nextIdx < flashcardDeck.length) {
      setTimeout(() => speakWord(flashcardDeck[nextIdx].word, 'en-GB'), 160);
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

    // If user scrolled > 8px, cancel long-press
    if (distance > 8 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = (item: WordItem, e?: React.TouchEvent | React.MouseEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (e) {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, [role="button"], input, a')) {
        touchStartPosRef.current = null;
        return;
      }
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

    // Normal Tap Action on Card
    if (isBatchMode) {
      toggleSelectWord(item.word);
    } else {
      openWordDetail(item);
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="notebook-vault-modal"
          initial={{ y: '100%', opacity: 0.6 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: { type: 'spring', damping: 30, stiffness: 320, mass: 0.85 }
          }}
          exit={{
            y: '100%',
            opacity: 0,
            transition: { duration: 0.24, ease: [0.32, 0.72, 0, 1] }
          }}
          className="absolute inset-0 z-50 flex flex-col bg-[#FAF8F5] dark:bg-[#0F1523] text-stone-900 dark:text-stone-100 select-none overflow-hidden"
        >
          {/* Top Header Bar */}
          <div className="relative w-full px-5 pt-11 pb-3.5 border-b border-stone-200/70 dark:border-slate-800/80 flex items-center justify-between bg-white/80 dark:bg-[#151D2E]/80 backdrop-blur-md z-30">
            {!isBatchMode ? (
              // Normal Header
              <>
                <div className="flex items-center shrink-0">
                  <div>
                    <h2 className="font-serif-luxury text-xl font-semibold text-stone-900 dark:text-stone-50 leading-tight whitespace-nowrap">
                      Vocabulary Vault
                    </h2>
                    <span className="text-[10px] font-sans text-stone-500 dark:text-stone-400 block whitespace-nowrap">
                      生词本中枢 · {allWords?.length || 0} 词收录
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Flashcard Rapid Review Button */}
                  <button
                    type="button"
                    onClick={handleStartFlashcardReview}
                    className="px-3 py-1.5 text-white bg-[#516050] hover:bg-[#3F4C3E] dark:bg-[#8FB996] dark:text-stone-950 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all active:scale-95 shrink-0 cursor-pointer shadow-xs"
                    title="艾宾浩斯闪卡速刷复习"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200 dark:text-stone-900 shrink-0" />
                    <span>闪卡速刷</span>
                    {dueWordsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-400/25 dark:bg-stone-900/20 text-amber-100 dark:text-stone-950 font-mono text-[10px] font-bold tabular-nums">
                        {dueWordsCount}
                      </span>
                    )}
                  </button>

                  {/* Enter Batch Mode Button */}
                  <button
                    id="vault-enter-batch-mode-btn"
                    onClick={() => setIsBatchMode(true)}
                    className="p-2 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-slate-800/60 rounded-full flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer"
                    title="多选批量操作"
                    aria-label="多选批量操作"
                  >
                    <ListChecks className="w-4.5 h-4.5 text-[#516050] dark:text-[#8FB996] shrink-0" />
                  </button>

                  {/* Close Button */}
                  <button
                    id="vault-close-btn"
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-stone-200/60 dark:hover:bg-slate-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors shrink-0"
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
                        ? 'bg-[#516050] dark:bg-[#8FB996] border-[#516050] dark:border-[#8FB996] text-white dark:text-stone-950 shadow-xs scale-105'
                        : selectedWords.size > 0
                        ? 'bg-[#516050]/15 dark:bg-[#8FB996]/20 border-[#516050] dark:border-[#8FB996] text-[#516050] dark:text-[#8FB996]'
                        : 'border-stone-300 dark:border-slate-600 bg-stone-100/70 dark:bg-slate-800/80 hover:border-stone-400'
                    }`}
                    title="全选 / 取消全选"
                  >
                    {selectedWords.size === filteredWords.length && filteredWords.length > 0 ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : selectedWords.size > 0 ? (
                      <div className="w-2 h-0.5 bg-[#516050] dark:bg-[#8FB996] rounded-full" />
                    ) : null}
                  </button>

                  <div className="min-w-0">
                    <h3 className="font-sans-ui text-sm font-semibold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                      已选择 <span className="text-[#516050] dark:text-[#8FB996] font-bold text-base font-mono tabular-nums">{selectedWords.size}</span> 项
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
                    className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#516050] dark:bg-[#8FB996] text-white dark:text-stone-950 hover:bg-[#3F4C3E] dark:hover:bg-[#7AA881] active:scale-95 transition-all shadow-xs whitespace-nowrap"
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
                placeholder="搜索生词、中文释义、标签或收录语境..."
                className="w-full pl-10 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-[#151D2E] border border-stone-200/80 dark:border-slate-800 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-[#516050] shadow-2xs"
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

            {/* Filter Pills & Mastery Breakdown Bar */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-0.5">
              <div className="flex items-center gap-1.5 shrink-0">
                {[
                  {
                    id: 'DUE_REVIEW',
                    label: `待复习 (${dueWordsCount})`,
                    isDueHighlight: dueWordsCount > 0
                  },
                  { id: 'ALL', label: `全部 (${allWords?.length || 0})` },
                  { id: 'IELTS', label: `剑桥真题` },
                  { id: 'MUSIC', label: `音乐歌词` },
                  { id: 'AR', label: `AR 实景` },
                  { id: 'MASTERED', label: `已掌握 (${masteryStats[3] || 0})` },
                  { id: 'UNMASTERED', label: `学习中 (${masteryStats[2] || 0})` },
                  { id: 'LEVEL_1', label: `已加入 (${masteryStats[1] || 0})` },
                  { id: 'LEVEL_0', label: `未收录 (${masteryStats[0] || 0})` }
                ].map((f) => {
                  const isActive = activeFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleFilterChange(f.id as any)}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? f.id === 'DUE_REVIEW'
                            ? 'bg-amber-500 text-white shadow-2xs font-semibold'
                            : 'bg-[#516050] text-white shadow-2xs font-semibold'
                          : f.isDueHighlight
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                          : 'bg-white dark:bg-[#151D2E] text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200/60 dark:border-slate-800'
                      }`}
                    >
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mastery Visual Mini Legend (4 States) */}
              <div className="hidden sm:flex items-center gap-2.5 shrink-0 text-[10px] text-stone-500 dark:text-stone-400 pl-2">
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xs">○</span> 未收录
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xs text-[#516050] dark:text-[#8FB996]">⊚</span> 已加入
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xs text-[#8C7A5B] dark:text-amber-400">⊙</span> 学习中
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xs text-[#516050] dark:text-[#8FB996]">◉</span> 已掌握
                </span>
              </div>
            </div>
          </div>

          {/* Vocabulary Word Cards Scroll List */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-2.5 pb-32">
            <AnimatePresence mode="popLayout">
              {filteredWords.length > 0 ? (
                filteredWords.map((item) => {
                  const isSelected = selectedWords.has(item.word);
                  const isElevated = elevatedWord === item.word;
                  const mastery = (item.masteryLevel ?? (item.isStarred ? 1 : 0)) as MasteryLevel;
                  const ebbinghaus = calculateEbbinghausRetention(item);
                  const isReviewedInSession = sessionReviewedWords.has(item.word);

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.92,
                        y: -8,
                        transition: { duration: 0.24, ease: [0.32, 0.72, 0, 1] }
                      }}
                      transition={{
                        layout: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
                        duration: 0.2
                      }}
                      key={item.id || item.word}
                      onMouseDown={(e) => handleTouchStart(item, e)}
                      onMouseMove={handleTouchMove}
                      onMouseUp={(e) => handleTouchEnd(item, e)}
                      onMouseLeave={() => {
                        if (longPressTimerRef.current) {
                          clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = null;
                        }
                      }}
                      onTouchStart={(e) => handleTouchStart(item, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={(e) => handleTouchEnd(item, e)}
                      onContextMenu={(e) => e.preventDefault()}
                      className={`relative p-3.5 sm:p-4 rounded-2xl transition-colors duration-200 cursor-pointer select-none flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#516050]/[0.05] dark:bg-[#8FB996]/[0.08] border border-[#516050]/60 dark:border-[#8FB996]/50 shadow-xs ring-1 ring-[#516050]/20 dark:ring-[#8FB996]/20'
                          : 'bg-white dark:bg-[#151D2E] border border-stone-200/80 dark:border-slate-800/90 hover:border-stone-300 dark:hover:border-slate-700 shadow-2xs'
                      } ${isElevated ? 'scale-[1.015] shadow-lg ring-2 ring-[#516050]' : 'active:scale-[0.99]'}`}
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
                                ? 'bg-[#516050] dark:bg-[#8FB996] border-[#516050] dark:border-[#8FB996] text-white dark:text-stone-950 shadow-xs scale-105'
                                : 'border-stone-300 dark:border-slate-600 bg-stone-100/60 dark:bg-slate-800/60 hover:border-stone-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      )}

                      {/* Card Center Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif-luxury text-lg sm:text-[19px] font-medium text-stone-900 dark:text-stone-100 capitalize truncate">
                            {item.word}
                          </h4>
                          <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
                            {item.phoneticUk || `/${item.word}/`}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#516050]/10 dark:bg-[#8FB996]/15 text-[#516050] dark:text-[#8FB996] border border-[#516050]/20 dark:border-[#8FB996]/30">
                            {formatPartOfSpeech(item.partOfSpeech, item.word)}
                          </span>

                          {/* Ebbinghaus Spaced Repetition Retention Badge */}
                          {isReviewedInSession ? (
                            <motion.span
                              initial={{ scale: 0.85, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                            >
                              <Check className="w-2.5 h-2.5" />
                              <span>已打卡 100%</span>
                            </motion.span>
                          ) : ebbinghaus.isDue ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>需复习 {ebbinghaus.retentionScore}%</span>
                            </span>
                          ) : mastery === 3 ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              稳固 {ebbinghaus.retentionScore}%
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                              留存 {ebbinghaus.retentionScore}%
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-700 dark:text-stone-300 mt-1 font-normal line-clamp-1">
                          {item.definitionCn}
                        </p>

                        {/* Context & Tag Badges */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {item.sourceContext && (
                            <span className="text-[9px] uppercase tracking-wider text-stone-400 dark:text-stone-500 bg-stone-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                              {item.sourceContext}
                            </span>
                          )}
                          {item.categories?.slice(0, 2).map((cat) => (
                            <span
                              key={cat}
                              className="text-[9px] font-medium text-[#516050] dark:text-[#8FB996] bg-[#516050]/10 dark:bg-[#8FB996]/15 px-2 py-0.5 rounded-md"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Right Action Strip (Audio Pronounce + Quick Review Button + 4-Tier Mastery Indicator) */}
                      <div 
                        className="flex items-center gap-1.5 sm:gap-2 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        {/* One-Tap Spaced Review Checkoff Button (if Due) or Checked State */}
                        <AnimatePresence mode="wait">
                          {isReviewedInSession ? (
                            <motion.div
                              key="done"
                              initial={{ scale: 0.85, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.85, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-medium flex items-center gap-1 shadow-2xs"
                              title="今日已完成艾宾浩斯打卡"
                            >
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="hidden sm:inline">已打卡</span>
                            </motion.div>
                          ) : ebbinghaus.isDue ? (
                            <motion.button
                              key="due-btn"
                              initial={{ scale: 0.85, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.85, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              type="button"
                              onClick={(e) => handleMarkReviewed(e, item)}
                              onMouseDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-white border border-amber-500/30 text-[10px] font-medium flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
                              title="记录今日艾宾浩斯复现打卡"
                            >
                              <CheckCheck className="w-3 h-3" />
                              <span className="hidden sm:inline">打卡</span>
                            </motion.button>
                          ) : null}
                        </AnimatePresence>

                        {/* Audio Pronunciation Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord(item.word, 'en-GB');
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400 hover:text-[#516050] dark:hover:text-[#8FB996] active:scale-95 transition-all"
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
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-center py-16 px-4 text-stone-400 dark:text-stone-500"
                >
                  <BookOpen className="w-10 h-10 mx-auto stroke-1 text-stone-300 dark:text-stone-600 mb-2" />
                  <p className="text-sm font-medium">未找到符合条件的词汇</p>
                  <p className="text-xs mt-1">
                    可在听歌歌词、AR 空间或雅思阅读中点击生词即刻收录
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Floating Aesthetic Glass Batch Action Dock */}
          <AnimatePresence>
            {isBatchMode && (
              <motion.div
                initial={{ y: 80, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 350 } }}
                exit={{ y: 80, opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
                className="absolute bottom-5 left-3.5 right-3.5 z-40 bg-white/95 dark:bg-[#151D2E]/95 backdrop-blur-2xl border border-stone-200/90 dark:border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)] flex flex-col gap-2"
              >
                {/* Micro Status Hint */}
                <div className="flex items-center px-1 text-[11px] text-stone-500 dark:text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#516050] dark:bg-[#8FB996] animate-pulse" />
                    <span>
                      已选 <strong className="text-stone-900 dark:text-stone-100 font-semibold">{selectedWords.size}</strong> 词
                    </span>
                  </div>
                </div>

                {/* 5 Refined Action Buttons (Aligned with 4-Tier Mastery System) */}
                <div className="grid grid-cols-5 gap-1.5">
                  {/* 1. 🎯 Match Cambridge IELTS Official Reading Passage */}
                  <button
                    id="batch-generate-ielts-btn"
                    onClick={handleBatchGenerateIELTS}
                    disabled={selectedWords.size === 0}
                    className="py-2 px-1 rounded-xl bg-[#516050] hover:bg-[#3F4C3E] text-white text-xs font-semibold flex flex-col items-center justify-center gap-1 shadow-sm transition-all active:scale-95 disabled:opacity-35 disabled:pointer-events-none"
                    title="根据所选生词，智能匹配命中率最高的剑雅真题"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                    <span className="tracking-tight text-[10px]">真题匹配</span>
                  </button>

                  {/* 2. ⏳ Mark Learning (Level 2 学习中) */}
                  <button
                    id="batch-mark-learning-btn"
                    onClick={() => handleBatchSetMastery(2)}
                    disabled={selectedWords.size === 0}
                    className="py-2 px-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100/80 text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-35 disabled:pointer-events-none"
                    title="批量标记为学习中 (Level 2)"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="tracking-tight text-[10px]">标学习中</span>
                  </button>

                  {/* 3. ✔ Mark Mastered (Level 3 已掌握) */}
                  <button
                    id="batch-mark-mastered-btn"
                    onClick={() => handleBatchSetMastery(3)}
                    disabled={selectedWords.size === 0}
                    className="py-2 px-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100/80 text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-35 disabled:pointer-events-none"
                    title="批量标记为已掌握 (Level 3 ✔)"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="tracking-tight text-[10px]">标已掌握</span>
                  </button>

                  {/* 4. 🏷 Batch Add Tag */}
                  <button
                    id="batch-add-tags-btn"
                    onClick={() => setIsTagModalOpen(true)}
                    disabled={selectedWords.size === 0}
                    className="py-2 px-1 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 border border-stone-200/70 dark:border-slate-700 hover:bg-stone-200/80 text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-35 disabled:pointer-events-none"
                    title="批量添加场景分类标签"
                  >
                    <Tag className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                    <span className="tracking-tight text-[10px]">加标签</span>
                  </button>

                  {/* 5. 🗑 Batch Delete */}
                  <button
                    id="batch-delete-btn"
                    onClick={handleBatchDelete}
                    disabled={selectedWords.size === 0}
                    className="py-2 px-1 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/50 hover:bg-rose-100/80 text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-35 disabled:pointer-events-none"
                    title="从生词本中批量移除"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span className="tracking-tight text-[10px]">移除</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sub-modal: Batch Tag Selector Popover */}
          {isTagModalOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#151D2E] border border-stone-200 dark:border-slate-700 p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#516050] dark:text-[#8FB996]" />
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
                        className="px-2.5 py-1 rounded-full text-xs bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-[#516050] hover:text-white dark:hover:bg-[#8FB996] dark:hover:text-stone-900 transition-colors"
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
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-[#516050]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customTagInput.trim()) {
                          handleApplyBatchTag(customTagInput);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleApplyBatchTag(customTagInput)}
                      disabled={!customTagInput.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-[#516050] hover:bg-[#3F4C3E] text-white text-xs font-semibold disabled:opacity-40 transition-all shadow-xs"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Minimalist Flashcard Rapid Flow Overlay */}
          <AnimatePresence>
            {isFlashcardOpen && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-50 flex flex-col bg-[#FAF8F5] dark:bg-[#0F1523] p-5 pt-12 select-none overflow-hidden"
              >
                {/* Minimalist Top Header */}
                <div className="flex items-center justify-between pb-3.5">
                  <h3 className="font-serif-luxury text-xl font-semibold text-stone-900 dark:text-stone-100">
                    闪卡速刷
                  </h3>
                  <div className="flex items-center gap-2.5">
                    {flashcardIndex < flashcardDeck.length && (
                      <span className="text-xs font-mono tabular-nums text-stone-500 dark:text-stone-400">
                        {flashcardIndex + 1} / {flashcardDeck.length}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsFlashcardOpen(false)}
                      className="p-2 rounded-full hover:bg-stone-200/60 dark:hover:bg-slate-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Subtle Hairline Progress Bar */}
                <div className="w-full h-1 bg-stone-200/70 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#516050] dark:bg-[#8FB996] transition-all duration-300"
                    style={{
                      width: `${
                        flashcardDeck.length > 0
                          ? Math.min(100, Math.round(((flashcardIndex + 1) / flashcardDeck.length) * 100))
                          : 100
                      }%`
                    }}
                  />
                </div>

                {/* Main Card Body or Completion Screen */}
                {flashcardIndex < flashcardDeck.length ? (
                  (() => {
                    const currentCard = flashcardDeck[flashcardIndex];
                    const mastery = (currentCard.masteryLevel ?? (currentCard.isStarred ? 1 : 0)) as MasteryLevel;
                    const primaryExample = currentCard.examples?.[0];
                    return (
                      <div className="flex-1 flex flex-col justify-between py-4 min-h-0">
                        {/* Stacked Physical Card Container */}
                        <div className="flex-1 relative flex flex-col min-h-0 pb-2">
                          {/* Back Stack Layers for Tactile Depth */}
                          {flashcardIndex + 2 < flashcardDeck.length && (
                            <div className="absolute inset-x-6 -bottom-1.5 h-6 rounded-3xl bg-white/50 dark:bg-slate-800/40 border border-stone-200/60 dark:border-slate-800/60 pointer-events-none" />
                          )}
                          {flashcardIndex + 1 < flashcardDeck.length && (
                            <div className="absolute inset-x-3 -bottom-0.5 h-6 rounded-3xl bg-white/80 dark:bg-slate-800/70 border border-stone-200/80 dark:border-slate-800 shadow-2xs pointer-events-none" />
                          )}

                          <AnimatePresence mode="wait" initial={false} custom={flashcardDirection}>
                            <motion.div
                              key={currentCard.word}
                              custom={flashcardDirection}
                              initial={{ opacity: 0, x: flashcardDirection * 48, scale: 0.98 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, x: flashcardDirection * -48, scale: 0.98 }}
                              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
                              drag="x"
                              dragConstraints={{ left: 0, right: 0 }}
                              dragElastic={0.45}
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
                              className="flex-1 rounded-3xl bg-white dark:bg-[#151D2E] border border-stone-200/90 dark:border-slate-800 shadow-[0_16px_40px_-12px_rgba(20,20,19,0.08)] p-6 flex flex-col justify-between cursor-grab active:cursor-grabbing relative overflow-y-auto touch-pan-y z-10"
                            >
                              {/* Card Top Bar: Context Source & Mastery Ring */}
                              <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-slate-800/80">
                                <div className="flex items-center gap-2 min-w-0 text-xs text-stone-500 dark:text-stone-400">
                                  <span className="font-mono text-[11px] text-[#516050] dark:text-[#8FB996] font-semibold">
                                    No.{String(flashcardIndex + 1).padStart(2, '0')}
                                  </span>
                                  {currentCard.sourceContext && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="truncate">{currentCard.sourceContext}</span>
                                    </>
                                  )}
                                  {currentCard.categories?.[0] && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="text-[#8C7A5B] dark:text-amber-400/90 font-medium shrink-0">
                                        {currentCard.categories[0]}
                                      </span>
                                    </>
                                  )}
                                </div>

                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="shrink-0 flex items-center gap-1.5"
                                >
                                  <MasteryBadge level={mastery} size={24} interactive={false} />
                                </div>
                              </div>

                              {/* Card Hero Center: Word + Phonetic Audio + Contextual Quote + Flip Meaning */}
                              <div className="my-auto py-4 space-y-5">
                                {/* Word & Phonetic Header */}
                                <div className="text-center space-y-2.5">
                                  <h2 className="font-serif-luxury text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
                                    {currentCard.word}
                                  </h2>

                                  <div className="flex items-center justify-center gap-2.5 flex-wrap">
                                    <span className="text-xs font-mono italic text-[#516050] dark:text-[#8FB996] font-medium">
                                      {formatPartOfSpeech(currentCard.partOfSpeech, currentCard.word)}
                                    </span>
                                    <span className="text-stone-300 dark:text-slate-700" aria-hidden="true">·</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        speakWord(currentCard.word, 'en-GB');
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFE6]/90 hover:bg-[#516050] dark:bg-slate-800 text-stone-700 dark:text-stone-200 hover:text-white transition-colors text-xs cursor-pointer"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                      <span className="font-mono">{currentCard.phoneticUk || `/${currentCard.word}/`}</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Contextual Example Box (Always visible to anchor memory, expands translation on flip) */}
                                {primaryExample && (
                                  <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-900/70 border border-stone-200/70 dark:border-slate-800/90 space-y-2 text-left">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm sm:text-[15px] font-serif-luxury italic text-stone-800 dark:text-stone-200 leading-relaxed">
                                        “{primaryExample.en}”
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          speakWord(primaryExample.en, 'en-GB');
                                        }}
                                        className="p-1.5 rounded-full text-stone-400 hover:text-[#516050] hover:bg-stone-200/50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                                        title="朗读例句"
                                      >
                                        <Volume2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    {isFlashcardFlipped && primaryExample.cn && (
                                      <motion.p
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-stone-500 dark:text-stone-400 pt-1.5 border-t border-stone-200/60 dark:border-slate-800"
                                      >
                                        {primaryExample.cn}
                                      </motion.p>
                                    )}
                                  </div>
                                )}

                                {/* Revealed Meaning Section or Subtle Reveal Affordance */}
                                <AnimatePresence mode="wait" initial={false}>
                                  {isFlashcardFlipped ? (
                                    <motion.div
                                      key="meaning-revealed"
                                      initial={{ opacity: 0, y: 8 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -6 }}
                                      transition={{ duration: 0.18 }}
                                      className="p-4 rounded-2xl bg-[#516050]/[0.06] dark:bg-[#8FB996]/[0.08] border border-[#516050]/20 dark:border-[#8FB996]/20 text-center space-y-1.5"
                                    >
                                      <p className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100">
                                        {currentCard.definitionCn}
                                      </p>
                                      {currentCard.definition && (
                                        <p className="text-xs text-stone-500 dark:text-stone-400 italic leading-relaxed">
                                          {currentCard.definition}
                                        </p>
                                      )}
                                    </motion.div>
                                  ) : (
                                    <motion.div
                                      key="meaning-hidden"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="py-3 px-4 rounded-2xl border border-dashed border-stone-200 dark:border-slate-800 text-center"
                                    >
                                      <span className="text-xs text-stone-400 dark:text-stone-500">
                                        轻触卡片显现中文释义
                                      </span>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Card Bottom Navigation Bar: Prev / Dots / Next */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-slate-800/80"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleNavigateFlashcard(-1)}
                                  disabled={flashcardIndex === 0}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 disabled:opacity-30 disabled:pointer-events-none py-1 px-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                  <span>上一词</span>
                                </button>

                                <div className="flex items-center justify-center gap-1.5 max-w-[160px] overflow-hidden">
                                  {flashcardDeck.slice(0, 12).map((_, idx) => (
                                    <span
                                      key={idx}
                                      className={`h-1.5 rounded-full transition-all duration-200 ${
                                        idx === flashcardIndex
                                          ? 'w-4 bg-[#516050] dark:bg-[#8FB996]'
                                          : 'w-1.5 bg-stone-200 dark:bg-slate-700'
                                      }`}
                                    />
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleNavigateFlashcard(1)}
                                  disabled={flashcardIndex >= flashcardDeck.length - 1}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 disabled:opacity-30 disabled:pointer-events-none py-1 px-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                  <span>下一词</span>
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          </AnimatePresence>
                        </div>

                        {/* Minimalist Dual Bottom Buttons: 不熟 / 已掌握 */}
                        <div className="pt-3 grid grid-cols-2 gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleFlashcardDecision(2)}
                            className="h-12 rounded-2xl bg-stone-200/75 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-stone-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                            <span>不熟</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleFlashcardDecision(3)}
                            className="h-12 rounded-2xl bg-[#516050] hover:bg-[#3F4C3E] dark:bg-[#8FB996] dark:text-stone-950 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>已掌握</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* Session Complete State */
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-5">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#516050] dark:text-[#8FB996]">
                      <CheckCheck className="w-7 h-7" />
                    </div>
                    <h4 className="font-serif-luxury text-2xl font-bold text-stone-900 dark:text-stone-100">
                      本轮速刷完成
                    </h4>

                    <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151D2E] border border-stone-200/80 dark:border-slate-800">
                        <span className="text-xs text-stone-400 block">不熟</span>
                        <span className="font-mono text-2xl font-bold text-stone-700 dark:text-stone-200 tabular-nums">
                          {flashcardStats.learning}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151D2E] border border-stone-200/80 dark:border-slate-800">
                        <span className="text-xs text-stone-400 block">已掌握</span>
                        <span className="font-mono text-2xl font-bold text-[#516050] dark:text-[#8FB996] tabular-nums">
                          {flashcardStats.mastered}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFlashcardOpen(false)}
                      className="px-6 py-3 rounded-full bg-[#516050] hover:bg-[#3F4C3E] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      返回生词本
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
