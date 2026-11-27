import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
import { Volume2, Layers } from 'lucide-react';
import { WordItem, MasteryLevel, SubWordItem } from '../types';
import { speakWord, isAutoPronounceEnabled, getStoredAccentPreference } from '../utils/audioEngine';
import { cycleWordMastery, db } from '../db';
import { HighlightedText, ClickableWordHeading } from './HighlightedText';
import { ContextualImmersionSection } from './ContextualImmersionSection';
import { getCollocationsForWord, parseStructuredDefinitions, CollocationItem } from '../utils/collocationDictionary';
import { findSongContextInPlaylist, findIELTSAcademicContext } from '../utils/contextFinder';
import { lookupWord, formatPartOfSpeech, ONLINE_LOOKUP_LOADING_TEXT } from '../utils/lyricDictionary';
import { triggerHighRefreshBoost } from '../utils/displayRefreshRate';
import { useAppStore } from '../store/useAppStore';

interface WordDrawerProps {
  wordItem: WordItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSubWord?: (word: string) => void;
  zIndexClass?: string;
}

interface DrawerStackItem {
  wordItem: WordItem;
  activeSubWord: SubWordItem | null;
  wasExpanded?: boolean;
  savedY?: number;
  scrollTop?: number;
}

// Keep English POS abbreviation in editorial serif italic while rendering Chinese upright
function splitPosParts(posStr: string): { abbr: string; cn: string } {
  const match = posStr.match(/^([a-zA-Z.+\s/]+?)(?:\s*\(?([\u4e00-\u9fa5/+]+)\)?)?$/);
  if (!match) return { abbr: posStr, cn: '' };
  return { abbr: (match[1] || '').trim(), cn: (match[2] || '').trim() };
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
  onScrollUpdate?: (cardIdx: number, scrollTop: number) => void;
  getSavedScrollTop?: (cardIdx: number) => number;
  peekContentRef?: React.RefObject<HTMLDivElement>;
  onDragStart?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const DrawerCardView: React.FC<DrawerCardViewProps> = React.memo(({
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
  getSavedScrollTop,
  peekContentRef,
  onDragStart
}) => {
  const [playingUk, setPlayingUk] = useState(false);
  const [playingUs, setPlayingUs] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentItem = stackItem.activeSubWord || stackItem.wordItem;
  const isViewingSubWord = Boolean(stackItem.activeSubWord);
  const currentMastery = (currentItem.masteryLevel ?? (currentItem.isStarred ? 1 : 0)) as MasteryLevel;

  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      const savedTop = getSavedScrollTop ? getSavedScrollTop(cardIndex) : (stackItem.scrollTop || 0);
      scrollContainerRef.current.scrollTop = savedTop;
    }
    if (isTopCard && isAutoPronounceEnabled() && !currentItem.word.includes(' ')) {
      const preferredAccent = getStoredAccentPreference();
      speakWord(currentItem.word, preferredAccent);
    }
  }, [stackItem.wordItem.word, stackItem.activeSubWord?.word, cardIndex, currentStackIndex, isTopCard, getSavedScrollTop]);

  const songContext = useMemo(
    () => findSongContextInPlaylist(currentItem.word, currentItem),
    [currentItem]
  );
  const ieltsContext = useMemo(
    () => findIELTSAcademicContext(currentItem.word),
    [currentItem.word]
  );
  const structuredDefs = useMemo(
    () => parseStructuredDefinitions(currentItem.definitionCn, currentItem.partOfSpeech),
    [currentItem.definitionCn, currentItem.partOfSpeech]
  );
  const collocations: CollocationItem[] = useMemo(
    () => getCollocationsForWord(currentItem.word),
    [currentItem.word]
  );

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
            onScrollUpdate(cardIndex, e.currentTarget.scrollTop);
          }
        }}
        className={`flex-1 overflow-y-auto no-scrollbar px-6 pt-1 pb-10 ${!isTopCard ? 'pointer-events-none' : ''}`}
      >
        {/* SECTION 1: 初始态展示区域 */}
        <div ref={isTopCard ? peekContentRef : undefined} className="space-y-3 pb-5">
          {/* 词头 + 词性 + 右上角掌握度球 */}
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
                <ClickableWordHeading word={currentItem.word} onWordClick={onPushWord} />
              </h1>
              
              {/* 英文词性斜体 + 中文正体，避免中文被强行拉斜 */}
              {!currentItem.word.trim().includes(' ') && (() => {
                const formatted = formatPartOfSpeech(currentItem.partOfSpeech, currentItem.word);
                if (!formatted) return null;
                const { abbr, cn } = splitPosParts(formatted);
                return (
                  <span className="inline-flex items-baseline gap-1.5">
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
                  </span>
                );
              })()}
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
                        ? 'text-stone-700 dark:text-stone-300'
                        : currentMastery === 2
                        ? 'text-[#C87D32] dark:text-amber-400'
                        : 'text-stone-900 dark:text-stone-100'
                    }`}
                  />

                  {currentMastery === 1 && (
                    <circle
                      cx="12"
                      cy="12"
                      r="1.5"
                      fill="currentColor"
                      className="text-stone-700 dark:text-stone-300 transition-all duration-300"
                    />
                  )}

                  {currentMastery === 2 && (
                    <circle
                      cx="12"
                      cy="12"
                      r="3.6"
                      fill="currentColor"
                      className="text-[#C87D32] dark:text-amber-400 transition-all duration-300"
                    />
                  )}

                  {currentMastery === 3 && (
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
                <Volume2 className={`w-3.5 h-3.5 ${playingUk ? 'text-stone-900 dark:text-stone-100 scale-110' : 'text-stone-400 dark:text-stone-500'} transition-transform`} />
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
                <Volume2 className={`w-3.5 h-3.5 ${playingUs ? 'text-stone-900 dark:text-stone-100 scale-110' : 'text-stone-400 dark:text-stone-500'} transition-transform`} />
                <span className="font-serif text-[13.5px] font-normal tracking-wide text-stone-900 dark:text-stone-100">
                  {currentItem.phoneticUs || `/${currentItem.word}/`}
                </span>
              </button>
            </div>
          )}

          {/* 释义 (核心释义 + 英文解释，跨词性整齐对齐) */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-sans font-medium tracking-[0.08em] text-stone-400 dark:text-stone-500">
              释义
            </div>

            {currentItem.definitionCn === ONLINE_LOOKUP_LOADING_TEXT || currentItem.definitionCn === '正在联网查询释义…' ? (
              <div className="space-y-2.5 py-1.5">
                <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-700 dark:bg-stone-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-stone-900 dark:bg-stone-100"></span>
                  </span>
                  <span className="text-[13.5px] font-sans font-medium text-stone-600 dark:text-stone-300 animate-pulse tracking-wide">
                    正在联网检索释义…
                  </span>
                </div>
                {/* 优雅柔和的双行骨架条 */}
                <div className="space-y-1.5 pt-0.5 max-w-[85%] animate-pulse">
                  <div className="h-3.5 bg-stone-200/80 dark:bg-white/[0.08] rounded-full w-4/5"></div>
                  <div className="h-3 bg-stone-200/50 dark:bg-white/[0.05] rounded-full w-1/2"></div>
                </div>
              </div>
            ) : structuredDefs.length > 1 ? (
              <div className="space-y-1.5 pt-0.5">
                {structuredDefs.map((defItem, idx) => (
                  <div key={idx} className="flex items-baseline gap-2.5 text-stone-900 dark:text-stone-100">
                    {defItem.pos ? (
                      <span className="text-[12px] font-serif italic text-stone-600 dark:text-stone-300 font-medium min-w-[3.5rem] flex-shrink-0 select-none">
                        {defItem.pos}
                      </span>
                    ) : structuredDefs.some(d => d.pos) ? (
                      <span className="min-w-[3.5rem] flex-shrink-0 select-none" aria-hidden="true" />
                    ) : null}
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

            {currentItem.definitionCn !== ONLINE_LOOKUP_LOADING_TEXT &&
              currentItem.definitionCn !== '正在联网查询释义…' &&
              currentItem.definition && 
              !currentItem.definition.startsWith('Vocabulary item:') &&
              !currentItem.definition.startsWith('Contextual expression:') &&
              !currentItem.definition.startsWith('Lyric expression') &&
              !currentItem.definition.startsWith('Specialized term ') &&
              !currentItem.definition.startsWith('Key vocabulary') &&
              !currentItem.definition.startsWith('Proper noun,') && (
              <p className="text-[13px] text-stone-500 dark:text-stone-400 font-sans leading-relaxed pt-0.5">
                <HighlightedText
                  text={currentItem.definition}
                  targetWord=""
                  onWordClick={(word, s) => onPushWord(word, s)}
                />
              </p>
            )}
          </div>

          {/* Sub-Word Breakdown if compound phrase */}
          {stackItem.wordItem.subWords && stackItem.wordItem.subWords.length > 0 && (
            <div className="p-3 mt-2 rounded-xl bg-stone-900/[0.02] dark:bg-white/[0.03] border border-stone-200/70 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                  <Layers className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                  <span>短语拆解</span>
                </div>
                {isViewingSubWord && (
                  <button
                    onClick={() => onSelectSubWord(null)}
                    className="text-xs text-stone-700 dark:text-stone-300 hover:underline font-medium cursor-pointer"
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
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 shadow-xs font-medium'
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
        <div className="space-y-6 pt-1">
          <div className="w-full border-t border-stone-200/80 dark:border-white/10 mt-0.5 mb-4" />

          {/* SECTION 2: 语境例句 */}
          <ContextualImmersionSection
            word={currentItem.word}
            songContext={songContext}
            ieltsContext={ieltsContext}
            examples={currentItem.examples}
            variant="drawer"
            onWordClick={onPushWord}
          />

          {/* SECTION 3: 核心搭配 */}
          {collocations.length > 0 && (
            <div className="space-y-2.5 pt-4 mt-6 border-t border-stone-200/80 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-sans font-medium tracking-[0.08em] text-stone-400 dark:text-stone-500">
                  核心搭配
                </div>
                <span className="text-[11px] font-mono tabular-nums text-stone-400 dark:text-stone-500">
                  {collocations.length} 组
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
                        <span className="font-serif-luxury text-[15px] font-medium text-stone-900 dark:text-stone-100 group-hover:text-stone-950 dark:group-hover:text-white transition-colors leading-snug">
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
                      className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-white/10 active:scale-90 transition-all flex-shrink-0 cursor-pointer"
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
});

export const WordDrawer: React.FC<WordDrawerProps> = ({
  wordItem,
  isOpen,
  onClose,
  zIndexClass = 'z-[60]'
}) => {
  // 抽屉多级堆叠历史栈（Level 1 -> Level 2 -> Level 3...）
  const [drawerStack, setDrawerStack] = useState<DrawerStackItem[]>(() =>
    wordItem ? [{ wordItem, activeSubWord: null, wasExpanded: false, scrollTop: 0 }] : []
  );
  
  // 核心两态：false = 初始预览态 (PEEK), true = 完全展开态 (EXPANDED)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // 内部挂载状态，确保 Android 全面屏手势返回时能完整播放退场动画
  const [isMounted, setIsMounted] = useState<boolean>(() => Boolean(isOpen && wordItem));
  // 正在退场的目标层级索引：用于同步淡出底层目标卡片的压暗遮罩，消除切换瞬间闪烁
  const [poppingTargetIdx, setPoppingTargetIdx] = useState<number | null>(null);
  const backdropOpacity = useMotionValue(0);
  const isClosingRef = useRef<boolean>(false);
  const isPoppingRef = useRef<boolean>(false);
  const lookupSeqRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const pollTimersRef = useRef<Set<ReturnType<typeof setInterval>>>(new Set());
  const isOpenRef = useRef<boolean>(isOpen);
  isOpenRef.current = isOpen;
  const drawerStackRef = useRef<DrawerStackItem[]>(drawerStack);
  drawerStackRef.current = drawerStack;
  const onCloseRef = useRef<() => void>(onClose);
  onCloseRef.current = onClose;
  const handlePopDrawerRef = useRef<() => void>(() => {});

  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const peekContentRef = useRef<HTMLDivElement>(null);
  const scrollTopMapRef = useRef<Map<number, number>>(new Map());
  const isEntryAnimatingRef = useRef<boolean>(false);
  const peekOffsetPxRef = useRef<number>(360);
  const pendingStackTransitionRef = useRef<
    | { type: 'push'; containerH: number }
    | { type: 'pop'; startY: number; shouldExpand: boolean }
    | null
  >(null);

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
  const calculateOffsetFromContentHeight = useCallback((contentH: number) => {
    if (!containerRef.current) return 360;
    const containerH = containerRef.current.offsetHeight || 800;
    const expandedH = containerH * EXPANDED_HEIGHT_RATIO;
    // 顶部拖拽把手区(24px) + 滚动容器顶部内边距(4px) = 28px
    const topChromeH = 28;
    const desiredPeekH = Math.min(contentH + topChromeH, expandedH - 50);
    const offset = Math.max(expandedH - desiredPeekH, 60);
    return offset;
  }, []);

  // 精确测量 PEEK 态高度差
  const measureOffsets = useCallback(() => {
    let peekContentH = 270;
    if (peekContentRef.current) {
      peekContentH = Math.max(
        peekContentRef.current.offsetHeight,
        peekContentRef.current.scrollHeight,
        peekContentRef.current.getBoundingClientRect().height
      );
    }
    const offset = calculateOffsetFromContentHeight(peekContentH);
    peekOffsetPxRef.current = offset;
    setPeekOffsetPx(offset);
    return offset;
  }, [calculateOffsetFromContentHeight]);

  // 通过 ResizeObserver 动态感知任意单词（短词、长多音标词、多行释义词如 micro-habitat）的真实 DOM 高度
  useEffect(() => {
    const el = peekContentRef.current;
    if (!el || !isOpen) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = Math.max(entry.contentRect.height, el.scrollHeight || 0);
        if (h > 40) {
          const exactOffset = calculateOffsetFromContentHeight(h);
          const diff = Math.abs(exactOffset - peekOffsetPxRef.current);
          if (diff >= 1.5) {
            peekOffsetPxRef.current = exactOffset;
            setPeekOffsetPx(exactOffset);
            if (!isExpanded && !isDraggingRef.current && !isEntryAnimatingRef.current) {
              // 仅在非入场动画期间微调，避免首帧打断 280ms 弹簧入场曲线
              animate(y, exactOffset, { duration: 0.15, ease: 'easeOut' });
            }
          }
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen, isExpanded, drawerStack.length, drawerStack[drawerStack.length - 1]?.wordItem.word, drawerStack[drawerStack.length - 1]?.activeSubWord?.word, calculateOffsetFromContentHeight, y]);

  const clearAllPollTimers = useCallback(() => {
    pollTimersRef.current.forEach(timer => clearInterval(timer));
    pollTimersRef.current.clear();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      lookupSeqRef.current += 1;
      clearAllPollTimers();
    };
  }, [clearAllPollTimers]);

  // 当外部 wordItem 改变或打开时，初始化抽屉并执行平滑入场动画；当 isOpen 变为 false 时执行完整退场动画
  useLayoutEffect(() => {
    if (wordItem && isOpen) {
      isClosingRef.current = false;
      isPoppingRef.current = false;
      lookupSeqRef.current += 1;
      clearAllPollTimers();
      setIsMounted(true);
      triggerHighRefreshBoost(1000);
      scrollTopMapRef.current.clear();
      setDrawerStack([{ wordItem, activeSubWord: null, wasExpanded: false, scrollTop: 0 }]);
      setIsExpanded(false);

      animate(backdropOpacity, 1, { duration: 0.22, ease: 'easeOut' });
      
      const offset = measureOffsets() || 360;
      isEntryAnimatingRef.current = true;
      y.jump(offset + 140);
      const controls = animate(y, offset, {
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1]
      });
      controls.then(() => {
        if (!isMountedRef.current) return;
        isEntryAnimatingRef.current = false;
        const latestOffset = measureOffsets();
        if (Math.abs(latestOffset - offset) >= 2 && !isDraggingRef.current) {
          animate(y, latestOffset, { duration: 0.14, ease: 'easeOut' });
        }
      });
    } else if (!isOpen && isMounted) {
      // 外部将 isOpen 置为 false（例如 Android 全面屏手势返回触发 closeWordDetail）
      if (!isClosingRef.current) {
        isClosingRef.current = true;
        isPoppingRef.current = false;
        setPoppingTargetIdx(null);
        pendingStackTransitionRef.current = null;
        lookupSeqRef.current += 1;
        clearAllPollTimers();
        triggerHighRefreshBoost(800);
        const exitY = Math.ceil((containerRef.current?.offsetHeight || 800) * EXPANDED_HEIGHT_RATIO) + 24;
        animate(backdropOpacity, 0, { duration: 0.22, ease: 'easeIn' });
        animate(y, exitY, {
          duration: 0.22,
          ease: [0.32, 0, 0.67, 0]
        }).then(() => {
          if (isMountedRef.current && !isOpenRef.current) {
            setIsMounted(false);
            setDrawerStack([]);
            setIsExpanded(false);
            scrollTopMapRef.current.clear();
            isClosingRef.current = false;
            isPoppingRef.current = false;
          }
        });
      }
    }
  }, [wordItem?.word, isOpen, isMounted, measureOffsets, y, backdropOpacity, clearAllPollTimers]);

  // 原子化处理多层推入/回退后的 y 坐标同步：在 React DOM 替换完成、浏览器绘制前精确接管，彻底消除 1 帧闪烁与瞬移
  useLayoutEffect(() => {
    const pending = pendingStackTransitionRef.current;
    if (!pending) return;
    pendingStackTransitionRef.current = null;

    if (pending.type === 'push') {
      isEntryAnimatingRef.current = true;
      const offset = measureOffsets() || 360;
      y.jump(Math.min(offset + 180, pending.containerH));
      animate(y, offset, {
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1]
      }).then(() => {
        if (!isMountedRef.current) return;
        isEntryAnimatingRef.current = false;
        const latestOffset = measureOffsets();
        if (Math.abs(latestOffset - offset) >= 2 && !isDraggingRef.current) {
          animate(y, latestOffset, { duration: 0.14, ease: 'easeOut' });
        }
      });
    } else if (pending.type === 'pop') {
      y.jump(pending.startY);
      if (!pending.shouldExpand) {
        isEntryAnimatingRef.current = true;
        const targetPeekY = measureOffsets() || 360;
        animate(y, targetPeekY, {
          type: 'spring',
          damping: 34,
          stiffness: 300,
          mass: 0.85,
          velocity: 0
        }).then(() => {
          if (isMountedRef.current) {
            isEntryAnimatingRef.current = false;
          }
        });
      } else {
        isEntryAnimatingRef.current = false;
      }
    }
  }, [drawerStack.length, measureOffsets, y]);

  // Register top-priority Android hardware back handler while drawer is open
  useEffect(() => {
    const setBackHandler = useAppStore.getState().setWordDrawerBackHandler;
    if (!isOpen) return;

    const handler = () => {
      if (!isOpenRef.current || isClosingRef.current) {
        return false;
      }
      if (isPoppingRef.current) {
        return true;
      }
      if (drawerStackRef.current.length > 1) {
        handlePopDrawerRef.current();
        return true;
      }
      onCloseRef.current();
      return true;
    };

    setBackHandler(handler);
    return () => {
      if (useAppStore.getState().wordDrawerBackHandler === handler) {
        setBackHandler(null);
      }
    };
  }, [isOpen]);

  // 监听外部 wordItem 的字段更新（如联网查询或 AI 语境释义在后台完成），原地合并更新 drawerStack，绝不打断动画与展开状态
  useEffect(() => {
    if (isOpen && wordItem) {
      setDrawerStack(prev => {
        let changed = false;
        const next = prev.map(entry => {
          if (entry.wordItem.word.toLowerCase() === wordItem.word.toLowerCase()) {
            if (
              entry.wordItem.definitionCn !== wordItem.definitionCn ||
              entry.wordItem.definition !== wordItem.definition ||
              entry.wordItem.partOfSpeech !== wordItem.partOfSpeech ||
              entry.wordItem.phoneticUk !== wordItem.phoneticUk ||
              entry.wordItem.phoneticUs !== wordItem.phoneticUs
            ) {
              changed = true;
              return {
                ...entry,
                wordItem: { ...entry.wordItem, ...wordItem }
              };
            }
          }
          return entry;
        });
        return changed ? next : prev;
      });
    }
  }, [isOpen, wordItem?.word, wordItem?.definitionCn, wordItem?.definition, wordItem?.partOfSpeech, wordItem?.phoneticUk, wordItem?.phoneticUs]);

  // 监听全局词汇更新广播（供二级推进抽屉及后台查询异步更新）
  useEffect(() => {
    const handleWordUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<WordItem>;
      const updated = customEvent.detail;
      if (!updated || !updated.word) return;
      const lower = updated.word.toLowerCase();
      setDrawerStack(prev => {
        let changed = false;
        const next = prev.map(entry => {
          if (entry.wordItem.word.toLowerCase() === lower) {
            changed = true;
            return {
              ...entry,
              wordItem: { ...entry.wordItem, ...updated }
            };
          }
          return entry;
        });
        return changed ? next : prev;
      });
    };

    window.addEventListener('lyriclens:wordUpdated', handleWordUpdated);
    return () => {
      window.removeEventListener('lyriclens:wordUpdated', handleWordUpdated);
    };
  }, []);

  const stackLength = drawerStack.length;
  const currentStackIndex = Math.max(0, stackLength - 1);
  const currentStackItem = drawerStack[currentStackIndex] || (wordItem ? { wordItem, activeSubWord: null } : null);

  // 阻尼状态切换（完全展开 / 半展开收起），将阶梯偏移合并入 GPU y 变换，零 marginTop 重排
  const animateToState = useCallback((expanded: boolean, velocity: number = 0) => {
    triggerHighRefreshBoost(1000);
    const expandedTargetY = currentStackIndex * STACK_STEP_PX;
    const targetY = expanded ? expandedTargetY : peekOffsetPxRef.current;
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
  }, [currentStackIndex, y]);

  const handleScrollUpdate = useCallback((cardIdx: number, scrollTop: number) => {
    scrollTopMapRef.current.set(cardIdx, scrollTop);
  }, []);

  const getSavedScrollTop = useCallback((cardIdx: number) => {
    return scrollTopMapRef.current.get(cardIdx) || 0;
  }, []);

  if (!isMounted || !currentStackItem) return null;

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

  // 点击例句/搭配/成分中的单词：推入新的一级抽屉（上一级抽屉保持并在底层停留，新抽屉以半展开 Peek 态轻柔滑入）
  const handlePushNewDrawer = async (clickedWord: string, sentence?: string) => {
    const cleanWord = clickedWord.trim();
    if (!cleanWord || !isOpenRef.current || isClosingRef.current || isPoppingRef.current) {
      return;
    }
    const currentTopWord = drawerStackRef.current[drawerStackRef.current.length - 1]?.wordItem.word;
    if (currentTopWord && currentTopWord.toLowerCase() === cleanWord.toLowerCase()) {
      return;
    }

    const reqSeq = ++lookupSeqRef.current;
    triggerHighRefreshBoost(1000);
    try {
      const item = await lookupWord(cleanWord, sentence || '');
      if (
        !isMountedRef.current ||
        reqSeq !== lookupSeqRef.current ||
        !isOpenRef.current ||
        isClosingRef.current ||
        isPoppingRef.current ||
        !item
      ) {
        return;
      }

      const latestStack = drawerStackRef.current;
      const latestTop = latestStack[latestStack.length - 1];
      if (latestTop && latestTop.wordItem.word.toLowerCase() === item.word.toLowerCase()) {
        return;
      }

      const nextIdx = latestStack.length;
      const outgoingTopY = y.get();
      const containerH = containerRef.current?.offsetHeight || 800;
      scrollTopMapRef.current.set(nextIdx, 0);
      pendingStackTransitionRef.current = { type: 'push', containerH };
      setDrawerStack(prev => {
        if (prev.length === 0) return prev;
        const top = prev[prev.length - 1];
        if (top && top.wordItem.word.toLowerCase() === item.word.toLowerCase()) {
          pendingStackTransitionRef.current = null;
          return prev;
        }
        return [
          ...prev.map((it, i) =>
            i === prev.length - 1 ? { ...it, wasExpanded: isExpanded, savedY: outgoingTopY } : it
          ),
          { wordItem: item, activeSubWord: null, wasExpanded: false, scrollTop: 0 }
        ];
      });
      setIsExpanded(false);

      // 如果推送的新单词处于后台联网查询中，启动轻量兜底轮询确保更新（哪怕事件在切换前偶发错过）
      if (item.definitionCn === ONLINE_LOOKUP_LOADING_TEXT || item.definitionCn === '正在联网查询释义…') {
        const checkLower = item.word.toLowerCase();
        let attempts = 0;
        const timer = setInterval(async () => {
          attempts++;
          if (!isMountedRef.current || !isOpenRef.current || attempts > 12) {
            clearInterval(timer);
            pollTimersRef.current.delete(timer);
            return;
          }
          try {
            const dbWord = await db.words.where('word').equalsIgnoreCase(checkLower).first();
            if (!isMountedRef.current || !isOpenRef.current) {
              clearInterval(timer);
              pollTimersRef.current.delete(timer);
              return;
            }
            if (dbWord && dbWord.definitionCn && dbWord.definitionCn !== ONLINE_LOOKUP_LOADING_TEXT && dbWord.definitionCn !== '正在联网查询释义…') {
              clearInterval(timer);
              pollTimersRef.current.delete(timer);
              setDrawerStack(prev => {
                let changed = false;
                const next = prev.map(entry => {
                  if (entry.wordItem.word.toLowerCase() === checkLower) {
                    changed = true;
                    return {
                      ...entry,
                      wordItem: { ...entry.wordItem, ...dbWord }
                    };
                  }
                  return entry;
                });
                return changed ? next : prev;
              });
            }
          } catch {}
        }, 300);
        pollTimersRef.current.add(timer);
      }
    } catch (err) {
      console.error('[WordDrawer] Failed to push word drawer:', cleanWord, err);
    }
  };

  // 返回上一级抽屉（上一级抽屉恢复其原本的展开状态）
  const handlePopDrawer = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isClosingRef.current || isPoppingRef.current) return;
    lookupSeqRef.current += 1;
    triggerHighRefreshBoost(1000);
    const currentStack = drawerStackRef.current;
    if (currentStack.length > 1) {
      isPoppingRef.current = true;
      const prevIdx = currentStack.length - 2;
      const prevTarget = currentStack[prevIdx];
      const shouldExpand = prevTarget?.wasExpanded !== false;
      const startY = prevIdx * STACK_STEP_PX;
      const exitY = Math.ceil((containerRef.current?.offsetHeight || 800) * EXPANDED_HEIGHT_RATIO) + 24;

      setPoppingTargetIdx(prevIdx);
      animate(y, exitY, { duration: 0.22, ease: [0.32, 0, 0.67, 0] }).then(() => {
        if (!isMountedRef.current || !isOpenRef.current || isClosingRef.current) {
          isPoppingRef.current = false;
          setPoppingTargetIdx(null);
          return;
        }
        scrollTopMapRef.current.delete(drawerStackRef.current.length - 1);
        pendingStackTransitionRef.current = { type: 'pop', startY, shouldExpand };
        setDrawerStack(prev => (prev.length > 1 ? prev.slice(0, prev.length - 1) : prev));
        setIsExpanded(shouldExpand);
        setPoppingTargetIdx(null);
        isPoppingRef.current = false;
      });
    } else {
      onCloseRef.current();
    }
  };
  handlePopDrawerRef.current = () => handlePopDrawer();

  // 点击背景遮罩空白区域：多层时返回上一级，单层时关闭抽屉
  const handleBackdropClick = () => {
    if (isClosingRef.current || isPoppingRef.current) return;
    triggerHighRefreshBoost(1000);
    if (drawerStackRef.current.length > 1) {
      handlePopDrawer();
    } else {
      onCloseRef.current();
    }
  };

  // 点击底层露出的堆叠卡片边缘，直接快速回退到该层
  const handleJumpToLayer = (targetIndex: number) => {
    if (isClosingRef.current || isPoppingRef.current) return;
    const currentStack = drawerStackRef.current;
    if (targetIndex >= 0 && targetIndex < currentStack.length - 1) {
      isPoppingRef.current = true;
      lookupSeqRef.current += 1;
      triggerHighRefreshBoost(1000);
      const targetItem = currentStack[targetIndex];
      const shouldExpand = targetItem?.wasExpanded !== false;
      const startY = targetIndex * STACK_STEP_PX;
      const exitY = Math.ceil((containerRef.current?.offsetHeight || 800) * EXPANDED_HEIGHT_RATIO) + 24;

      setPoppingTargetIdx(targetIndex);
      animate(y, exitY, { duration: 0.22, ease: [0.32, 0, 0.67, 0] }).then(() => {
        if (!isMountedRef.current || !isOpenRef.current || isClosingRef.current) {
          isPoppingRef.current = false;
          setPoppingTargetIdx(null);
          return;
        }
        for (let i = targetIndex + 1; i < drawerStackRef.current.length; i++) {
          scrollTopMapRef.current.delete(i);
        }
        pendingStackTransitionRef.current = { type: 'pop', startY, shouldExpand };
        setDrawerStack(prev => (prev.length > targetIndex + 1 ? prev.slice(0, targetIndex + 1) : prev));
        setIsExpanded(shouldExpand);
        setPoppingTargetIdx(null);
        isPoppingRef.current = false;
      });
    }
  };

  // 手势引擎：把手与顶部安全区拖拽
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isClosingRef.current || isPoppingRef.current) return;
    triggerHighRefreshBoost(1200);
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
        if (drawerStackRef.current.length > 1) {
          handlePopDrawer();
        } else {
          onCloseRef.current();
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
    if (ignoreClickRef.current || isClosingRef.current || isPoppingRef.current) return;
    animateToState(!isExpanded);
  };

  return (
    <div 
      ref={containerRef}
      id="word-drawer-mobile-wrapper"
      className={`absolute inset-0 ${zIndexClass} pointer-events-none flex flex-col justify-end overflow-hidden rounded-[inherit]`}
    >
      {/* 背景遮罩 */}
      <motion.div
        style={{ opacity: backdropOpacity }}
        onClick={handleBackdropClick}
        className="absolute inset-0 bg-stone-900/50 dark:bg-black/75 pointer-events-auto"
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

        const isBecomingActive = poppingTargetIdx !== null && idx === poppingTargetIdx;
        const isBeingDismissed = poppingTargetIdx !== null && idx > poppingTargetIdx;
        const effectiveDepth = isBecomingActive ? 0 : depth;
        const stepOffsetTop = idx * STACK_STEP_PX;
        const scaleVal = Math.max(1 - effectiveDepth * 0.045, 0.88);
        const initialUnderY = Math.max(0, (item.savedY ?? stepOffsetTop) - stepOffsetTop);

        return (
          <motion.div
            key={`stacked-under-layer-${idx}-${item.wordItem.word}`}
            initial={{ scale: 1, opacity: 1, y: initialUnderY }}
            animate={{
              scale: scaleVal,
              opacity: isBeingDismissed ? 0 : 1,
              y: isBeingDismissed ? 120 : 0
            }}
            transition={{ type: 'spring', damping: 32, stiffness: 280, mass: 0.85 }}
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
              getSavedScrollTop={getSavedScrollTop}
            />

            {/* 半透明压暗遮罩（推入时平滑淡入，回退时同步淡出，杜绝切换闪烁） */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isBecomingActive ? 0 : 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="absolute inset-0 bg-stone-900/25 dark:bg-black/45 hover:bg-stone-900/15 transition-colors pointer-events-none"
            />
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
          y: y,
          contain: 'layout style paint',
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
          getSavedScrollTop={getSavedScrollTop}
          peekContentRef={peekContentRef}
          onDragStart={handleDragStart}
        />
      </motion.div>
    </div>
  );
};
