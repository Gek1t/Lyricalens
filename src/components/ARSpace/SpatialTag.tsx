import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, ChevronRight, X } from 'lucide-react';
import { ARDetectedObject, MasteryLevel } from '../../types';
import { MasteryBadge } from '../MasteryBadge';
import { speakWord } from '../../utils/audioEngine';

interface SpatialTagProps {
  tag: ARDetectedObject;
  isFrozen: boolean;
  isExpanded: boolean;
  hasActiveBubble?: boolean;
  onTapTag: () => void;
  onCloseBubble: () => void;
  onHeroFlight: (rect: DOMRect | null) => void;
  onToggleMastery: (newLevel: MasteryLevel) => void;
  floatOffset: { x: number; y: number };
  collisionOffset?: { x: number; y: number; preferTop?: boolean };
}

export const SpatialTag: React.FC<SpatialTagProps> = ({
  tag,
  isFrozen,
  isExpanded,
  hasActiveBubble = false,
  onTapTag,
  onCloseBubble,
  onHeroFlight,
  onToggleMastery,
  floatOffset,
  collisionOffset
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const tagRef = useRef<HTMLDivElement>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 375,
    height: 700
  });
  const [measuredCardSize, setMeasuredCardSize] = useState<{ width: number; height: number }>({
    width: isExpanded ? 260 : 160,
    height: isExpanded ? 240 : 36
  });

  const wordData = tag.wordData;
  const currentMastery = (wordData.masteryLevel ?? (wordData.isStarred ? 1 : 0)) as MasteryLevel;

  // Track container dimensions for dynamic safe boundary clamping
  useEffect(() => {
    const updateDimensions = () => {
      if (tagRef.current?.parentElement) {
        setContainerDimensions({
          width: tagRef.current.parentElement.clientWidth || window.innerWidth,
          height: tagRef.current.parentElement.clientHeight || window.innerHeight
        });
      } else {
        setContainerDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Measure rendered DOM size of the capsule/card
  useLayoutEffect(() => {
    const el = cardElementRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const w = rect.width || el.offsetWidth;
      const h = rect.height || el.offsetHeight;
      if (w > 0 && h > 0) {
        setMeasuredCardSize({ width: w, height: h });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isExpanded, tag.label, tag.phonetic]);

  const handlePlayAudio = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlayingAudio(true);
    speakWord(wordData.word, 'en-GB');
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 1200);
  };

  const handleTriggerHero = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const rect = tagRef.current ? tagRef.current.getBoundingClientRect() : null;
    onHeroFlight(rect);
  };

  // Safe boundary clamping for full-screen viewfinder
  const { width: containerWidth, height: containerHeight } = containerDimensions;
  const topSafeMargin = 56;
  const bottomSafeMargin = 124;
  const leftSafeMargin = 16;
  const rightSafeMargin = 16;

  const anchorXPx = containerWidth * (tag.pos.x / 100);
  const anchorYPx = containerHeight * (tag.pos.y / 100);

  const halfCardWidth = measuredCardSize.width / 2;
  const desiredCenterXPx = anchorXPx + (isExpanded ? 0 : (collisionOffset?.x ?? 0));
  const targetCenterXPx = Math.max(
    leftSafeMargin + halfCardWidth,
    Math.min(containerWidth - rightSafeMargin - halfCardWidth, desiredCenterXPx)
  );
  const shiftX = targetCenterXPx - anchorXPx;

  let isTopPlaced = false;
  let shiftY = 0;
  let leaderLineEndY = 0;

  if (!isExpanded) {
    const leaderHeight = 22;
    const capsuleHeight = measuredCardSize.height || 36;
    const extraY = collisionOffset?.y ?? 0;
    const preferTop =
      collisionOffset?.preferTop !== undefined
        ? collisionOffset.preferTop
        : anchorYPx - leaderHeight - capsuleHeight >= topSafeMargin;

    if (preferTop && anchorYPx - leaderHeight - capsuleHeight + extraY >= topSafeMargin) {
      isTopPlaced = true;
      shiftY = -leaderHeight - capsuleHeight + extraY;
      leaderLineEndY = shiftY + capsuleHeight;
    } else {
      isTopPlaced = false;
      shiftY = Math.min(
        containerHeight - bottomSafeMargin - capsuleHeight - anchorYPx,
        Math.max(12, leaderHeight + extraY)
      );
      leaderLineEndY = shiftY;
    }
  } else {
    const leaderHeight = 24;
    const bubbleHeight = measuredCardSize.height || 230;
    const spaceAbove = anchorYPx - topSafeMargin;

    if (spaceAbove >= bubbleHeight + leaderHeight) {
      isTopPlaced = true;
      const cardTopPx = Math.max(topSafeMargin, anchorYPx - leaderHeight - bubbleHeight);
      shiftY = cardTopPx - anchorYPx;
      leaderLineEndY = shiftY + bubbleHeight;
    } else {
      isTopPlaced = false;
      const cardTopPx = Math.min(containerHeight - bottomSafeMargin - bubbleHeight, anchorYPx + leaderHeight);
      shiftY = cardTopPx - anchorYPx;
      leaderLineEndY = shiftY;
    }
  }

  const curFloatX = isFrozen ? 0 : floatOffset.x;
  const curFloatY = isFrozen ? 0 : floatOffset.y;

  const zIndexClass = isExpanded ? 'z-40' : hasActiveBubble ? 'z-10' : 'z-20';
  const tagOpacity = isExpanded ? 1 : hasActiveBubble ? 0.35 : 1;

  return (
    <div
      ref={tagRef}
      style={{
        left: `${tag.pos.x}%`,
        top: `${tag.pos.y}%`,
        transform: `translate3d(${curFloatX}px, ${curFloatY}px, 0)`,
        opacity: tagOpacity,
        transition: isFrozen
          ? 'transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.22s ease'
          : 'transform 0.12s ease-out, opacity 0.22s ease'
      }}
      className={`absolute ${zIndexClass} select-none pointer-events-auto will-change-transform`}
    >
      {/* Delicate Editorial Hairline Leader connecting Object Anchor (0,0) to Capsule/Card */}
      <svg
        className="absolute left-0 top-0 overflow-visible pointer-events-none"
        width="1"
        height="1"
        aria-hidden="true"
      >
        <line
          x1={0}
          y1={0}
          x2={shiftX}
          y2={leaderLineEndY}
          stroke={isExpanded ? 'rgba(250, 247, 240, 0.95)' : 'rgba(250, 247, 240, 0.8)'}
          strokeWidth={isExpanded ? 1.25 : 1}
        />
        <circle
          cx={shiftX}
          cy={leaderLineEndY}
          r={2}
          fill="#FAF7F0"
        />
      </svg>

      {/* Breathing Pearl & Sage Anchor Point at Exact Object Coordinate (0, 0) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTapTag();
        }}
        aria-label={`Select ${tag.label}`}
        className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center cursor-pointer group focus:outline-none"
      >
        <span
          className={`absolute rounded-full transition-all duration-500 ${
            isExpanded
              ? 'w-6 h-6 bg-[#FAF7F0]/45 animate-ping'
              : 'w-4.5 h-4.5 bg-[#FAF7F0]/35 animate-pulse'
          }`}
        />
        <span
          className={`relative rounded-full transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.35)] ${
            isExpanded
              ? 'w-3 h-3 bg-[#516050] ring-2 ring-[#FAF7F0] scale-110'
              : 'w-2.5 h-2.5 bg-[#FAF7F0] ring-2 ring-[#516050] group-hover:scale-125'
          }`}
        />
      </button>

      {/* Direct Object Annotation Tag / Card (Warm Cream Editorial Glass) */}
      <div
        ref={cardElementRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate3d(${shiftX}px, ${shiftY}px, 0) translate(-50%, 0)`,
          transition: isFrozen ? 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'transform 0.15s ease-out'
        }}
        className="flex flex-col items-center max-w-[calc(100vw-48px)]"
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* Warm Parchment Frosted Capsule Label */
            <motion.div
              key="micro-capsule"
              initial={{ opacity: 0, scale: 0.9, y: isTopPlaced ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: isTopPlaced ? -3 : 3 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => {
                e.stopPropagation();
                onTapTag();
              }}
              className="cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF7F0]/94 dark:bg-[#141822]/92 backdrop-blur-2xl border border-white/80 dark:border-white/15 shadow-[0_8px_24px_rgba(28,25,23,0.22)] whitespace-nowrap shrink-0 hover:bg-[#FDFBF7] dark:hover:bg-[#1A202C] transition-colors">
                <MasteryBadge
                  level={currentMastery}
                  size={15}
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextLevel = (((currentMastery ?? 0) + 1) % 4) as MasteryLevel;
                    onToggleMastery(nextLevel);
                  }}
                />
                <span className="font-serif-luxury text-[13.5px] font-semibold tracking-wide text-stone-900 dark:text-stone-100 leading-none whitespace-nowrap">
                  {tag.label}
                </span>
                <span className="text-[11px] text-[#516050] dark:text-[#8FB996] font-sans font-medium pl-1.5 border-l border-stone-300/80 dark:border-white/15 leading-none whitespace-nowrap">
                  {tag.wordData.definitionCn ? tag.wordData.definitionCn.split(/[，；,]/)[0] : tag.phonetic}
                </span>
              </div>
            </motion.div>
          ) : (
            /* Expanded Detail Card (Warm Cream Paper & Botanical Sage Magazine Style) */
            <motion.div
              key="micro-bubble"
              initial={{ opacity: 0, scale: 0.92, y: isTopPlaced ? 8 : -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: isTopPlaced ? 6 : -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-[260px] max-w-[84vw] rounded-2xl p-4 bg-[#FAF7F0]/96 dark:bg-[#141822]/95 backdrop-blur-2xl border border-white/85 dark:border-white/15 shadow-[0_20px_48px_rgba(28,25,23,0.28)] text-stone-900 dark:text-stone-100 space-y-2.5"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-200/80 dark:border-white/10">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <MasteryBadge
                    level={currentMastery}
                    size={16}
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextLevel = (((currentMastery ?? 0) + 1) % 4) as MasteryLevel;
                      onToggleMastery(nextLevel);
                    }}
                  />
                  <div className="min-w-0">
                    <h4 className="font-serif-luxury text-[16px] font-bold text-stone-900 dark:text-white tracking-wide truncate leading-tight">
                      {tag.label}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handlePlayAudio}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isPlayingAudio
                        ? 'bg-[#516050] text-white'
                        : 'text-[#516050] dark:text-[#8FB996] hover:bg-[#516050]/10 dark:hover:bg-white/10'
                    }`}
                    aria-label="Play pronunciation"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseBubble();
                    }}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/10 transition-all cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Phonetic & Meaning */}
              <div className="space-y-1 text-left">
                {tag.phonetic && (
                  <p className="font-mono text-[11px] text-[#516050] dark:text-[#8FB996] font-medium">
                    {tag.phonetic}
                  </p>
                )}
                <p className="text-[13px] font-medium text-stone-800 dark:text-stone-100 leading-snug">
                  {wordData.definitionCn}
                </p>
                {wordData.definition && (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans leading-relaxed line-clamp-2">
                    {wordData.definition}
                  </p>
                )}
              </div>

              {/* Example */}
              {wordData.examples && wordData.examples.length > 0 && (
                <div className="pt-2 border-t border-stone-200/70 dark:border-white/10 text-left">
                  <p className="text-[11.5px] text-stone-600 dark:text-stone-300 italic font-serif leading-relaxed line-clamp-2">
                    "{wordData.examples[0].en}"
                  </p>
                </div>
              )}

              {/* Detail Link */}
              <button
                type="button"
                onClick={handleTriggerHero}
                className="w-full pt-1 flex items-center justify-between text-[11px] font-semibold text-[#516050] dark:text-[#8FB996] hover:opacity-80 group cursor-pointer transition-opacity"
              >
                <span>翻阅完整词汇手帖</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#516050] dark:text-[#8FB996] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
