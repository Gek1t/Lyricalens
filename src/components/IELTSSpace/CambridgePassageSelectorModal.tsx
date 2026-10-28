import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, Check, Sparkles, ChevronRight, ChevronDown, Flame, ArrowRight, Globe } from 'lucide-react';
import { CAMBRIDGE_IELTS_PASSAGES, getPassagesWithHitStats } from '../../data/ieltsPassages';
import { formatBookNameZh } from '../../data/ieltsTopicSynonyms';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../db';

const QUICK_BOOK_FILTERS = ['ALL', 'Cambridge 19', 'Cambridge 18'];

export const CambridgePassageSelectorModal: React.FC = () => {
  const isCambridgeSelectorOpen = useAppStore(s => s.isCambridgeSelectorOpen);
  const closeCambridgeSelector = useAppStore(s => s.closeCambridgeSelector);
  const currentPassageId = useAppStore(s => s.currentPassageId);
  const loadCambridgePassage = useAppStore(s => s.loadCambridgePassage);
  const openOnlineSearch = useAppStore(s => s.openOnlineSearch);

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>('ALL');
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState<boolean>(false);

  const allDbWords = useLiveQuery(() => db.words.toArray()) || [];
  const customPassages = useLiveQuery(() => db.customPassages.toArray()) || [];
  const userWordStrings = useMemo(() => allDbWords.map(w => w.word), [allDbWords]);

  // Real-time hit calculation against notebook words
  const passagesWithHits = useMemo(() => {
    return getPassagesWithHitStats(userWordStrings, customPassages);
  }, [userWordStrings, customPassages]);

  const availableBooks = useMemo(() => {
    const allList = [...customPassages, ...CAMBRIDGE_IELTS_PASSAGES];
    const books = Array.from(new Set(allList.map(p => p.cambridgeBook)));
    return ['ALL', ...books];
  }, [customPassages]);

  const extraBooks = useMemo(() => {
    return availableBooks.filter(b => !QUICK_BOOK_FILTERS.includes(b));
  }, [availableBooks]);

  const isExtraBookSelected = !QUICK_BOOK_FILTERS.includes(selectedBookFilter);

  const formatShortBookLabel = (book: string) => {
    if (book === 'ALL') return '全部真题';
    const zh = formatBookNameZh(book);
    if (zh === 'Cambridge IELTS Academic Special' || zh === 'IELTS Academic Reading Special') {
      return '学术精选';
    }
    if (zh === '2026 Recall') {
      return '2026 机经';
    }
    return zh.replace(/^剑桥雅思\s*(\d+)$/, '剑雅 $1').replace(/^Cambridge\s+(\d+)$/i, '剑雅 $1');
  };

  const getBookHitCount = (book: string) => {
    const list = book === 'ALL'
      ? passagesWithHits
      : passagesWithHits.filter(p => p.passage.cambridgeBook === book);
    return list.reduce((sum, p) => sum + p.hitCount, 0);
  };

  const filteredPassages = useMemo(() => {
    if (selectedBookFilter === 'ALL') return passagesWithHits;
    return passagesWithHits.filter(item => item.passage.cambridgeBook === selectedBookFilter);
  }, [passagesWithHits, selectedBookFilter]);

  const handleClose = () => {
    setIsExpanded(false);
    setIsBookDropdownOpen(false);
    closeCambridgeSelector();
  };

  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <AnimatePresence>
      {isCambridgeSelectorOpen && (
        <div
          id="cambridge-passage-modal-root"
          data-no-swipe="true"
          data-no-gesture="true"
          className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-auto overflow-hidden select-none"
        >
          {/* Backdrop with smooth fade */}
          <motion.div
            key="cambridge-selector-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            onClick={handleClose}
          />

          {/* Interactive Responsive Modal Sheet */}
          <motion.div
            id="cambridge-passages-sheet"
            key="cambridge-selector-sheet"
            data-no-swipe="true"
            data-no-gesture="true"
            initial={{ y: '100%' }}
            animate={{
              y: 0,
              height: isExpanded ? '92%' : '75%',
            }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: isExpanded ? 0.05 : 0.22, bottom: 0.55 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -35 || info.velocity.y < -180) {
                setIsExpanded(true);
              } else if (info.offset.y > 45 || info.velocity.y > 200) {
                if (isExpanded) {
                  setIsExpanded(false);
                } else {
                  handleClose();
                }
              }
            }}
            transition={{
              type: 'spring',
              damping: 32,
              stiffness: 320,
              mass: 0.8,
            }}
            onTouchStart={e => e.stopPropagation()}
            onTouchMove={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
            className="relative w-full flex flex-col rounded-t-[28px] sm:rounded-t-3xl bg-[#FAF7F2] dark:bg-[#121620] border-t border-stone-200/90 dark:border-slate-800/90 shadow-2xl z-10 overflow-hidden transition-[border-radius] duration-300"
          >
            {/* Top Interactive Pull Handle (Drag up to Expand, Drag down to Collapse/Close) */}
            <div
              className="w-full flex flex-col items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none shrink-0 group"
              onClick={toggleExpand}
            >
              <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600 group-hover:bg-stone-400 dark:group-hover:bg-stone-500 transition-colors" />
            </div>

            {/* Header */}
            <div className="px-5 pb-3 flex items-center justify-between gap-3 shrink-0 border-b border-stone-200/70 dark:border-slate-800/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#516050]/10 dark:bg-[#8FB996]/15 flex items-center justify-center text-[#516050] dark:text-[#8FB996] shrink-0">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-serif-luxury text-[17px] font-bold text-stone-900 dark:text-stone-100 leading-none truncate">
                  剑桥雅思官方真题
                </h2>
              </div>

              {/* Compact Single-Line Online Question Bank Trigger */}
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  openOnlineSearch('reading');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 bg-white dark:bg-white/[0.06] hover:bg-stone-100/90 dark:hover:bg-white/[0.1] text-[#516050] dark:text-[#8FB996] border border-stone-200/85 dark:border-white/[0.1] transition-all active:scale-95 cursor-pointer shadow-2xs focus:outline-none group"
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>全网题库</span>
                <ChevronRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            </div>

            {/* Single-Row Clean Filter Bar: 3 Quick Pills + Volume Picker Dropdown */}
            <div className="relative px-5 py-2.5 flex items-center justify-between gap-2 border-b border-stone-200/60 dark:border-slate-800/60 shrink-0 bg-stone-100/60 dark:bg-[#161C28]/60 z-20">
              <div className="flex items-center gap-1.5 min-w-0">
                {QUICK_BOOK_FILTERS.filter(b => availableBooks.includes(b)).map(book => {
                  const isSelected = selectedBookFilter === book;
                  const bookHitSum = getBookHitCount(book);
                  const displayBookLabel = formatShortBookLabel(book);

                  return (
                    <button
                      key={book}
                      type="button"
                      onClick={() => {
                        setSelectedBookFilter(book);
                        setIsBookDropdownOpen(false);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 active:scale-95 focus:outline-none ${
                        isSelected
                          ? 'bg-[#516050] dark:bg-[#8FB996] text-white dark:text-stone-950 font-semibold shadow-2xs'
                          : 'bg-white dark:bg-[#1A2234] text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200/70 dark:border-slate-800'
                      }`}
                    >
                      <span>{displayBookLabel}</span>
                      {bookHitSum > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums font-semibold ${
                          isSelected
                            ? 'bg-white/20 text-white dark:bg-stone-900/30 dark:text-stone-900'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}>
                          {bookHitSum}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Compact More Volumes Dropdown */}
              {extraBooks.length > 0 && (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsBookDropdownOpen(prev => !prev)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 active:scale-95 focus:outline-none ${
                      isExtraBookSelected
                        ? 'bg-[#516050] dark:bg-[#8FB996] text-white dark:text-stone-950 font-semibold shadow-2xs'
                        : 'bg-white dark:bg-[#1A2234] text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200/70 dark:border-slate-800'
                    }`}
                  >
                    <span className="max-w-[96px] truncate">
                      {isExtraBookSelected ? formatShortBookLabel(selectedBookFilter) : '更多卷册'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 shrink-0 ${isBookDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isBookDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setIsBookDropdownOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.96 }}
                          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute right-0 mt-1.5 w-48 max-h-60 overflow-y-auto no-scrollbar rounded-2xl p-1.5 bg-[#FDFBF7]/98 dark:bg-[#161E2E]/98 backdrop-blur-2xl border border-stone-200/90 dark:border-slate-700/80 shadow-xl z-40 space-y-0.5"
                        >
                          {extraBooks.map(book => {
                            const active = selectedBookFilter === book;
                            const hits = getBookHitCount(book);
                            return (
                              <button
                                key={`extra-book-${book}`}
                                type="button"
                                onClick={() => {
                                  setSelectedBookFilter(book);
                                  setIsBookDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                                  active
                                    ? 'bg-[#516050]/12 dark:bg-[#8FB996]/15 text-[#516050] dark:text-[#8FB996] font-semibold'
                                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-900/[0.04] dark:hover:bg-white/[0.05]'
                                }`}
                              >
                                <span className="truncate">{formatShortBookLabel(book)}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {hits > 0 && (
                                    <span className="text-[10px] font-mono tabular-nums text-amber-600 dark:text-amber-400">
                                      {hits}
                                    </span>
                                  )}
                                  {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                                </div>
                              </button>
                            );
                          })}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Scrollable Passages List with airy padding */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 pt-3.5 pb-6 space-y-3 no-scrollbar">
              {filteredPassages.map(({ passage, matchedWords, hitCount }, pIdx) => {
                const isCurrent = passage.id === currentPassageId;

                return (
                  <div
                    key={`cambridge-pass-${passage.id}-${pIdx}`}
                    onClick={() => {
                      loadCambridgePassage(passage, matchedWords);
                    }}
                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer group active:scale-[0.99] ${
                      isCurrent
                        ? 'bg-[#516050]/8 dark:bg-[#8FB996]/10 border-[#516050]/40 dark:border-[#8FB996]/50 shadow-sm ring-1 ring-[#516050]/20 dark:ring-[#8FB996]/25'
                        : 'bg-white dark:bg-[#18202F] border-stone-200/80 dark:border-slate-800/90 hover:border-stone-400 dark:hover:border-slate-600 hover:shadow-xs'
                    }`}
                  >
                    {/* Top Tag Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 border border-stone-200/70 dark:border-slate-700 whitespace-nowrap">
                          {passage.cambridgeBook} · Test {passage.testNum} P{passage.passageNum}
                        </span>
                        <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 truncate">
                          {passage.category}
                        </span>
                      </div>

                      {isCurrent ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#516050] dark:bg-[#8FB996] text-white dark:text-stone-950 flex items-center gap-1 whitespace-nowrap shrink-0 shadow-2xs">
                          <Check className="w-3 h-3" />
                          当前阅读
                        </span>
                      ) : (
                        <span className="text-[10.5px] font-mono tabular-nums text-stone-400 dark:text-stone-500 whitespace-nowrap shrink-0">
                          {passage.bandDifficulty}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-serif-luxury text-[15px] font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#516050] dark:group-hover:text-[#8FB996] transition-colors leading-snug">
                      {passage.title}
                    </h3>

                    {/* Matched Vocabulary / Highlights */}
                    <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      {hitCount > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#516050] dark:text-[#8FB996] min-w-0 flex-1">
                          <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <div className="flex items-center gap-1 overflow-hidden">
                            <span className="font-medium whitespace-nowrap shrink-0">命中生词 ({hitCount}):</span>
                            <div className="flex items-center gap-1 overflow-hidden">
                              {matchedWords.slice(0, 2).map((w, idx) => (
                                <span
                                  key={`pass-match-${passage.id}-${w}-${idx}`}
                                  className="px-1.5 py-0.5 rounded-md bg-[#516050]/10 dark:bg-[#8FB996]/15 text-[#516050] dark:text-[#8FB996] font-mono text-[10px] font-semibold whitespace-nowrap shrink-0"
                                >
                                  {w}
                                </span>
                              ))}
                              {matchedWords.length > 2 && (
                                <span className="text-[10px] text-stone-400 font-mono whitespace-nowrap shrink-0">
                                  +{matchedWords.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
                          <span>{passage.questions.length} 道学术真题 · 限时 {passage.timeAllowedMins} 分钟</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#516050] dark:text-[#8FB996] bg-[#516050]/8 dark:bg-[#8FB996]/10 group-hover:bg-[#516050] group-hover:text-white dark:group-hover:bg-[#8FB996] dark:group-hover:text-stone-950 transition-all whitespace-nowrap shrink-0">
                        <span>{isCurrent ? '继续精读' : '载入真题'}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


