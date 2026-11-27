import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Volume2, Music2, BookOpen, Layers } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { speakWord, speakWordIfAutoEnabled } from '../utils/audioEngine';
import { SubWordItem, MasteryLevel, WordItem } from '../types';
import { cycleWordMastery } from '../db';
import { HighlightedText, ClickableWordHeading } from './HighlightedText';
import { ContextualImmersionSection } from './ContextualImmersionSection';
import { getCollocationsForWord, parseStructuredDefinitions, CollocationItem } from '../utils/collocationDictionary';
import { findSongContextInPlaylist, findIELTSAcademicContext } from '../utils/contextFinder';
import { lookupWord, formatPartOfSpeech } from '../utils/lyricDictionary';
import { withColorAlpha } from '../utils/colorExtractor';
import { triggerHighRefreshBoost } from '../utils/displayRefreshRate';
import { WordDrawer } from './WordDrawer';

export const WordDetailSheet: React.FC = () => {
  const selectedWord = useAppStore(s => s.selectedWord);
  const isWordSheetOpen = useAppStore(s => s.isWordSheetOpen);
  const wordViewMode = useAppStore(s => s.wordViewMode);
  const closeWordDetail = useAppStore(s => s.closeWordDetail);
  const ambientColors = useAppStore(s => s.ambientColors);

  // Preserve word during exit animation so content doesn't abruptly unmount
  const lastWordRef = useRef<WordItem | null>(selectedWord);
  if (selectedWord) {
    lastWordRef.current = selectedWord;
  }
  const displayWord = selectedWord || lastWordRef.current;

  // Active viewing item: when a user clicks a subword in a phrase, activeSubWord focuses on that subword
  const [activeSubWord, setActiveSubWord] = useState<SubWordItem | null>(null);

  // Playing state for audio
  const [playingUk, setPlayingUk] = useState(false);
  const [playingUs, setPlayingUs] = useState(false);

  // Drawer state for interactive word click lookup
  const [drawerWord, setDrawerWord] = useState<WordItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Swipe down/right detection to go back
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Guard async lookups against unmount, sheet close, or rapid multi-taps
  const lookupSeqRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const prevWordRef = useRef<string | undefined>(selectedWord?.word);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      lookupSeqRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const wordChanged = prevWordRef.current !== selectedWord?.word;
    if (!isWordSheetOpen || wordChanged) {
      lookupSeqRef.current += 1;
      prevWordRef.current = selectedWord?.word;
    }
    if (!isWordSheetOpen || wordChanged) {
      setActiveSubWord(null);
      setPlayingUk(false);
      setPlayingUs(false);
      setIsDrawerOpen(false);
      setDrawerWord(null);
    }
  }, [isWordSheetOpen, selectedWord]);

  const isVisible = isWordSheetOpen && wordViewMode === 'fullscreen' && Boolean(displayWord);

  // The item currently on display (either the root phrase/word or active drilled subword)
  const currentItem = activeSubWord || displayWord;
  const isViewingSubWord = Boolean(activeSubWord);

  useEffect(() => {
    if (isVisible && currentItem?.word) {
      triggerHighRefreshBoost(1000);
      speakWordIfAutoEnabled(currentItem.word);
    }
  }, [isVisible, currentItem?.word]);

  const handleMasteryToggle = async () => {
    if (!currentItem) return;
    const nextLevel = await cycleWordMastery(currentItem.word, currentItem);
    if (currentItem.id) {
      currentItem.masteryLevel = nextLevel;
    }
    // Update store state accordingly
    if (!isViewingSubWord && selectedWord) {
      useAppStore.setState({
        selectedWord: { ...selectedWord, masteryLevel: nextLevel }
      });
    } else {
      setActiveSubWord({ ...currentItem, masteryLevel: nextLevel });
    }
  };

  // 1. Song Playlist Check (Memoized & only evaluated when visible)
  const songContext = useMemo(
    () => (isVisible && currentItem ? findSongContextInPlaylist(currentItem.word, currentItem) : { found: false }),
    [isVisible, currentItem]
  );

  // 2. IELTS Academic Context (Memoized & only evaluated when visible)
  const ieltsContext = useMemo(
    () =>
      isVisible && currentItem
        ? findIELTSAcademicContext(currentItem.word)
        : { found: false, sentenceEn: '', sentenceCn: '', source: 'IELTS ACADEMIC' },
    [isVisible, currentItem?.word]
  );

  // 3. Structured multi-POS definition parsing
  const structuredDefs = useMemo(
    () =>
      isVisible && currentItem
        ? parseStructuredDefinitions(currentItem.definitionCn, currentItem.partOfSpeech)
        : [],
    [isVisible, currentItem?.definitionCn, currentItem?.partOfSpeech]
  );

  // 4. Collocations lookup
  const collocations: CollocationItem[] = useMemo(
    () => (isVisible && currentItem ? getCollocationsForWord(currentItem.word) : []),
    [isVisible, currentItem?.word]
  );

  // Click any word in sentences or collocations to pop up the bottom drawer
  const handleWordClick = async (clickedWord: string, sentence?: string) => {
    const cleanWord = clickedWord.trim();
    if (!cleanWord) return;
    const reqSeq = ++lookupSeqRef.current;
    try {
      const item = await lookupWord(cleanWord, sentence || '');
      const storeState = useAppStore.getState();
      if (
        !isMountedRef.current ||
        reqSeq !== lookupSeqRef.current ||
        !storeState.isWordSheetOpen ||
        storeState.wordViewMode !== 'fullscreen' ||
        !item
      ) {
        return;
      }
      setDrawerWord(item);
      setIsDrawerOpen(true);
    } catch (err) {
      console.error('[WordDetailSheet] Failed to look up word:', cleanWord, err);
    }
  };

  const handleSpeakUk = () => {
    if (!currentItem) return;
    setPlayingUk(true);
    speakWord(currentItem.word, 'en-GB');
    setTimeout(() => setPlayingUk(false), 1200);
  };

  const handleSpeakUs = () => {
    if (!currentItem) return;
    setPlayingUs(true);
    speakWord(currentItem.word, 'en-US');
    setTimeout(() => setPlayingUs(false), 1200);
  };

  // Swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;

    if (!isDrawerOpen && ((dx > 70 && Math.abs(dy) < 60) || (dy > 80 && Math.abs(dx) < 60))) {
      closeWordDetail();
    }
    touchStartRef.current = null;
  };

  const currentMasteryLevel = ((currentItem?.masteryLevel) ?? (currentItem?.isStarred ? 1 : 0)) as MasteryLevel;
  const isPhrase = currentItem?.word ? currentItem.word.trim().includes(' ') : false;
  const formattedPos = currentItem ? formatPartOfSpeech(currentItem.partOfSpeech, currentItem.word) : '';

  return (
    <>
      <AnimatePresence>
        {isVisible && currentItem && (
          <motion.div
            key="fullscreen-word-detail-page"
            id="fullscreen-word-detail-page"
            initial={{ opacity: 0, y: 14 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] }
            }}
            exit={{
              opacity: 0,
              y: 14,
              transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
            }}
            onAnimationStart={() => triggerHighRefreshBoost(1000)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="absolute inset-0 z-[70] flex flex-col justify-between overflow-hidden select-none bg-[#FAF8F5] dark:bg-[#0E121A] text-stone-900 dark:text-stone-100 hardware-accelerated"
          >
          {/* Luminous Soft Linen Ambient Background (Zero GPU Gaussian Blur Cost) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ contain: 'strict' }}>
            <div
              className="absolute -top-32 -left-20 w-[440px] h-[440px] rounded-full opacity-35 dark:opacity-15"
              style={{
                background: `radial-gradient(circle, ${withColorAlpha(ambientColors[0] || '#D4DCD2', 0.65, '#D4DCD2')} 0%, ${withColorAlpha(ambientColors[0] || '#D4DCD2', 0.22, '#D4DCD2')} 45%, transparent 72%)`
              }}
            />
            <div
              className="absolute top-1/2 -right-28 w-[400px] h-[400px] rounded-full opacity-30 dark:opacity-15"
              style={{
                background: `radial-gradient(circle, ${withColorAlpha(ambientColors[1] || '#EAE2D5', 0.6, '#EAE2D5')} 0%, ${withColorAlpha(ambientColors[1] || '#EAE2D5', 0.2, '#EAE2D5')} 45%, transparent 72%)`
              }}
            />
            <div
              className="absolute -bottom-32 left-1/4 w-[420px] h-[420px] rounded-full opacity-30 dark:opacity-15"
              style={{
                background: `radial-gradient(circle, ${withColorAlpha(ambientColors[2] || '#D2C8BA', 0.6, '#D2C8BA')} 0%, ${withColorAlpha(ambientColors[2] || '#D2C8BA', 0.2, '#D2C8BA')} 45%, transparent 72%)`
              }}
            />
          </div>

          {/* Minimalist Gallery Top Navigation Bar */}
          <motion.header 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full z-40 pt-[var(--android-safe-top,max(3.25rem,calc(env(safe-area-inset-top,44px)+0.85rem)))] pb-3 px-5 flex items-center justify-between pointer-events-auto border-b border-stone-200/40 dark:border-white/5"
          >
            {/* Return Button */}
            <button
              id="fullscreen-word-back-btn"
              onClick={closeWordDetail}
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-900/[0.04] dark:hover:bg-white/[0.06] active:scale-90 transition-all cursor-pointer flex-shrink-0"
              aria-label="Return"
              title="返回"
            >
              <ChevronDown className="w-5 h-5 stroke-[2]" />
            </button>

            {/* Context in Header -> Ghost Mode (No capsule background) */}
            <div className="flex-1 flex items-center justify-center text-center px-2">
              {songContext.found ? (
                <div className="inline-flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                  <Music2 className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                  <span className="text-[11px] font-sans font-medium uppercase tracking-[0.2em]">
                    {songContext.songTitle}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                  <BookOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                  <span className="text-[11px] font-sans font-medium uppercase tracking-[0.2em]">
                    Academic Context
                  </span>
                </div>
              )}
            </div>

            {/* Right: 4-Level Mastery Glyph Button 【0. 未收录 ○】 【1. 已加入单词集 ⊚】 【2. 熟悉/学习中 ⊙】 【3. 已掌握 ◉】 */}
            <div className="flex items-center justify-center flex-shrink-0">
              <button
                id="fullscreen-word-mastery-btn"
                onClick={handleMasteryToggle}
                className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-900/[0.04] dark:hover:bg-white/[0.06] active:scale-90 transition-all cursor-pointer"
                aria-label="Toggle word mastery"
                title={
                  currentMasteryLevel === 3
                    ? '【3. 已掌握 ◉】 饱满实心 - 点击切换'
                    : currentMasteryLevel === 2
                    ? '【2. 熟悉/学习中 ⊙】 中核点 - 点击切换'
                    : currentMasteryLevel === 1
                    ? '【1. 已加入单词集 ⊚】 针尖微点 - 点击切换'
                    : '【0. 未收录 ○】 中空 - 点击收录'
                }
              >
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="transition-all duration-300">
                    <circle
                      cx="12"
                      cy="12"
                      r="8.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className={`transition-colors duration-300 ${
                        currentMasteryLevel === 0
                          ? 'text-stone-400 dark:text-stone-500'
                          : currentMasteryLevel === 1
                          ? 'text-stone-700 dark:text-stone-300'
                          : currentMasteryLevel === 2
                          ? 'text-[#C87D32] dark:text-amber-400'
                          : 'text-stone-900 dark:text-stone-100'
                      }`}
                    />

                    {currentMasteryLevel === 1 && (
                      <circle
                        cx="12"
                        cy="12"
                        r="1.5"
                        fill="currentColor"
                        className="text-stone-700 dark:text-stone-300 transition-all duration-300"
                      />
                    )}

                    {currentMasteryLevel === 2 && (
                      <circle
                        cx="12"
                        cy="12"
                        r="3.6"
                        fill="currentColor"
                        className="text-[#C87D32] dark:text-amber-400 transition-all duration-300"
                      />
                    )}

                    {currentMasteryLevel === 3 && (
                      <circle
                        cx="12"
                        cy="12"
                        r="6.0"
                        fill="currentColor"
                        className="text-stone-900 dark:text-stone-100 transition-all duration-300"
                      />
                    )}
                  </svg>
                </div>
              </button>
            </div>
          </motion.header>

          {/* Editorial Content Canvas (Seamless, breathable, un-carded) */}
          <div className="flex-1 w-full overflow-y-auto no-scrollbar px-6 pt-4 pb-12 space-y-6 z-20">
            {/* Section 1: Hero Word, POS and Pronunciation Capsules with FLIP Hero Flight */}
            <div className="space-y-3">
              <div className="flex items-baseline gap-3 flex-wrap">
                <motion.h1
                  layoutId={`hero-word-${currentItem.word.toLowerCase()}`}
                  key={`hero-title-${currentItem.word}`}
                  initial={{ 
                    opacity: 0.85,
                    scale: 0.95,
                    y: 6
                  }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    y: 0 
                  }}
                  transition={{
                    type: 'spring',
                    damping: 28,
                    stiffness: 260,
                    mass: 0.8
                  }}
                  className={`font-serif-luxury font-normal tracking-tight text-stone-900 dark:text-stone-50 leading-[1.08] origin-left ${
                    currentItem.word.length > 20
                      ? 'text-3xl sm:text-4xl'
                      : currentItem.word.length > 14
                      ? 'text-4xl sm:text-5xl'
                      : 'text-[44px] sm:text-[54px]'
                  }`}
                >
                  <ClickableWordHeading word={currentItem.word} onWordClick={handleWordClick} />
                </motion.h1>
                
                {/* 英文词性斜体 + 中文正体，避免中文被强行拉斜 */}
                {!isPhrase && formattedPos && (() => {
                  const match = formattedPos.match(/^([a-zA-Z.+\s/]+?)(?:\s*\(?([\u4e00-\u9fa5/+]+)\)?)?$/);
                  const abbr = match ? (match[1] || '').trim() : formattedPos;
                  const cn = match ? (match[2] || '').trim() : '';
                  return (
                    <motion.span
                      key={`pos-${currentItem.word}`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className="inline-flex items-baseline gap-1.5"
                    >
                      {abbr && (
                        <span className="text-[13.5px] font-serif italic text-stone-600 dark:text-stone-300 font-medium tracking-wide">
                          {abbr}
                        </span>
                      )}
                      {cn && (
                        <span className="text-[11.5px] font-sans not-italic text-stone-400 dark:text-stone-500">
                          {cn}
                        </span>
                      )}
                    </motion.span>
                  );
                })()}
              </div>

              {/* Phonetics Section: Slim, Refined Audio Capsules (Omitted for multi-word phrases) */}
              {!isPhrase && (
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={`phonetics-${currentItem.word}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-2.5 flex-wrap text-xs pt-0.5"
                  >
                    {/* UK Pronunciation */}
                    <button
                      id="fullscreen-speak-uk-btn"
                      onClick={handleSpeakUk}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/[0.03] hover:bg-stone-900/[0.07] dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-stone-300/70 dark:border-white/15 text-stone-800 dark:text-stone-200 transition-all active:scale-95 cursor-pointer"
                      title="英音发音"
                    >
                      <span className="text-[10px] font-sans font-semibold tracking-wider text-stone-500 dark:text-stone-400 uppercase">
                        UK
                      </span>
                      <Volume2 className={`w-3.5 h-3.5 ${playingUk ? 'text-stone-900 dark:text-stone-100 scale-110' : 'text-stone-400 dark:text-stone-500'} transition-transform`} />
                      <span className="font-serif text-[13.5px] font-normal tracking-wide text-stone-900 dark:text-stone-100">
                        {currentItem.phoneticUk || `/${currentItem.word}/`}
                      </span>
                    </button>

                    {/* US Pronunciation */}
                    <button
                      id="fullscreen-speak-us-btn"
                      onClick={handleSpeakUs}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/[0.03] hover:bg-stone-900/[0.07] dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-stone-300/70 dark:border-white/15 text-stone-800 dark:text-stone-200 transition-all active:scale-95 cursor-pointer"
                      title="美音发音"
                    >
                      <span className="text-[10px] font-sans font-semibold tracking-wider text-stone-500 dark:text-stone-400 uppercase">
                        US
                      </span>
                      <Volume2 className={`w-3.5 h-3.5 ${playingUs ? 'text-stone-900 dark:text-stone-100 scale-110' : 'text-stone-400 dark:text-stone-500'} transition-transform`} />
                      <span className="font-serif text-[13.5px] font-normal tracking-wide text-stone-900 dark:text-stone-100">
                        {currentItem.phoneticUs || `/${currentItem.word}/`}
                      </span>
                    </button>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Sub-Word Phrase Decomposition (If Phrase) */}
            {selectedWord.subWords && selectedWord.subWords.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.35 }}
                className="p-4 rounded-xl bg-stone-900/[0.02] dark:bg-white/[0.03] border border-stone-200/70 dark:border-white/10 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                    <Layers className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                    <span>短语成分拆解</span>
                  </div>
                  {isViewingSubWord && (
                    <button
                      onClick={() => setActiveSubWord(null)}
                      className="text-xs text-stone-700 dark:text-stone-300 hover:underline font-medium cursor-pointer"
                    >
                      查看完整短语
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-0.5">
                  {selectedWord.subWords.map((sub, idx) => {
                    const isSelected = activeSubWord?.word.toLowerCase() === sub.word.toLowerCase();
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isSelected) {
                            setActiveSubWord(null);
                          } else {
                            setActiveSubWord(sub);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 shadow-xs font-medium scale-[1.02]'
                            : 'bg-white dark:bg-white/10 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-white/10 hover:border-stone-400'
                        }`}
                      >
                        <span>{sub.word}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Dynamic Content Container: Cascading Fluid Crossfade Animation when switching subwords */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-panel-${currentItem.word}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                {/* Section 2: 释义 */}
                <div className="space-y-3 pt-1 border-t border-stone-200/60 dark:border-white/10">
                  <div className="flex items-center gap-2 text-[11px] font-sans font-medium tracking-[0.08em] text-stone-400 dark:text-stone-500">
                    <span>释义</span>
                    {currentItem?.partOfSpeech?.includes('AI 语境释义') && (
                      <span className="text-[10px] font-normal tracking-normal text-stone-400/90 dark:text-stone-500">
                        AI · 语境
                      </span>
                    )}
                  </div>

                  {structuredDefs.length > 1 ? (
                    <div className="space-y-2.5">
                      {structuredDefs.map((defItem, idx) => (
                        <div key={idx} className="flex items-baseline gap-3 text-stone-900 dark:text-stone-100">
                          {/* Clean POS tag when meanings have different parts of speech */}
                          {defItem.pos && (
                            <span className="text-[12px] font-serif italic text-stone-600 dark:text-stone-300 font-medium min-w-[3.5rem] flex-shrink-0 select-none">
                              {defItem.pos}
                            </span>
                          )}
                          <span className="text-[17px] sm:text-[18px] font-normal leading-snug tracking-tight text-stone-900 dark:text-stone-100">
                            {defItem.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[19px] sm:text-[21px] font-normal text-stone-900 dark:text-stone-50 leading-snug tracking-tight">
                      {structuredDefs[0]?.text || currentItem.definitionCn}
                    </p>
                  )}

                  {/* Extended English Definition */}
                  {currentItem.definition && 
                    !currentItem.definition.startsWith('Idiomatic phrase expression in lyrics') && 
                    !currentItem.definition.startsWith('Vocabulary item:') &&
                    !currentItem.definition.startsWith('Contextual expression:') &&
                    !currentItem.definition.startsWith('Lyric expression') &&
                    !currentItem.definition.startsWith('Specialized term ') &&
                    !currentItem.definition.startsWith('Key vocabulary') &&
                    !currentItem.definition.startsWith('Proper noun,') && (
                    <p className="text-[13px] text-stone-500 dark:text-stone-400 font-sans leading-relaxed pt-1">
                      <HighlightedText
                        text={currentItem.definition}
                        targetWord=""
                        onWordClick={(word, s) => handleWordClick(word, s)}
                      />
                    </p>
                  )}
                </div>

                {/* Section 3: Dual Context Reading & AR Scene Examples */}
                <ContextualImmersionSection
                  word={currentItem.word}
                  songContext={songContext}
                  ieltsContext={ieltsContext}
                  examples={currentItem.examples}
                  variant="sheet"
                  onWordClick={handleWordClick}
                />

                {/* Section 4: 核心搭配 */}
                {collocations.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-stone-200/60 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-sans font-medium tracking-[0.08em] text-stone-400 dark:text-stone-500">
                        核心搭配
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-stone-400 dark:text-stone-500">
                        {collocations.length} 组
                      </span>
                    </div>

                    {/* List of Collocation Rows */}
                    <div className="divide-y divide-stone-200/60 dark:divide-white/5">
                      {collocations?.filter(Boolean).map((colloc, idx) => (
                        <div
                          key={idx}
                          onClick={() => colloc?.phrase && handleWordClick(colloc.phrase, colloc.cn || '')}
                          className="py-3 px-2 rounded-xl transition-all flex items-center justify-between group cursor-pointer hover:bg-stone-900/[0.03] dark:hover:bg-white/[0.04] active:scale-[0.99]"
                          title="点击查看详细释义"
                        >
                          <div className="flex flex-col min-w-0 pr-3 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-serif-luxury text-[15px] sm:text-base font-medium text-stone-900 dark:text-stone-100 group-hover:text-stone-950 dark:group-hover:text-white transition-colors leading-snug">
                                {colloc?.phrase || ''}
                              </span>
                              {colloc?.type && (
                                <span className="text-[10px] font-serif italic text-stone-400 dark:text-stone-500">
                                  {colloc?.type}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-stone-500 dark:text-stone-400 font-sans leading-normal">
                              {colloc?.cn || ''}
                            </span>
                          </div>

                          {/* Speaker Pronunciation Icon Button on the Right */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (colloc?.phrase) speakWord(colloc.phrase, 'en-US');
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-white/10 active:scale-90 transition-all flex-shrink-0 cursor-pointer"
                            title="朗读搭配发音"
                            aria-label="朗读搭配发音"
                          >
                            <Volume2 className="w-4 h-4 stroke-[1.75]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Bottom Sheet Word Drawer for In-depth Lookup inside WordDetailSheet */}
      <WordDrawer
        wordItem={drawerWord}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        zIndexClass="z-[80]"
      />
    </>
  );
};
