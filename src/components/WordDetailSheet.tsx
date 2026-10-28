import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Volume2, Music2, BookOpen, Layers, Sparkles, Compass } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { speakWord } from '../utils/audioEngine';
import { SubWordItem, MasteryLevel, WordItem } from '../types';
import { cycleWordMastery } from '../db';
import { HighlightedText } from './HighlightedText';
import { getCollocationsForWord, parseStructuredDefinitions, CollocationItem } from '../utils/collocationDictionary';
import { findSongContextInPlaylist, findIELTSAcademicContext } from '../utils/contextFinder';
import { lookupWord, formatPartOfSpeech } from '../utils/lyricDictionary';
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

  useEffect(() => {
    if (!isWordSheetOpen) {
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

  // 1. Song Playlist Check
  const songContext = currentItem ? findSongContextInPlaylist(currentItem.word) : { found: false };

  // 2. IELTS Academic Context
  const ieltsContext = currentItem ? findIELTSAcademicContext(currentItem.word) : { found: false, sentenceEn: '', sentenceCn: '', source: 'IELTS ACADEMIC' };

  // 3. Structured multi-POS definition parsing
  const structuredDefs = currentItem ? parseStructuredDefinitions(currentItem.definitionCn, currentItem.partOfSpeech) : [];

  // 4. Collocations lookup
  const collocations: CollocationItem[] = currentItem ? getCollocationsForWord(currentItem.word) : [];

  // Click any word in sentences or collocations to pop up the bottom drawer
  const handleWordClick = async (clickedWord: string, sentence?: string) => {
    const item = await lookupWord(clickedWord, sentence || '');
    setDrawerWord(item);
    setIsDrawerOpen(true);
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
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] }
            }}
            exit={{
              opacity: 0,
              y: 16,
              scale: 0.98,
              transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="absolute inset-0 z-50 flex flex-col justify-between overflow-hidden select-none bg-[#FAF8F5]/95 dark:bg-[#0E121A]/95 backdrop-blur-md text-stone-900 dark:text-stone-100"
          >
          {/* Luminous Soft Linen Ambient Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full blur-[140px] opacity-25 dark:opacity-10 transition-all duration-1000"
              style={{ backgroundColor: ambientColors[0] || '#D4DCD2' }}
            />
            <div
              className="absolute top-1/2 -right-28 w-[380px] h-[380px] rounded-full blur-[130px] opacity-20 dark:opacity-10 transition-all duration-1000"
              style={{ backgroundColor: ambientColors[1] || '#EAE2D5' }}
            />
            <div
              className="absolute -bottom-32 left-1/4 w-[400px] h-[400px] rounded-full blur-[140px] opacity-20 dark:opacity-10 transition-all duration-1000"
              style={{ backgroundColor: ambientColors[2] || '#D2C8BA' }}
            />
          </div>

          {/* Minimalist Gallery Top Navigation Bar */}
          <motion.header 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full z-40 pt-4 pb-2 px-5 flex items-center justify-between pointer-events-auto border-b border-stone-200/40 dark:border-white/5"
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
                  <Music2 className="w-3.5 h-3.5 text-[#516050] dark:text-[#8FB996]" />
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
                          ? 'text-[#516050] dark:text-[#8FB996]'
                          : currentMasteryLevel === 2
                          ? 'text-[#8C7A5B] dark:text-amber-400'
                          : 'text-[#516050] dark:text-[#8FB996]'
                      }`}
                    />

                    {currentMasteryLevel === 1 && (
                      <circle
                        cx="12"
                        cy="12"
                        r="1.5"
                        fill="#516050"
                        className="dark:fill-[#8FB996] transition-all duration-300"
                      />
                    )}

                    {currentMasteryLevel === 2 && (
                      <circle
                        cx="12"
                        cy="12"
                        r="3.6"
                        fill="#8C7A5B"
                        className="dark:fill-amber-400 transition-all duration-300"
                      />
                    )}

                    {currentMasteryLevel === 3 && (
                      <circle
                        cx="12"
                        cy="12"
                        r="6.0"
                        fill="#516050"
                        className="dark:fill-[#8FB996] transition-all duration-300"
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
                  {currentItem.word}
                </motion.h1>
                
                {/* Elegant Italic Part-of-Speech: Only shown for single words, completely omitted for phrases */}
                {!isPhrase && formattedPos && (
                  <motion.span 
                    key={`pos-${currentItem.word}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-[13px] font-serif italic text-[#516050] dark:text-[#8FB996] font-medium tracking-wide"
                  >
                    {formattedPos}
                  </motion.span>
                )}
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
                      <Volume2 className={`w-3.5 h-3.5 ${playingUk ? 'text-[#516050] dark:text-[#8FB996] scale-110' : 'text-stone-400 dark:text-stone-500'} transition-transform`} />
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
                      <Volume2 className={`w-3.5 h-3.5 ${playingUs ? 'text-[#516050] dark:text-[#8FB996] scale-110' : 'text-stone-400 dark:text-stone-500'} transition-transform`} />
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
                    <Layers className="w-3.5 h-3.5 text-[#516050] dark:text-[#8FB996]" />
                    <span>短语成分拆解</span>
                  </div>
                  {isViewingSubWord && (
                    <button
                      onClick={() => setActiveSubWord(null)}
                      className="text-xs text-[#516050] dark:text-[#8FB996] hover:underline font-medium cursor-pointer"
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
                            ? 'bg-[#516050] text-white shadow-xs font-medium scale-[1.02]'
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
                {/* Section 2: Editorial Definitions (High readability, no duplicate POS tags, clean multi-POS alignment, NO 1. 2. numbers) */}
                <div className="space-y-3 pt-1 border-t border-stone-200/60 dark:border-white/10">
                  <div className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
                    DEFINITION
                  </div>

                  {structuredDefs.length > 1 ? (
                    <div className="space-y-2.5">
                      {structuredDefs.map((defItem, idx) => (
                        <div key={idx} className="flex items-baseline gap-3 text-stone-900 dark:text-stone-100">
                          {/* Clean POS tag when meanings have different parts of speech */}
                          {defItem.pos && (
                            <span className="text-[12px] font-serif italic text-[#516050] dark:text-[#8FB996] font-medium min-w-[3.5rem] flex-shrink-0 select-none">
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
                  {currentItem.definition && !currentItem.definition.startsWith('Idiomatic phrase expression in lyrics') && !currentItem.definition.startsWith('Vocabulary item:') && (
                    <p className="text-[13px] text-stone-500 dark:text-stone-400 font-sans leading-relaxed pt-1">
                      {currentItem.definition}
                    </p>
                  )}
                </div>

                {/* Section 3: Dual Context Reading (Lyrics vs IELTS Academic) */}
                {(songContext.found || ieltsContext.found) && (
                  <div className="space-y-4 pt-2 border-t border-stone-200/60 dark:border-white/10">
                    <div className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
                      CONTEXTUAL IMMERSION
                    </div>

                    {/* Lyrics Context Block (Left Sage Accent Bar) */}
                    {songContext.found && (
                      <div className="relative pl-4 py-1.5 border-l-2 border-[#516050] dark:border-[#8FB996] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] font-sans font-medium uppercase tracking-wider text-[#516050] dark:text-[#8FB996]">
                            <Music2 className="w-3.5 h-3.5" />
                            <span>Lyrics · {songContext.songTitle}</span>
                          </div>
                        </div>

                        <p className="font-serif-luxury text-[17px] sm:text-[18px] text-stone-900 dark:text-stone-100 leading-[1.65]">
                          "<HighlightedText 
                            text={songContext.lyricEn || ''} 
                            targetWord={currentItem.word} 
                            onWordClick={(word, s) => handleWordClick(word, s)}
                          />"
                        </p>

                        <p className="text-[13px] text-stone-500 dark:text-stone-400 font-sans leading-relaxed">
                          {songContext.lyricCn}
                        </p>
                      </div>
                    )}

                    {/* IELTS Academic Context Block (Left Ochre/Amber Accent Bar) */}
                    {ieltsContext.found && (
                      <div className="relative pl-4 py-1.5 border-l-2 border-[#A86F3E] dark:border-amber-400 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] font-sans font-medium uppercase tracking-wider text-[#A86F3E] dark:text-amber-300">
                            <span>IELTS Academic · Passage 2</span>
                          </div>
                        </div>

                        <p className="font-serif-luxury text-[17px] sm:text-[18px] text-stone-900 dark:text-stone-100 leading-[1.65]">
                          "<HighlightedText 
                            text={ieltsContext.sentenceEn} 
                            targetWord={currentItem.word} 
                            highlightClassName="font-semibold text-stone-950 dark:text-stone-50 underline decoration-[#A86F3E] dark:decoration-amber-400 decoration-[1.75px] underline-offset-[5px] bg-[#A86F3E]/[0.08] dark:bg-amber-400/[0.15] px-1.5 py-0.5 rounded-sm cursor-pointer hover:bg-[#A86F3E]/15 transition-all"
                            onWordClick={(word, s) => handleWordClick(word, s)}
                          />"
                        </p>

                        <p className="text-[13px] text-stone-500 dark:text-stone-400 font-sans leading-relaxed">
                          {ieltsContext.sentenceCn}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Section 4: IELTS Academic Collocations (Modern Dictionary Flow) */}
                {collocations.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-stone-200/60 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-[#516050] dark:text-[#8FB996]" />
                        <span>COLLOCATIONS · 核心搭配</span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400">
                        {collocations.length} ENTRIES
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
                              <span className="font-serif-luxury text-[15px] sm:text-base font-medium text-stone-900 dark:text-stone-100 group-hover:text-[#516050] dark:group-hover:text-[#8FB996] transition-colors leading-snug">
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
                            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-[#516050] dark:hover:text-[#8FB996] hover:bg-stone-200/60 dark:hover:bg-white/10 active:scale-90 transition-all flex-shrink-0 cursor-pointer"
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
      />
    </>
  );
};
