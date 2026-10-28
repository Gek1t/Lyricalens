import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
import { Volume2, Music2, Layers, Sparkles, Compass } from 'lucide-react';
import { WordItem, MasteryLevel, SubWordItem } from '../types';
import { speakWord, isAutoPronounceEnabled, getStoredAccentPreference } from '../utils/audioEngine';
import { cycleWordMastery } from '../db';
import { HighlightedText } from './HighlightedText';
import { getCollocationsForWord, parseStructuredDefinitions, CollocationItem } from '../utils/collocationDictionary';
import { findSongContextInPlaylist, findIELTSAcademicContext } from '../utils/contextFinder';
import { lookupWord, formatPartOfSpeech } from '../utils/lyricDictionary';

interface WordDrawerProps {
  wordItem: WordItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSubWord?: (word: string) => void;
}

interface DrawerStackItem {
  wordItem: WordItem;
  activeSubWord: SubWordItem | null;
  wasExpanded?: boolean;
  scrollTop?: number;
}

// 单张抽屉卡片的完整内容渲染器（无论是底层卡片还是顶层活动卡片）
interface DrawerCardViewProps {
  stackItem: DrawerStackItem;
  stackLength: number;
  cardIndex: number;
  currentStackIndex: number;
  isExpanded: boolean;
  isTopCard: boolean;
  onPopDrawer: (e?: React.MouseEvent) => void;
  onCloseAll: () => void;
  onToggleExpand: () => void;
  onPushWord: (word: string, sentence?: string) => void;
  onSelectSubWord: (sub: SubWordItem | null) => void;
  onToggleMastery: (e: React.MouseEvent) => void;
  onScrollUpdate?: (scrollTop: number) => void;
  peekContentRef?: React.RefObject<HTMLDivElement>;
  onDragStart?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const DrawerCardView: React.FC<DrawerCardViewProps> = ({
  stackItem,
  stackLength,
  cardIndex,
  currentStackIndex,
  isExpanded,
  isTopCard,
  onPopDrawer,
  onCloseAll,
  onToggleExpand,
  onPushWord,
  onSelectSubWord,
  onToggleMastery,
  onScrollUpdate,
  peekContentRef,
  onDragStart
}) => {
  const [playingUk, setPlayingUk] = useState(false);
  const [playingUs, setPlayingUs] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = stackItem.scrollTop || 0;
    }
    if (isTopCard && isAutoPronounceEnabled() && !currentItem.word.includes(' ')) {
      const preferredAccent = getStoredAccentPreference();
      speakWord(currentItem.word, preferredAccent);
    }
  }, [stackItem.wordItem.word, stackItem.activeSubWord?.word, currentStackIndex, isTopCard]);

  const currentItem = stackItem.activeSubWord || stackItem.wordItem;
  const isViewingSubWord = Boolean(stackItem.activeSubWord);
  const currentMastery = (currentItem.masteryLevel ?? (currentItem.isStarred ? 1 : 0)) as MasteryLevel;

  const songContext = findSongContextInPlaylist(currentItem.word);
  const ieltsContext = findIELTSAcademicContext(currentItem.word);
  const structuredDefs = parseStructuredDefinitions(currentItem.definitionCn, currentItem.partOfSpeech);
  const collocations: CollocationItem[] = getCollocationsForWord(currentItem.word);

  const handleSpeak = (type: 'uk' | 'us', e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (type === 'uk') {
      setPlayingUk(true);
      speakWord(currentItem.word, 'en-GB');
      setTimeout(() => setPlayingUk(false), 1200);
    } else {
      setPlayingUs(true);
      speakWord(currentItem.word, 'en-US');
      setTimeout(() => setPlayingUs(false), 1200);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none text-stone-900 dark:text-stone-100">
      {/* Drawer Top Drag Bar */}
      <div
        onPointerDown={isTopCard ? onDragStart : undefined}
        onClick={isTopCard ? onToggleExpand : undefined}
        className={`w-full pt-3 pb-1.5 px-6 flex items-center justify-center select-none touch-none shrink-0 group ${
          isTopCard ? 'cursor-ns-resize' : 'cursor-pointer'
        }`}
      >
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full group-hover:bg-stone-400 dark:group-hover:bg-stone-500 transition-colors" />
      </div>

      {/* Drawer Body 内容滚动区 */}
      <div 
        ref={scrollContainerRef}
        onScroll={(e) => {
          if (isTopCard && onScrollUpdate) {
            onScrollUpdate(e.currentTarget.scrollTop);
          }
        }}
        className={`flex-1 overflow-y-auto no-scrollbar px-6 pt-1 pb-10 ${!isTopCard ? 'pointer-events-none' : ''}`}
      >
        {/* SECTION 1: 初始态展示区域 */}
        <div ref={isTopCard ? peekContentRef : undefined} className="space-y-3 pb-1">
          {/* 词头 + 斜体词性 + 右上角掌握度球 */}
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h1
                className={`font-serif-luxury font-normal tracking-tight text-stone-900 dark:text-stone-50 leading-[1.08] ${
                  currentItem.word.length > 20
                    ? 'text-2xl sm:text-3xl'
                    : currentItem.word.length > 14
                    ? 'text-3xl sm:text-4xl'
                    : 'text-[36px] sm:text-[42px]'
                }`}
              >
                {currentItem.word}
              </h1>
              
              {/* 优雅斜体词性：仅单词显示，短语自动隐藏 */}
              {!currentItem.word.trim().includes(' ') && formatPartOfSpeech(currentItem.partOfSpeech, currentItem.word) && (
                <span className="text-[13px] font-serif italic text-[#516050] dark:text-[#8FB996] font-medium tracking-wide">
                  {formatPartOfSpeech(currentItem.partOfSpeech, currentItem.word)}
                </span>
              )}
            </div>

            {/* 右上角 4-Level 掌握度状态球 (○ ⊚ ⊙ ◉) */}
            <button
              type="button"
              onClick={onToggleMastery}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-900/[0.04] dark:hover:bg-white/[0.06] active:scale-90 transition-all cursor-pointer flex-shrink-0 self-center"
              aria-label="Toggle mastery"
              title="切换单词掌握度"
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
                      currentMastery === 0
                        ? 'text-stone-400 dark:text-stone-500'
                        : currentMastery === 1
                        ? 'text-[#516050] dark:text-[#8FB996]'
                        : currentMastery === 2
                        ? 'text-[#8C7A5B] dark:text-amber-400'
                        : 'text-[#516050] dark:text-[#8FB996]'
                    }`}
                  />

                  {currentMastery === 1 && (
                    <circle
                      cx="12"
                      cy="12"
                      r="1.5"
                      fill="#516050"
                      className="dark:fill-[#8FB996] transition-all duration-300"
                    />
                  )}

                  {currentMastery === 2 && (
                    <circle
                      cx="12"
                      cy="12"
                      r="3.6"
                      fill="#8C7A5B"
                      className="dark:fill-amber-400 transition-all duration-300"
                    />
                  )}

                  {currentMastery === 3 && (
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

          {/* 发音胶囊 */}
          {!currentItem.word.includes(' ') && (
            <div className="flex items-center gap-2.5 flex-wrap text-xs pt-0.5">
              <button
                type="button"
                onClick={(e) => handleSpeak('uk', e)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/[0.04] hover:bg-stone-900/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-stone-800 dark:text-stone-200 transition-all active:scale-95 cursor-pointer select-none"
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

              <button
                type="button"
                onClick={(e) => handleSpeak('us', e)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/[0.04] hover:bg-stone-900/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-stone-800 dark:text-stone-200 transition-all active:scale-95 cursor-pointer select-none"
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
            </div>
          )}

          {/* DEFINITION (核心释义 + 英文解释，跨词性整齐对齐) */}
          <div className="space-y-1 pt-1">
            <div className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
              DEFINITION
            </div>

            {structuredDefs.length > 1 ? (
              <div className="space-y-1.5 pt-0.5">
                {structuredDefs.map((defItem, idx) => (
                  <div key={idx} className="flex items-baseline gap-2.5 text-stone-900 dark:text-stone-100">
                    {defItem.pos && (
                      <span className="text-[12px] font-serif italic text-[#516050] dark:text-[#8FB996] font-medium min-w-[3.5rem] flex-shrink-0 select-none">
                        {defItem.pos}
                      </span>
                    )}
                    <span className="text-[16px] font-normal leading-snug tracking-tight text-stone-900 dark:text-stone-100">
                      {defItem.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[18px] font-normal text-stone-900 dark:text-stone-50 leading-snug tracking-tight">
                {structuredDefs[0]?.text || currentItem.definitionCn}
              </p>
            )}

            {currentItem.definition && !currentItem.definition.startsWith('Vocabulary item:') && (
              <p className="text-[13px] text-stone-500 dark:text-stone-400 font-sans leading-relaxed pt-0.5">
                {currentItem.definition}
              </p>
            )}
          </div>

          {/* Sub-Word Breakdown if compound phrase */}
          {stackItem.wordItem.subWords && stackItem.wordItem.subWords.length > 0 && (
            <div className="p-3 mt-2 rounded-xl bg-stone-900/[0.02] dark:bg-white/[0.03] border border-stone-200/70 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                  <Layers className="w-3.5 h-3.5 text-[#516050] dark:text-[#8FB996]" />
                  <span>短语拆解</span>
                </div>
                {isViewingSubWord && (
                  <button
                    onClick={() => onSelectSubWord(null)}
                    className="text-xs text-[#516050] dark:text-[#8FB996] hover:underline font-medium cursor-pointer"
                  >
                    查看完整短语
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-0.5">
                {stackItem.wordItem.subWords.map((sub, idx) => {
                  const isSelected = stackItem.activeSubWord?.word.toLowerCase() === sub.word.toLowerCase();
                  return (
                    <button
                      key={idx}
                      onClick={() => onSelectSubWord(isSelected ? null : sub)}
                      className={`px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-[#516050] text-white shadow-xs font-medium'
                          : 'bg-white dark:bg-white/10 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-white/10 hover:border-stone-400'
                      }`}
                    >
                      <span>{sub.word}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 动态常驻语境与核心搭配区（即使在拉到中间或半展开时也始终存在，无空白断层） */}
        <div className="space-y-6 pt-3">
          <div className="w-full border-t border-stone-200/80 dark:border-white/10 my-3.5" />

          {/* SECTION 2: 语境浸润 (CONTEXTUAL IMMERSION) */}
          {(songContext.found || ieltsContext.found) && (
            <div className="space-y-4 pt-1">
              <div className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
                CONTEXTUAL IMMERSION
              </div>

              {/* 歌词语境 */}
              {songContext.found && (
                <div className="relative pl-3.5 py-1 border-l-2 border-[#516050] dark:border-[#8FB996] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-sans font-medium uppercase tracking-wider text-[#516050] dark:text-[#8FB996]">
                    <Music2 className="w-3.5 h-3.5" />
                    <span>LYRICS · {songContext.songTitle}</span>
                  </div>

                  <p className="font-serif-luxury text-[16px] text-stone-900 dark:text-stone-100 leading-[1.6]">
                    "<HighlightedText 
                      text={songContext.lyricEn || ''} 
                      targetWord={currentItem.word} 
                      onWordClick={(word, s) => onPushWord(word, s)}
                    />"
                  </p>

                  <p className="text-[12.5px] text-stone-500 dark:text-stone-400 font-sans leading-relaxed">
                    {songContext.lyricCn}
                  </p>
                </div>
              )}

              {/* 雅思学术例句语境 */}
              {ieltsContext.found && (
                <div className="relative pl-3.5 py-1 border-l-2 border-[#A86F3E] dark:border-amber-400 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-sans font-medium uppercase tracking-wider text-[#A86F3E] dark:text-amber-300">
                    <span>IELTS ACADEMIC · PASSAGE 2</span>
                  </div>

                  <p className="font-serif-luxury text-[16px] text-stone-900 dark:text-stone-100 leading-[1.6]">
                    "<HighlightedText 
                      text={ieltsContext.sentenceEn} 
                      targetWord={currentItem.word} 
                      highlightClassName="font-semibold text-stone-950 dark:text-stone-50 underline decoration-[#A86F3E] dark:decoration-amber-400 decoration-[1.75px] underline-offset-[5px] bg-[#A86F3E]/[0.08] dark:bg-amber-400/[0.15] px-1.5 py-0.5 rounded-sm cursor-pointer hover:bg-[#A86F3E]/15 transition-all"
                      onWordClick={(word, s) => onPushWord(word, s)}
                    />"
                  </p>

                  <p className="text-[12.5px] text-stone-500 dark:text-stone-400 font-sans leading-relaxed">
                    {ieltsContext.sentenceCn}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: 雅思核心搭配 (COLLOCATIONS) */}
          {collocations.length > 0 && (
            <div className="space-y-2.5 pt-4 mt-6 border-t border-stone-200/80 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#516050] dark:text-[#8FB996]" />
                  <span>COLLOCATIONS · 核心搭配</span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">
                  {collocations.length} ENTRIES
                </span>
              </div>

              <div className="divide-y divide-stone-200/60 dark:divide-white/5">
                {collocations?.filter(Boolean).map((colloc, idx) => (
                  <div
                    key={idx}
                    onClick={() => colloc?.phrase && onPushWord(colloc.phrase, colloc.cn || '')}
                    className="py-2.5 px-2 rounded-xl transition-all flex items-center justify-between group cursor-pointer hover:bg-stone-900/[0.03] dark:hover:bg-white/[0.04] active:scale-[0.99]"
                    title="点击展开二级抽屉"
                  >
                    <div className="flex flex-col min-w-0 pr-3 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-serif-luxury text-[15px] font-medium text-stone-900 dark:text-stone-100 group-hover:text-[#516050] dark:group-hover:text-[#8FB996] transition-colors leading-snug">
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

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (colloc?.phrase) speakWord(colloc.phrase, 'en-US');
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-[#516050] dark:hover:text-[#8FB996] hover:bg-stone-200/60 dark:hover:bg-white/10 active:scale-90 transition-all flex-shrink-0 cursor-pointer"
                      title="朗读搭配发音"
                      aria-label="朗读搭配发音"
                    >
                      <Volume2 className="w-3.5 h-3.5 stroke-[1.75]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const WordDrawer: React.FC<WordDrawerProps> = ({
  wordItem,
  isOpen,
  onClose
}) => {
  // 抽屉多级堆叠历史栈（Level 1 -> Level 2 -> Level 3...）
  const [drawerStack, setDrawerStack] = useState<DrawerStackItem[]>(() =>
    wordItem ? [{ wordItem, activeSubWord: null, wasExpanded: false, scrollTop: 0 }] : []
  );
  
  // 核心两态：false = 初始预览态 (PEEK), true = 完全展开态 (EXPANDED)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const peekContentRef = useRef<HTMLDivElement>(null);

  // 物理 Motion Value：顶层抽屉从完全展开状态 (y=0) 向下平移的像素距离
  const y = useMotionValue(600);
  const [peekOffsetPx, setPeekOffsetPx] = useState<number>(360);

  const isDraggingRef = useRef<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartMotionYRef = useRef<number>(0);
  const lastPointerYRef = useRef<number>(0);
  const lastPointerTimeRef = useRef<number>(0);
  const pointerVelocityYRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);
  const ignoreClickRef = useRef<boolean>(false);

  // 展开态高度占比：94.5% 屏高
  const EXPANDED_HEIGHT_RATIO = 0.945;
  // 每一级堆叠在顶部向下错落露出的物理阶梯像素 (12px)
  const STACK_STEP_PX = 12;

  // 根据内容高度计算精确的 PEEK 态向下偏移值，以横线上方的释义内容为界，严丝合缝不露下方内容
  const calculateOffsetFromContentHeight = (contentH: number) => {
    if (!containerRef.current) return 360;
    const containerH = containerRef.current.offsetHeight || 800;
    const expandedH = containerH * EXPANDED_HEIGHT_RATIO;
    // 顶部拖拽把手区(24px) + 滚动容器顶部内边距(4px) = 28px
    const topChromeH = 28;
    const desiredPeekH = Math.min(contentH + topChromeH, expandedH - 50);
    const offset = Math.max(expandedH - desiredPeekH, 60);
    return offset;
  };

  // 精确测量 PEEK 态高度差
  const measureOffsets = () => {
    let peekContentH = 270;
    if (peekContentRef.current) {
      peekContentH = Math.max(
        peekContentRef.current.offsetHeight,
        peekContentRef.current.scrollHeight,
        peekContentRef.current.getBoundingClientRect().height
      );
    }
    const offset = calculateOffsetFromContentHeight(peekContentH);
    setPeekOffsetPx(offset);
    return offset;
  };

  // 通过 ResizeObserver 动态感知任意单词（短词、长多音标词、多行释义词如 micro-habitat）的真实 DOM 高度
  useEffect(() => {
    const el = peekContentRef.current;
    if (!el || !isOpen) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = Math.max(entry.contentRect.height, el.scrollHeight || 0);
        if (h > 40) {
          const exactOffset = calculateOffsetFromContentHeight(h);
          setPeekOffsetPx(exactOffset);
          if (!isExpanded && !isDraggingRef.current) {
            // 平滑跟随微调，不突兀硬设
            animate(y, exactOffset, { duration: 0.15, ease: 'easeOut' });
          }
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen, isExpanded, drawerStack.length, drawerStack[drawerStack.length - 1]?.wordItem.word, drawerStack[drawerStack.length - 1]?.activeSubWord?.word]);

  // 当外部 wordItem 改变或打开时，初始化抽屉并以与二级抽屉完全一致的轻柔丝滑无过冲动画弹出
  useLayoutEffect(() => {
    if (wordItem && isOpen) {
      setDrawerStack([{ wordItem, activeSubWord: null, wasExpanded: false, scrollTop: 0 }]);
      setIsExpanded(false);
      
      const offset = measureOffsets() || 360;
      y.set(offset + 140);
      animate(y, offset, {
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1]
      });
    } else if (!isOpen) {
      setDrawerStack([]);
      setIsExpanded(false);
    }
  }, [wordItem?.word, isOpen]);

  // 阻尼状态切换（完全展开 / 半展开收起）
  const animateToState = (expanded: boolean, velocity: number = 0) => {
    const targetY = expanded ? 0 : peekOffsetPx;
    setIsExpanded(expanded);
    
    if (expanded) {
      animate(y, targetY, {
        type: 'spring',
        damping: 34,
        stiffness: 300,
        mass: 0.85,
        velocity: Math.min(Math.max(velocity * 1000, -1000), 1000)
      });
    } else {
      animate(y, targetY, {
        type: 'spring',
        damping: 36,
        stiffness: 280,
        mass: 0.9,
        velocity: Math.min(Math.max(velocity * 1000, -600), 600)
      });
    }
  };

  const stackLength = drawerStack.length;
  const currentStackIndex = Math.max(0, stackLength - 1);
  const currentStackItem = drawerStack[currentStackIndex] || (wordItem ? { wordItem, activeSubWord: null } : null);

  if (!isOpen || !currentStackItem) return null;

  const handleToggleMastery = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentItem = currentStackItem.activeSubWord || currentStackItem.wordItem;
    const nextLevel = await cycleWordMastery(currentItem.word, currentItem);
    setDrawerStack(prev => {
      const copy = [...prev];
      const target = copy[currentStackIndex];
      if (target) {
        if (target.activeSubWord) {
          target.activeSubWord = { ...target.activeSubWord, masteryLevel: nextLevel, isStarred: nextLevel > 0 };
        } else {
          target.wordItem = { ...target.wordItem, masteryLevel: nextLevel, isStarred: nextLevel > 0 };
        }
      }
      return copy;
    });
  };

  const handleScrollUpdate = (scrollTop: number) => {
    setDrawerStack(prev => {
      if (!prev[currentStackIndex]) return prev;
      const copy = [...prev];
      copy[currentStackIndex] = { ...copy[currentStackIndex], scrollTop };
      return copy;
    });
  };

  // 点击例句/搭配/成分中的单词：推入新的一级抽屉（上一级抽屉保持并在底层停留，新抽屉以半展开 Peek 态轻柔滑入）
  const handlePushNewDrawer = async (clickedWord: string, sentence?: string) => {
    const item = await lookupWord(clickedWord, sentence || '');
    if (item) {
      setDrawerStack(prev => [
        ...prev.map((it, i) => (i === prev.length - 1 ? { ...it, wasExpanded: isExpanded } : it)),
        { wordItem: item, activeSubWord: null, wasExpanded: false, scrollTop: 0 }
      ]);
      setIsExpanded(false);
      const offset = measureOffsets() || 360;
      y.set(offset + 140);
      animate(y, offset, {
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1]
      });
    }
  };

  // 返回上一级抽屉（上一级抽屉恢复其原本的展开状态）
  const handlePopDrawer = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (drawerStack.length > 1) {
      const prevTarget = drawerStack[drawerStack.length - 2];
      const shouldExpand = prevTarget?.wasExpanded !== false;
      const targetY = shouldExpand ? 0 : (measureOffsets() || 360);

      animate(y, peekOffsetPx + 260, { duration: 0.2, ease: [0.32, 0, 0.67, 0] }).then(() => {
        setDrawerStack(prev => prev.slice(0, prev.length - 1));
        setIsExpanded(shouldExpand);
        y.set(targetY);
      });
    } else {
      animate(y, peekOffsetPx + 360, { duration: 0.22, ease: [0.32, 0, 0.67, 0] }).then(onClose);
    }
  };

  // 点击背景遮罩空白区域：多层时返回上一级，单层时关闭抽屉
  const handleBackdropClick = () => {
    if (drawerStack.length > 1) {
      handlePopDrawer();
    } else {
      animate(y, peekOffsetPx + 360, { duration: 0.22, ease: [0.32, 0, 0.67, 0] }).then(onClose);
    }
  };

  // 点击底层露出的堆叠卡片边缘，直接快速回退到该层
  const handleJumpToLayer = (targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < drawerStack.length - 1) {
      const targetItem = drawerStack[targetIndex];
      const shouldExpand = targetItem?.wasExpanded !== false;
      const targetY = shouldExpand ? 0 : (measureOffsets() || 360);

      animate(y, peekOffsetPx + 260, { duration: 0.2, ease: [0.32, 0, 0.67, 0] }).then(() => {
        setDrawerStack(prev => prev.slice(0, targetIndex + 1));
        setIsExpanded(shouldExpand);
        y.set(targetY);
      });
    }
  };

  // 手势引擎：把手与顶部安全区拖拽
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartYRef.current = e.clientY;
    dragStartMotionYRef.current = y.get();
    lastPointerYRef.current = e.clientY;
    lastPointerTimeRef.current = performance.now();
    pointerVelocityYRef.current = 0;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const now = performance.now();
      const dt = Math.max(now - lastPointerTimeRef.current, 1);
      const dy = moveEvent.clientY - lastPointerYRef.current;
      
      pointerVelocityYRef.current = dy / dt;
      lastPointerYRef.current = moveEvent.clientY;
      lastPointerTimeRef.current = now;

      const totalDeltaY = moveEvent.clientY - dragStartYRef.current;
      if (Math.abs(totalDeltaY) > 4) {
        hasDraggedRef.current = true;
      }

      let nextY = dragStartMotionYRef.current + totalDeltaY;
      if (nextY < 0) {
        nextY = nextY * 0.22; // 顶部橡皮筋阻尼
      }
      y.set(nextY);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      isDraggingRef.current = false;

      if (hasDraggedRef.current) {
        ignoreClickRef.current = true;
        setTimeout(() => {
          ignoreClickRef.current = false;
        }, 200);
      }

      const currentY = y.get();
      const velocity = pointerVelocityYRef.current;
      const midpoint = peekOffsetPx * 0.5;

      // 1. 关闭/弹出判定：大幅下滑则关闭或弹出当前层
      if (currentY > peekOffsetPx + 40 || (currentY > peekOffsetPx - 30 && velocity > 0.65)) {
        if (drawerStack.length > 1) {
          handlePopDrawer();
        } else {
          animate(y, peekOffsetPx + 400, { duration: 0.22, ease: [0.32, 0, 0.67, 0] }).then(onClose);
        }
        return;
      }

      // 2. 50% 中线与动量吸附
      if (velocity < -0.35) {
        animateToState(true, velocity);
      } else if (velocity > 0.35) {
        animateToState(false, velocity);
      } else if (currentY < midpoint) {
        animateToState(true, velocity);
      } else {
        animateToState(false, velocity);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleTopBarClick = () => {
    if (ignoreClickRef.current) return;
    animateToState(!isExpanded);
  };

  return (
    <div 
      ref={containerRef}
      id="word-drawer-mobile-wrapper"
      className="absolute inset-0 z-[60] pointer-events-none flex flex-col justify-end overflow-hidden rounded-[inherit]"
    >
      {/* 背景遮罩 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
        className="absolute inset-0 bg-stone-900/45 dark:bg-black/75 backdrop-blur-[2px] pointer-events-auto"
      />

      {/* 
        底层堆叠卡片渲染（Underlying Stacked Layers: Level 1, Level 2...）
        - 每一层背景卡片的层级深度：
          - 若顶层卡片处于半展开态（isExpanded = false）：背景卡片的视觉顶部为上一层已展开卡片（currentStackIndex - 1），各层背景卡片保持相对间距（0, 12px, 24px...）与缩放，上一层卡片为 scale: 1，更深层依次 scale: 1 - 0.045*depth；
          - 若顶层卡片完全展开（isExpanded = true）：顶层卡片为 scale: 1，背景各层依次 scale: 1 - 0.045*(currentStackIndex - idx)。
      */}
      {drawerStack.map((item, idx) => {
        if (idx === currentStackIndex) return null; // 顶层活动卡片在下方由 y 驱动

        const parentExpandedIndex = Math.max(0, currentStackIndex - 1);
        const depth = isExpanded
          ? currentStackIndex - idx
          : parentExpandedIndex - idx;

        const stepOffsetTop = idx * STACK_STEP_PX;
        const scaleVal = Math.max(1 - depth * 0.045, 0.88);

        return (
          <motion.div
            key={`stacked-under-layer-${idx}-${item.wordItem.word}`}
            initial={{ scale: scaleVal, opacity: 1 }}
            animate={{
              scale: scaleVal,
              opacity: 1,
              y: 0
            }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            onClick={() => handleJumpToLayer(idx)}
            style={{
              height: `${EXPANDED_HEIGHT_RATIO * 100}%`,
              top: `${(1 - EXPANDED_HEIGHT_RATIO) * 100}%`,
              marginTop: `${stepOffsetTop}px`,
              transformOrigin: 'top center'
            }}
            className="absolute inset-x-0 mx-auto rounded-t-[28px] bg-[#FAF8F5] dark:bg-[#121622] border-t border-white/80 dark:border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.22)] pointer-events-auto cursor-pointer select-none overflow-hidden transition-colors"
            title={`点击回退至: ${item.wordItem.word}`}
          >
            {/* 完整渲染上一层抽屉的真实单词内容 */}
            <DrawerCardView
              stackItem={item}
              stackLength={stackLength}
              cardIndex={idx}
              currentStackIndex={currentStackIndex}
              isExpanded={true}
              isTopCard={false}
              onPopDrawer={handlePopDrawer}
              onCloseAll={onClose}
              onToggleExpand={() => {}}
              onPushWord={handlePushNewDrawer}
              onSelectSubWord={(sub) => {
                setDrawerStack(prev => {
                  const copy = [...prev];
                  if (copy[idx]) {
                    copy[idx].activeSubWord = sub;
                  }
                  return copy;
                });
              }}
              onToggleMastery={handleToggleMastery}
            />

            {/* 半透明压暗遮罩（暗化背景卡片，聚焦前景），点击可退回 */}
            <div className="absolute inset-0 bg-stone-900/25 dark:bg-black/45 hover:bg-stone-900/15 transition-colors pointer-events-none" />
          </motion.div>
        );
      })}

      {/* 
        顶层活动抽屉（Top Active Sheet）
      */}
      <motion.div
        ref={sheetRef}
        id="word-drawer-sheet"
        style={{
          height: `${EXPANDED_HEIGHT_RATIO * 100}%`,
          top: `${(1 - EXPANDED_HEIGHT_RATIO) * 100}%`,
          marginTop: `${isExpanded ? currentStackIndex * STACK_STEP_PX : 0}px`,
          y: y,
          transformOrigin: 'top center'
        }}
        className="absolute inset-x-0 mx-auto rounded-t-[28px] bg-[#FAF8F5] dark:bg-[#121622] shadow-[0_-16px_44px_rgba(0,0,0,0.28)] flex flex-col overflow-hidden pointer-events-auto select-none text-stone-900 dark:text-stone-100 will-change-transform border-t border-white/80 dark:border-white/10 z-[65]"
      >
        <DrawerCardView
          key={`active-top-${currentStackIndex}-${currentStackItem.wordItem.word}`}
          stackItem={currentStackItem}
          stackLength={stackLength}
          cardIndex={currentStackIndex}
          currentStackIndex={currentStackIndex}
          isExpanded={isExpanded}
          isTopCard={true}
          onPopDrawer={handlePopDrawer}
          onCloseAll={onClose}
          onToggleExpand={handleTopBarClick}
          onPushWord={handlePushNewDrawer}
          onSelectSubWord={(sub) => {
            setDrawerStack(prev => {
              const copy = [...prev];
              if (copy[currentStackIndex]) {
                copy[currentStackIndex].activeSubWord = sub;
              }
              return copy;
            });
          }}
          onToggleMastery={handleToggleMastery}
          onScrollUpdate={handleScrollUpdate}
          peekContentRef={peekContentRef}
          onDragStart={handleDragStart}
        />
      </motion.div>
    </div>
  );
};
