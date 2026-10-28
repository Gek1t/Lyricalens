import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LyricLine, SongItem } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { lookupLyricTerm, cleanWordText, getLyricLineTranslation } from '../../utils/lyricDictionary';
import { collectWord, db } from '../../db';
import { ChevronLeft, Type, MoveVertical, X, RotateCcw, SlidersHorizontal, Clock, Sparkles, Play } from 'lucide-react';

const formatTime = (timeSec: number) => {
  if (isNaN(timeSec) || timeSec < 0) return '00:00';
  const mins = Math.floor(timeSec / 60);
  const secs = Math.floor(timeSec % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface FullscreenLyricsViewProps {
  parsedLyrics: LyricLine[];
  activeLyricIndex: number;
  onClose: () => void;
  onSeek: (timeSec: number) => void;
  albumArtUrl: string;
  palette?: string[];
}

interface GestureState {
  isLongPressing: boolean;
  activeLineIdx: number | null;
  startSpanIdx: number | null;
  currentSpanIdx: number | null;
  touchStartX: number;
  touchStartY: number;
  touchCurrentX: number;
  touchCurrentY: number;
  selectedText: string;
  isMultiWord: boolean;
  isDwellLocked: boolean;
  anchorX: number;
  anchorY: number;
  isEscapingUp: boolean; // Swipe up to discard
  isSavingDown: boolean; // Swipe down to save to vault
  canReArm: boolean;
}

export const FullscreenLyricsView: React.FC<FullscreenLyricsViewProps> = ({
  parsedLyrics,
  activeLyricIndex,
  onClose,
  onSeek,
  palette = ['#E6DFD5', '#CBD5C8', '#C3B8A8']
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const isWordSheetOpen = useAppStore(s => s.isWordSheetOpen);
  const openWordDetail = useAppStore(s => s.openWordDetail);
  const songs = useAppStore(s => s.songs);
  const currentSongIndex = useAppStore(s => s.currentSongIndex);
  const fallbackSong: SongItem = useMemo(() => ({
    id: 'seed-serenity-bloom',
    title: 'Serenity & Solitude',
    artist: 'Aether Bloom',
    duration: 184,
    albumArtUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
    audioUrl: '',
    palette: ['#7C8F6E', '#C4AC82', '#A69880'],
    keyVocab: ['ephemeral', 'resilience', 'solitude'],
    lrcText: '',
  }), []);
  const currentSong: SongItem = songs[currentSongIndex] || songs[0] || fallbackSong;
  const setIsPlaying = useAppStore(s => s.setIsPlaying);

  const [showTranslation, setShowTranslation] = useState(false);

  // User interactive scrub / manual scroll state
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [aimedLyricIndex, setAimedLyricIndex] = useState(activeLyricIndex);
  const isProgrammaticScrollingRef = useRef(false);
  const scrubbingTimeoutRef = useRef<number | null>(null);

  // Unified settings sheet state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'layout' | 'sync'>('layout');

  // Lyrics Offset synchronization state per song
  const lyricsOffsets = useAppStore(s => s.lyricsOffsets);
  const setLyricsOffset = useAppStore(s => s.setLyricsOffset);
  const showToast = useAppStore(s => s.showToast);
  const currentOffset = (currentSong && currentSong.id && lyricsOffsets[currentSong.id]) || 0;

  // Continuous font size state with safe min (14px) / max (30px) bounds
  const MIN_FONT_SIZE = 14;
  const MAX_FONT_SIZE = 30;
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('ambient_lyrics_font_size');
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= MIN_FONT_SIZE && parsed <= MAX_FONT_SIZE) return parsed;
    }
    return 19; // Default 19px
  });

  // Continuous line spacing state with safe min (12px) / max (48px) bounds
  const MIN_LINE_SPACING = 12;
  const MAX_LINE_SPACING = 48;
  const [lineSpacing, setLineSpacing] = useState<number>(() => {
    const saved = localStorage.getItem('ambient_lyrics_line_spacing');
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= MIN_LINE_SPACING && parsed <= MAX_LINE_SPACING) return parsed;
    }
    return 24; // Default 24px gap
  });

  const handleFontSizeChange = (val: number) => {
    const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, val));
    setFontSize(clamped);
    localStorage.setItem('ambient_lyrics_font_size', clamped.toString());
  };

  const handleLineSpacingChange = (val: number) => {
    const clamped = Math.max(MIN_LINE_SPACING, Math.min(MAX_LINE_SPACING, val));
    setLineSpacing(clamped);
    localStorage.setItem('ambient_lyrics_line_spacing', clamped.toString());
  };

  const handleOffsetChange = (newVal: number) => {
    const clamped = Math.max(-5, Math.min(5, Math.round(newVal * 10) / 10));
    setLyricsOffset(currentSong.id, clamped);
  };

  const handleOffsetStep = (delta: number) => {
    handleOffsetChange(currentOffset + delta);
    if (delta > 0) {
      showToast(`歌词提前 ${Math.abs(delta)}s`);
    } else if (delta < 0) {
      showToast(`歌词延后 ${Math.abs(delta)}s`);
    }
  };

  // Derive dynamic scale factor for active line & translation font size
  const activeScaleFactor = useMemo(() => {
    if (fontSize >= 26) return 1.02;
    if (fontSize >= 21) return 1.03;
    return 1.04;
  }, [fontSize]);

  const translationFontSize = useMemo(() => {
    return Math.max(11, Math.min(15, Math.round(fontSize * 0.62)));
  }, [fontSize]);

  // Live query for collected words in vocabulary book
  const collectedWords = useLiveQuery(() => db.words.toArray(), []);

  // Set of lowercase, cleaned saved words & phrases in the vault
  const savedWordsSet = useMemo(() => {
    if (!collectedWords) return new Set<string>();
    const set = new Set<string>();
    for (const item of collectedWords) {
      if (item.word && (item.isStarred || (typeof item.masteryLevel === 'number' && item.masteryLevel > 0))) {
        const clean = cleanWordText(item.word).toLowerCase();
        if (clean) set.add(clean);
      }
    }
    return set;
  }, [collectedWords]);

  // Precompute saved vocabulary span lookup table once per song/vault update instead of on every render frame
  const savedSpanLookup = useMemo(() => {
    return parsedLyrics.map(line => {
      const spans = line.spans || [];
      const cleanSpans = spans.map(s => cleanWordText(s.text || '').toLowerCase());
      return spans.map((_, sIdx) => {
        const currentClean = cleanSpans[sIdx];
        if (currentClean && savedWordsSet.has(currentClean)) return true;

        for (let len = 2; len <= 5; len++) {
          for (let start = Math.max(0, sIdx - len + 1); start <= sIdx && start + len <= spans.length; start++) {
            const phrase = cleanSpans.slice(start, start + len).join(' ');
            if (savedWordsSet.has(phrase)) {
              return true;
            }
          }
        }
        return false;
      });
    });
  }, [parsedLyrics, savedWordsSet]);

  // Active anchor for selected phrase in lyric lines
  const [highlightAnchor, setHighlightAnchor] = useState<{
    lineIdx: number;
    startSpan: number;
    endSpan: number;
  } | null>(null);

  // Real Touch Gesture State Machine
  const [gestureState, setGestureState] = useState<GestureState>({
    isLongPressing: false,
    activeLineIdx: null,
    startSpanIdx: null,
    currentSpanIdx: null,
    touchStartX: 0,
    touchStartY: 0,
    touchCurrentX: 0,
    touchCurrentY: 0,
    selectedText: '',
    isMultiWord: false,
    isDwellLocked: false,
    anchorX: 0,
    anchorY: 0,
    isEscapingUp: false,
    isSavingDown: false,
    canReArm: false
  });

  const longPressTimerRef = useRef<number | null>(null);
  const dwellTimerRef = useRef<number | null>(null);
  const autoScrollAnimRef = useRef<number | null>(null);
  const autoScrollSpeedRef = useRef<number>(0);
  const gestureStateRef = useRef(gestureState);
  gestureStateRef.current = gestureState;

  const touchStartPosRef = useRef<{
    x: number;
    y: number;
    lineIdx: number;
    spanIdx: number;
    spanText: string;
  } | null>(null);

  // Trigger tactile haptic feedback safely
  const triggerHaptic = (pattern: number | number[] = 15) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // ignore
    }
  };

  // Stop auto-scroll loop
  const stopAutoScroll = () => {
    if (autoScrollAnimRef.current !== null) {
      cancelAnimationFrame(autoScrollAnimRef.current);
      autoScrollAnimRef.current = null;
    }
    autoScrollSpeedRef.current = 0;
  };

  // Edge auto-scroll loop
  const stepAutoScroll = () => {
    const container = containerRef.current;
    if (container && autoScrollSpeedRef.current !== 0) {
      container.scrollTop += autoScrollSpeedRef.current;
      autoScrollAnimRef.current = requestAnimationFrame(stepAutoScroll);
    } else {
      stopAutoScroll();
    }
  };

  // Check edge auto-scroll near top/bottom
  const updateEdgeScroll = (clientY: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const edgeThreshold = 70;
    const maxSpeed = 10;

    if (clientY < rect.top + edgeThreshold && clientY > rect.top - 20) {
      const ratio = 1 - Math.max(0, (clientY - rect.top) / edgeThreshold);
      autoScrollSpeedRef.current = -Math.max(2, ratio * maxSpeed);
      if (autoScrollAnimRef.current === null) {
        autoScrollAnimRef.current = requestAnimationFrame(stepAutoScroll);
      }
    } else if (clientY > rect.bottom - edgeThreshold && clientY < rect.bottom + 20) {
      const ratio = 1 - Math.max(0, (rect.bottom - clientY) / edgeThreshold);
      autoScrollSpeedRef.current = Math.max(2, ratio * maxSpeed);
      if (autoScrollAnimRef.current === null) {
        autoScrollAnimRef.current = requestAnimationFrame(stepAutoScroll);
      }
    } else {
      stopAutoScroll();
    }
  };

  // Clear dwell timer
  const clearDwellTimer = () => {
    if (dwellTimerRef.current !== null) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
  };

  // Schedule Dwell Lock (200ms stationary)
  const scheduleDwellLock = (clientX: number, clientY: number) => {
    clearDwellTimer();
    dwellTimerRef.current = window.setTimeout(() => {
      triggerHaptic([18, 35, 18]); // Dwell-lock tactile pulse
      setGestureState((prev) => ({
        ...prev,
        isDwellLocked: true,
        canReArm: true,
        anchorX: clientX,
        anchorY: clientY,
        isSavingDown: false,
        isEscapingUp: false
      }));
    }, 200);
  };

  // Blank area touch start (for swipe down to dismiss or tap to return)
  const bgSwipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  // When Fullscreen Word Page is closed, clear highlight anchor
  useEffect(() => {
    if (!isWordSheetOpen) {
      setHighlightAnchor(null);
    }
  }, [isWordSheetOpen]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearDwellTimer();
      stopAutoScroll();
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (scrubbingTimeoutRef.current) clearTimeout(scrubbingTimeoutRef.current);
    };
  }, []);

  // Center alignment scroll utility with exact DOM bounding boxes
  const scrollToLine = (index: number, smooth: boolean = true) => {
    if (gestureState.isLongPressing || isWordSheetOpen) return;
    const container = containerRef.current;
    if (!container) return;

    const lineEl = container.querySelector(`[data-line-index="${index}"]`) as HTMLElement;
    if (!lineEl) return;

    isProgrammaticScrollingRef.current = true;
    const containerRect = container.getBoundingClientRect();
    const lineRect = lineEl.getBoundingClientRect();
    const targetScroll =
      container.scrollTop +
      (lineRect.top - containerRect.top) -
      containerRect.height * 0.42 +
      lineRect.height / 2;

    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: smooth ? 'smooth' : 'auto'
    });

    setTimeout(() => {
      isProgrammaticScrollingRef.current = false;
    }, 450);
  };

  // Auto-scroll follow active lyric line (only when user is not manually scrubbing)
  useEffect(() => {
    if (!isScrubbing) {
      scrollToLine(activeLyricIndex, true);
    }
  }, [activeLyricIndex, isScrubbing, fontSize, lineSpacing]);

  // Initial jump to current playing line on mount
  useEffect(() => {
    const t = setTimeout(() => {
      scrollToLine(activeLyricIndex, false);
    }, 80);
    return () => clearTimeout(t);
  }, []);

  // User manual scroll/drag detection (Apple Music / Netease aim timeline mode)
  const handleScroll = () => {
    if (isProgrammaticScrollingRef.current || gestureState.isLongPressing) return;

    const container = containerRef.current;
    if (!container) return;

    setIsScrubbing(true);

    // Calculate which lyric line is closest to the 42% vertical center line
    const containerRect = container.getBoundingClientRect();
    const focusY = containerRect.top + containerRect.height * 0.42;

    let closestIdx = 0;
    let minDistance = Infinity;

    const lineElements = container.querySelectorAll('[data-line-index]');
    lineElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const lineCenterY = rect.top + rect.height / 2;
      const dist = Math.abs(lineCenterY - focusY);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = parseInt(el.getAttribute('data-line-index') || '0', 10);
      }
    });

    setAimedLyricIndex(closestIdx);

    // Auto-dismiss timeline and resume following playback if inactive for 3s
    if (scrubbingTimeoutRef.current) clearTimeout(scrubbingTimeoutRef.current);
    scrubbingTimeoutRef.current = window.setTimeout(() => {
      setIsScrubbing(false);
      scrollToLine(activeLyricIndex, true);
    }, 3000);
  };

  // Jump audio playback directly to aimed line
  const handleSeekToLine = (index: number) => {
    const targetLine = parsedLyrics[index];
    if (!targetLine) return;
    const targetTimeSec = targetLine.timeMs / 1000;

    triggerHaptic(20);
    onSeek(targetTimeSec);
    setIsPlaying(true);

    setIsScrubbing(false);
    if (scrubbingTimeoutRef.current) clearTimeout(scrubbingTimeoutRef.current);

    setTimeout(() => {
      scrollToLine(index, true);
    }, 60);
  };

  // Quick single click (<300ms) on a word
  const handleSingleWordClick = async (
    spanText: string,
    fullSentence: string,
    targetEl?: HTMLElement | null
  ) => {
    const cleaned = cleanWordText(spanText);
    if (!cleaned) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch {
      // ignore
    }

    let heroRect: { x: number; y: number; width: number; height: number } | null = null;
    if (targetEl) {
      const r = targetEl.getBoundingClientRect();
      heroRect = { x: r.left, y: r.top, width: r.width, height: r.height };
    }

    const wordData = await lookupLyricTerm(cleaned, fullSentence);
    // Quick single-tap word lookup triggers bottom drawer
    openWordDetail(wordData, heroRect, 'drawer');
  };

  // 1. TouchStart / MouseDown on a word span
  const handleWordTouchStart = (
    e: React.TouchEvent | React.MouseEvent,
    lineIdx: number,
    spanIdx: number,
    spanText: string
  ) => {
    e.stopPropagation();
    const point = 'touches' in e ? e.touches[0] : e;

    touchStartPosRef.current = {
      x: point.clientX,
      y: point.clientY,
      lineIdx,
      spanIdx,
      spanText
    };

    // Long press 250ms threshold
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      triggerHaptic(20);

      setGestureState({
        isLongPressing: true,
        activeLineIdx: lineIdx,
        startSpanIdx: spanIdx,
        currentSpanIdx: spanIdx,
        touchStartX: point.clientX,
        touchStartY: point.clientY,
        touchCurrentX: point.clientX,
        touchCurrentY: point.clientY,
        selectedText: spanText,
        isMultiWord: false,
        isDwellLocked: false,
        anchorX: point.clientX,
        anchorY: point.clientY,
        isEscapingUp: false,
        isSavingDown: false,
        canReArm: false
      });

      // Schedule dwell lock (200ms stationary)
      scheduleDwellLock(point.clientX, point.clientY);
    }, 250);
  };

  // Blank area touch start
  const handleBgTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const point = 'touches' in e ? e.touches[0] : e;
    bgSwipeStartRef.current = { x: point.clientX, y: point.clientY, time: Date.now() };
  };

  // Blank area click to return to player homepage
  const handleBlankAreaClick = (e: React.MouseEvent) => {
    // If selecting/long pressing, don't dismiss
    if (gestureState.isLongPressing) return;
    
    // If adjust panel is open, clicking blank space closes the adjust panel first
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      return;
    }

    // Distinguish quick tap/click from scroll/drag gesture
    if (bgSwipeStartRef.current) {
      const dx = Math.abs(e.clientX - bgSwipeStartRef.current.x);
      const dy = Math.abs(e.clientY - bgSwipeStartRef.current.y);
      if (dx > 12 || dy > 12) return;
    }

    onClose();
  };

  // 2. TouchMove / MouseMove
  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    const point = 'touches' in e ? e.touches[0] : e;

    // Check if moving before long press threshold reached
    if (!gestureState.isLongPressing && touchStartPosRef.current) {
      const dx = Math.abs(point.clientX - touchStartPosRef.current.x);
      const dy = Math.abs(point.clientY - touchStartPosRef.current.y);
      if (dx > 8 || dy > 8) {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      }
      return;
    }

    if (!gestureState.isLongPressing || gestureState.activeLineIdx === null) return;
    if (e.cancelable) e.preventDefault();

    const currentLine = parsedLyrics[gestureState.activeLineIdx];
    if (!currentLine) return;

    // Measure span element under touch
    let targetSpanIdx = gestureState.startSpanIdx ?? 0;
    const spanElements = document.querySelectorAll(
      `[data-lyric-line="${gestureState.activeLineIdx}"]`
    );
    spanElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (point.clientX >= rect.left - 8 && point.clientX <= rect.right + 8) {
        const idx = parseInt(el.getAttribute('data-span-index') || '0', 10);
        targetSpanIdx = idx;
      }
    });

    const startIdx = gestureState.startSpanIdx ?? targetSpanIdx;
    const minIdx = Math.min(startIdx, targetSpanIdx);
    const maxIdx = Math.max(startIdx, targetSpanIdx);
    const selectedWords = currentLine.spans.slice(minIdx, maxIdx + 1).map((s) => s.text);
    const phraseText = selectedWords.join(' ');
    const isMulti = minIdx !== maxIdx;

    const dxFromStart = point.clientX - gestureState.touchStartX;
    const dyFromStart = point.clientY - gestureState.touchStartY;

    // === Track A: Single Word Fast Path ===
    if (!isMulti && !gestureState.isDwellLocked) {
      // If user directly pulls down or up without dwelling
      if (dyFromStart > 25 && Math.abs(dyFromStart) > Math.abs(dxFromStart) * 1.1) {
        clearDwellTimer();
        setGestureState((prev) => ({
          ...prev,
          currentSpanIdx: targetSpanIdx,
          touchCurrentX: point.clientX,
          touchCurrentY: point.clientY,
          selectedText: phraseText,
          isSavingDown: dyFromStart > 35,
          isEscapingUp: false,
          isMultiWord: false
        }));
        return;
      } else if (dyFromStart < -25 && Math.abs(dyFromStart) > Math.abs(dxFromStart) * 1.1) {
        clearDwellTimer();
        setGestureState((prev) => ({
          ...prev,
          currentSpanIdx: targetSpanIdx,
          touchCurrentX: point.clientX,
          touchCurrentY: point.clientY,
          selectedText: phraseText,
          isSavingDown: false,
          isEscapingUp: dyFromStart < -35,
          isMultiWord: false
        }));
        return;
      }
    }

    // === Track B - Phase 1: Free Range Selection & Edge Scrolling (Multi-Word Safe Path) ===
    if (!gestureState.isDwellLocked) {
      updateEdgeScroll(point.clientY);

      // In Free Selection phase, strictly BLOCK vertical triggers
      setGestureState((prev) => ({
        ...prev,
        currentSpanIdx: targetSpanIdx,
        touchCurrentX: point.clientX,
        touchCurrentY: point.clientY,
        selectedText: phraseText,
        isMultiWord: isMulti,
        isSavingDown: false,
        isEscapingUp: false
      }));

      // Reschedule dwell timer on every motion
      scheduleDwellLock(point.clientX, point.clientY);
      return;
    }

    // === Track B - Phase 2 & 3: Locked State & Action Dispatch ===
    if (gestureState.isDwellLocked) {
      const dxFromAnchor = point.clientX - gestureState.anchorX;
      const dyFromAnchor = point.clientY - gestureState.anchorY;

      // Re-arm Unlock check: Horizontal movement (>20px) unlocks back to Free Selection
      if (gestureState.canReArm && Math.abs(dxFromAnchor) > 20 && Math.abs(dxFromAnchor) > Math.abs(dyFromAnchor)) {
        triggerHaptic(12); // Re-arm tick
        setGestureState((prev) => ({
          ...prev,
          isDwellLocked: false,
          canReArm: false,
          isSavingDown: false,
          isEscapingUp: false,
          isMultiWord: isMulti,
          currentSpanIdx: targetSpanIdx,
          selectedText: phraseText
        }));
        scheduleDwellLock(point.clientX, point.clientY);
        return;
      }

      // Phase 3: Vertical Action Dispatch
      const isSavingDown = dyFromAnchor > 35;
      const isEscapingUp = dyFromAnchor < -35;

      setGestureState((prev) => ({
        ...prev,
        touchCurrentX: point.clientX,
        touchCurrentY: point.clientY,
        isSavingDown,
        isEscapingUp
      }));
    }
  };

  // 3. TouchEnd / MouseUp
  const handlePointerUp = async (e?: React.TouchEvent | React.MouseEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    clearDwellTimer();
    stopAutoScroll();
    bgSwipeStartRef.current = null;

    if (!gestureState.isLongPressing) {
      touchStartPosRef.current = null;
      return;
    }

    const {
      isEscapingUp,
      isSavingDown,
      selectedText,
      activeLineIdx,
      startSpanIdx,
      currentSpanIdx,
      isMultiWord,
      isDwellLocked,
      touchStartY,
      touchCurrentY
    } = gestureState;

    const dyTotal = touchCurrentY - touchStartY;

    // 1. Single Word Fast Path immediate release check
    if (!isMultiWord && !isDwellLocked) {
      if (dyTotal > 35) {
        if (selectedText.trim() && activeLineIdx !== null) {
          const fullSentence = parsedLyrics[activeLineIdx]?.rawText || '';
          const wordData = await lookupLyricTerm(selectedText, fullSentence);
          await collectWord({ ...wordData, isStarred: true });
          triggerHaptic([20, 50]);
        }
        resetGesture();
        return;
      } else if (dyTotal < -35) {
        triggerHaptic(15);
        resetGesture();
        return;
      }
    }

    // 2. Action Dispatch in Locked Mode
    if (isEscapingUp) {
      triggerHaptic(15);
      resetGesture();
      return;
    }

    if (isSavingDown) {
      if (selectedText.trim() && activeLineIdx !== null) {
        const fullSentence = parsedLyrics[activeLineIdx]?.rawText || '';
        const wordData = await lookupLyricTerm(selectedText, fullSentence);
        await collectWord({ ...wordData, isStarred: true });
        triggerHaptic([20, 50]);
      }
      resetGesture();
      return;
    }

    // 3. Stationary Release -> Hero Flight to Full-Screen Detail Page
    if (selectedText.trim() && activeLineIdx !== null) {
      const minIdx = Math.min(startSpanIdx ?? 0, currentSpanIdx ?? 0);
      const maxIdx = Math.max(startSpanIdx ?? 0, currentSpanIdx ?? 0);

      // Save highlight anchor
      setHighlightAnchor({
        lineIdx: activeLineIdx,
        startSpan: minIdx,
        endSpan: maxIdx
      });

      // Measure exact bounding rect of selected words in screen coordinates
      const startEl = document.querySelector(
        `[data-lyric-line="${activeLineIdx}"][data-span-index="${minIdx}"]`
      );
      const endEl = document.querySelector(
        `[data-lyric-line="${activeLineIdx}"][data-span-index="${maxIdx}"]`
      );

      let heroRect: { x: number; y: number; width: number; height: number } | null = null;
      if (startEl && endEl) {
        const r1 = startEl.getBoundingClientRect();
        const r2 = endEl.getBoundingClientRect();
        heroRect = {
          x: r1.left,
          y: r1.top,
          width: r2.right - r1.left,
          height: Math.max(r1.height, r2.height)
        };
      }

      const fullSentence = parsedLyrics[activeLineIdx]?.rawText || '';
      const wordData = await lookupLyricTerm(selectedText, fullSentence);
      triggerHaptic(20);
      // Long press selection triggers full-screen Hero flight!
      openWordDetail(wordData, heroRect, 'fullscreen');
    }

    resetGesture();
  };

  const resetGesture = () => {
    stopAutoScroll();
    clearDwellTimer();
    setGestureState({
      isLongPressing: false,
      activeLineIdx: null,
      startSpanIdx: null,
      currentSpanIdx: null,
      touchStartX: 0,
      touchStartY: 0,
      touchCurrentX: 0,
      touchCurrentY: 0,
      selectedText: '',
      isMultiWord: false,
      isDwellLocked: false,
      anchorX: 0,
      anchorY: 0,
      isEscapingUp: false,
      isSavingDown: false,
      canReArm: false
    });
    touchStartPosRef.current = null;
  };

  return (
    <motion.div
      id="fullscreen-flowing-lyrics-view"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 20 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
      className="absolute inset-0 z-50 flex flex-col justify-between overflow-hidden select-none bg-[#FAF8F5] dark:bg-[#0D1117] cursor-pointer hardware-accelerated"
      onClick={handleBlankAreaClick}
      onTouchStart={handleBgTouchStart}
      onMouseDown={handleBgTouchStart}
      onTouchMove={handlePointerMove}
      onMouseMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onMouseUp={handlePointerUp}
      onTouchCancel={handlePointerUp}
    >
      {/* Full-bleed Ambient Fluid Mesh Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ contain: 'paint' }}>
        <div
          className="absolute -top-16 -left-16 w-80 h-80 rounded-full blur-[90px] opacity-40 dark:opacity-20"
          style={{ backgroundColor: palette[0] || '#CBD5C8', transform: 'translate3d(0, 0, 0)' }}
        />
        <div
          className="absolute top-1/3 -right-16 w-72 h-72 rounded-full blur-[85px] opacity-35 dark:opacity-15"
          style={{ backgroundColor: palette[1] || '#E6DFD5', transform: 'translate3d(0, 0, 0)' }}
        />
        <div
          className="absolute -bottom-16 left-1/4 w-80 h-80 rounded-full blur-[95px] opacity-30 dark:opacity-20"
          style={{ backgroundColor: palette[2] || '#C3B8A8', transform: 'translate3d(0, 0, 0)' }}
        />
      </div>

      {/* Top Header: Left Minimalist ‹ Button, Right [ 译 ] Capsule */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full px-5 pt-[var(--android-safe-top,max(3.25rem,calc(env(safe-area-inset-top,44px)+0.85rem)))] pb-3 flex items-center justify-between z-40 pointer-events-auto cursor-default"
      >
        {/* Left: Minimalist Back Button */}
        <div className="flex items-center gap-2 min-w-[70px]">
          <button
            id="lyrics-header-back-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-900/5 dark:bg-white/10 hover:bg-stone-900/10 dark:hover:bg-white/15 active:scale-95 text-stone-700 dark:text-stone-300 backdrop-blur-md flex items-center justify-center transition-all border border-stone-200/50 dark:border-white/5"
            aria-label="Return to player"
            title="Return to gallery player"
          >
            <ChevronLeft className="w-5 h-5 -ml-0.5" />
          </button>
        </div>

        {/* Center: Song Title & Artist */}
        <div className="flex-1 px-2 flex flex-col items-center justify-center text-center overflow-hidden pointer-events-none select-none">
          <p
            className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#78716C] dark:text-stone-400 font-normal truncate max-w-[180px]"
          >
            {currentSong.artist ? currentSong.artist.toUpperCase() : 'ETHEREAL SOUNDS'}
          </p>
          <h2
            className="font-serif-luxury text-[13px] sm:text-sm font-normal text-[#292524] dark:text-stone-100 tracking-[0.15em] uppercase truncate max-w-[200px] leading-tight mt-0.5"
          >
            {currentSong.title}
          </h2>
        </div>

        {/* Right: Minimalist [ 译 ] Capsule Toggle */}
        <div className="min-w-[70px] flex items-center justify-end">
          <button
            id="lyrics-translation-toggle-btn"
            onClick={() => {
              setShowTranslation(!showTranslation);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide backdrop-blur-md transition-all active:scale-95 border ${
              showTranslation
                ? 'bg-[#516050] text-white border-[#516050] shadow-xs'
                : 'bg-stone-900/5 dark:bg-white/10 text-stone-700 dark:text-stone-300 border-stone-200/60 dark:border-white/10 hover:bg-stone-900/10 dark:hover:bg-white/15'
            }`}
            aria-label="Toggle translation"
            title="Toggle lyric translations"
          >
            译
          </button>
        </div>
      </div>

      {/* Top Selection Banner during touch long-press (Refined dark blur bar below header) */}
      <AnimatePresence>
        {gestureState.isLongPressing && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-24 left-0 right-0 z-50 px-4 pointer-events-none"
          >
            <div
              className={`w-full max-w-lg mx-auto px-4 py-2.5 rounded-xl backdrop-blur-xl border flex items-center justify-between gap-3 shadow-xl transition-all duration-200 ${
                gestureState.isEscapingUp
                  ? 'bg-rose-950/95 border-rose-500/60 text-rose-100 shadow-rose-950/50 scale-[0.98]'
                  : gestureState.isSavingDown
                  ? 'bg-[#0f2918]/95 border-emerald-500/60 text-emerald-100 shadow-emerald-950/50 scale-[1.02]'
                  : 'bg-[#141414]/90 dark:bg-[#11161d]/90 border-white/15 text-white'
              }`}
            >
              {/* Left: Selected phrase clean typography */}
              <div className="flex items-center min-w-0 flex-1 overflow-hidden">
                <span
                  className={`font-serif-luxury italic text-sm sm:text-base font-medium truncate tracking-wide ${
                    gestureState.isEscapingUp
                      ? 'text-rose-200 line-through opacity-80'
                      : gestureState.isSavingDown
                      ? 'text-emerald-300 font-semibold'
                      : 'text-stone-100'
                  }`}
                >
                  {gestureState.isSavingDown ? `★ "${gestureState.selectedText}"` : `"${gestureState.selectedText}"`}
                </span>
              </div>

              {/* Right: Dynamic State Indicator */}
              <div className="flex-shrink-0 flex items-center pl-2">
                {gestureState.isEscapingUp ? (
                  <span className="text-xs font-semibold text-rose-300 tracking-wide font-sans animate-bounce flex items-center gap-1">
                    ✕ Cancel
                  </span>
                ) : gestureState.isSavingDown ? (
                  <span className="text-xs font-semibold text-emerald-300 tracking-wide font-sans animate-bounce flex items-center gap-1">
                    ★ Save
                  </span>
                ) : gestureState.isDwellLocked ? (
                  <span className="text-xs text-emerald-300 dark:text-emerald-400 font-sans tracking-wide flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Locked · ↓ Save · ↑ Cancel</span>
                  </span>
                ) : gestureState.isMultiWord ? (
                  <span className="text-xs text-amber-300/90 font-sans tracking-wide flex items-center gap-1">
                    <span>Selecting · Hold to Lock</span>
                  </span>
                ) : (
                  <span className="text-xs text-stone-300 font-sans tracking-wide">
                    ↓ Save · ↑ Cancel · Release to View
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lyrics Viewport Container with Scrub Aim Guide Timeline */}
      <div className="relative flex-1 w-full flex flex-col overflow-hidden">
        {/* Aim Guide Timeline (Unobtrusive outer-gutter alignment, no overlap with lyrics) */}
        <AnimatePresence>
          {isScrubbing && (
            <motion.div
              id="lyrics-aim-guide-timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ top: '42%' }}
              className="absolute left-0 right-0 z-30 pointer-events-none flex items-center -translate-y-1/2 px-3 sm:px-6"
            >
              {/* Left: Subtle Minimalist Time Stamp in the gutter */}
              <div className="pointer-events-auto flex items-center shrink-0 w-12 sm:w-14">
                <span className="text-[11px] font-mono font-medium text-stone-400 dark:text-stone-500 tracking-wider select-none">
                  {formatTime((parsedLyrics[aimedLyricIndex]?.timeMs || 0) / 1000)}
                </span>
              </div>

              {/* Center Guide Line: ultra-faint dashed hairline between gutters */}
              <div className="flex-1 h-[1px] mx-1 border-b border-dashed border-stone-300/40 dark:border-white/15 opacity-60" />

              {/* Right: Delicate Minimalist Play Action Icon in the gutter */}
              <div className="pointer-events-auto flex items-center justify-end shrink-0 w-12 sm:w-14">
                <button
                  id="lyrics-seek-play-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeekToLine(aimedLyricIndex);
                  }}
                  className="w-7 h-7 rounded-full bg-stone-300/30 dark:bg-white/10 hover:bg-stone-400/40 dark:hover:bg-white/20 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-all flex items-center justify-center cursor-pointer active:scale-90 shadow-2xs"
                  title="跳转播放此句歌词"
                >
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Flowing Lyrics Canvas (Safe horizontal gutters px-16 sm:px-20 and vertical fade mask ensure zero boundary bleed) */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          style={{
            gap: `${lineSpacing}px`,
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 7%, black 88%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 7%, black 88%, transparent 100%)'
          }}
          className="flex-1 w-full overflow-y-auto no-scrollbar px-16 sm:px-20 pt-8 pb-[160px] flex flex-col text-center select-none z-20 transition-[gap] duration-150"
        >
          {/* Top Spacer */}
          <div className="h-12 flex-shrink-0" />

          {parsedLyrics.map((line, lIdx) => {
            const isActive = lIdx === activeLyricIndex;
            const isAimed = isScrubbing && lIdx === aimedLyricIndex;
            const isFocusedInGesture = gestureState.isLongPressing && gestureState.activeLineIdx === lIdx;
            const isDimmed = gestureState.isLongPressing && gestureState.activeLineIdx !== lIdx;

            // Gesture active selection span bounds
            const minSpanIdx =
              isFocusedInGesture && gestureState.startSpanIdx !== null && gestureState.currentSpanIdx !== null
                ? Math.min(gestureState.startSpanIdx, gestureState.currentSpanIdx)
                : -1;
            const maxSpanIdx =
              isFocusedInGesture && gestureState.startSpanIdx !== null && gestureState.currentSpanIdx !== null
                ? Math.max(gestureState.startSpanIdx, gestureState.currentSpanIdx)
                : -1;

            // Highlight anchor bounds if full-screen detail is active
            const hasAnchor = highlightAnchor && highlightAnchor.lineIdx === lIdx;

            const translation = showTranslation ? (line.translation || getLyricLineTranslation(line.rawText)) : '';

            const lineOpacity = isDimmed ? 0.18 : isAimed ? 1 : isActive ? 1 : isScrubbing ? 0.45 : 0.38;
            const lineScale = isAimed ? 1.02 : isActive ? activeScaleFactor : 0.97;

            return (
              <div
                key={`${line.timeMs}-${lIdx}`}
                data-line-index={lIdx}
                ref={isActive ? activeLineRef : null}
                style={{
                  opacity: lineOpacity,
                  transform: `translate3d(0, 0, 0) scale(${lineScale})`,
                  WebkitTransform: `translate3d(0, 0, 0) scale(${lineScale})`,
                  transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease-out',
                  willChange: isActive || isAimed ? 'transform, opacity' : 'auto'
                }}
                className="py-1 cursor-pointer"
                onClick={() => {
                  if (isScrubbing && !gestureState.isLongPressing) {
                    handleSeekToLine(lIdx);
                  }
                }}
              >
                {/* Whole-Sentence Cohesive Lyric Rendering */}
                <div className="inline-flex flex-wrap items-center justify-center leading-relaxed">
                  {line.spans.map((span, sIdx) => {
                    const isInGestureSelection =
                      isFocusedInGesture && sIdx >= minSpanIdx && sIdx <= maxSpanIdx;
                    const isAnchorSpan =
                      hasAnchor && sIdx >= highlightAnchor.startSpan && sIdx <= highlightAnchor.endSpan;

                    // Corner rounding for continuous seamless flowing highlight ribbon
                    const isFirstSelected = isInGestureSelection && sIdx === minSpanIdx;
                    const isLastSelected = isInGestureSelection && sIdx === maxSpanIdx;
                    const isSingleSelected = isInGestureSelection && minSpanIdx === maxSpanIdx;

                    const isFirstAnchor = isAnchorSpan && sIdx === highlightAnchor.startSpan;
                    const isLastAnchor = isAnchorSpan && sIdx === highlightAnchor.endSpan;
                    const isSingleAnchor = isAnchorSpan && highlightAnchor.startSpan === highlightAnchor.endSpan;

                    // O(1) lookup from precomputed vocabulary book matrix
                    const isSaved = Boolean(savedSpanLookup[lIdx]?.[sIdx]);
                    const savedUnderlineClasses = isSaved
                      ? 'underline decoration-[#455743] dark:decoration-[#84AA87] underline-offset-[5px] decoration-[1.5px]'
                      : '';

                    // Determine connected rounded edges for multi-word gesture selection
                    let selectionClasses = '';
                    if (isInGestureSelection) {
                      const isEscaping = gestureState.isEscapingUp;
                      const isSaving = gestureState.isSavingDown;
                      const isLocked = gestureState.isDwellLocked;

                      const rounded = isSingleSelected
                        ? 'rounded-md'
                        : isFirstSelected
                        ? 'rounded-l-md rounded-r-none'
                        : isLastSelected
                        ? 'rounded-r-md rounded-l-none'
                        : 'rounded-none';

                      if (isEscaping) {
                        selectionClasses = `${rounded} bg-rose-500/20 dark:bg-rose-500/30 text-rose-800 dark:text-rose-200 line-through opacity-80 shadow-xs`;
                      } else if (isSaving) {
                        selectionClasses = `${rounded} bg-emerald-500/25 dark:bg-emerald-500/35 text-emerald-950 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500/50`;
                      } else if (isLocked) {
                        selectionClasses = `${rounded} bg-[#516050]/25 dark:bg-[#7EA783]/30 text-stone-950 dark:text-white shadow-sm ring-1 ring-[#516050]/50 dark:ring-[#8FB996]/60`;
                      } else {
                        selectionClasses = `${rounded} bg-[#516050]/20 dark:bg-[#7EA783]/25 text-stone-950 dark:text-white`;
                      }
                    } else if (isAnchorSpan) {
                      const rounded = isSingleAnchor
                        ? 'rounded-md'
                        : isFirstAnchor
                        ? 'rounded-l-md rounded-r-none'
                        : isLastAnchor
                        ? 'rounded-r-md rounded-l-none'
                        : 'rounded-none';
                      selectionClasses = `${rounded} bg-[#516050]/15 dark:bg-[#7EA783]/20 text-stone-950 dark:text-white`;
                    } else if (isActive) {
                      // Whole sentence active line styling (cohesive, unified, highly legible)
                      selectionClasses = `text-stone-950 dark:text-stone-50 ${savedUnderlineClasses}`;
                    } else if (isAimed) {
                      // Aimed line during scroll/scrub
                      selectionClasses = `text-stone-900 dark:text-stone-100 ${savedUnderlineClasses}`;
                    } else {
                      // Unfocused background lines
                      selectionClasses = `text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 ${savedUnderlineClasses}`;
                    }

                    return (
                      <span
                        key={`${span.startMs}-${sIdx}`}
                        data-lyric-line={lIdx}
                        data-span-index={sIdx}
                        onTouchStart={(e) => handleWordTouchStart(e, lIdx, sIdx, span.text)}
                        onMouseDown={(e) => handleWordTouchStart(e, lIdx, sIdx, span.text)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!gestureState.isLongPressing) {
                            handleSingleWordClick(span.text, line.rawText, e.currentTarget);
                          }
                        }}
                        style={{ fontSize: `${fontSize}px` }}
                        className={`relative inline-block transition-colors duration-100 font-serif-luxury cursor-pointer select-none leading-relaxed px-1 py-0.5 mx-[1px] rounded-md ${selectionClasses}`}
                      >
                        {span.text}
                      </span>
                    );
                  })}
                </div>

                {/* Chinese Translation Line (Smooth fade in when [ 译 ] is on) */}
                {showTranslation && translation && (
                  <p
                    style={{ fontSize: `${translationFontSize}px` }}
                    className="text-stone-500 dark:text-stone-400 font-sans tracking-wide mt-1.5 transition-opacity duration-200"
                  >
                    {translation}
                  </p>
                )}
              </div>
            );
          })}

          {/* Extra Bottom Spacer */}
          <div className="h-16 flex-shrink-0" />
        </div>
      </div>

      {/* Bottom-Right Minimalist Single Settings Capsule Trigger */}
      <div
        id="lyrics-adjust-triggers"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-4 bottom-6 z-30 flex items-center select-none cursor-default"
      >
        <button
          id="lyrics-settings-modal-btn"
          type="button"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          aria-label="Adjust lyrics layout and sync"
          title="歌词与排版设置"
          className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95 border cursor-pointer relative shadow-xs ${
            isSettingsOpen
              ? 'bg-[#516050] text-white border-[#516050]'
              : 'bg-white/80 dark:bg-stone-900/80 text-stone-700 dark:text-stone-200 border-stone-200/90 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {/* Subtle indicator dot if custom sync offset or layout is applied */}
          {currentOffset !== 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-stone-900" />
          )}
        </button>
      </div>

      {/* Slide-Up Bottom Unified Settings Sheet (Layout & Sync) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-auto overflow-hidden">
            {/* Backdrop click to dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-stone-950/40 dark:bg-black/70 backdrop-blur-xs"
            />

            {/* Bottom Drawer Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full bg-[#FAF7F2] dark:bg-[#151C28] border-t border-stone-200/80 dark:border-stone-800 rounded-t-[28px] px-5 pt-3 pb-6 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] z-10 select-none space-y-3.5"
            >
              {/* Drag Handle Indicator */}
              <div className="w-9 h-1 rounded-full bg-stone-300 dark:bg-stone-600 mx-auto" />

              {/* Header with Navigation Tabs and Close */}
              <div className="flex items-center justify-between border-b border-stone-200/70 dark:border-stone-800/80 pb-2.5">
                {/* Tabs Switcher */}
                <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-stone-800/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveSettingsTab('layout')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      activeSettingsTab === 'layout'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                        : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>排版样式</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSettingsTab('sync')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      activeSettingsTab === 'sync'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                        : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>歌词微调</span>
                    {currentOffset !== 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeSettingsTab === 'layout') {
                        handleFontSizeChange(19);
                        handleLineSpacingChange(24);
                        showToast('已恢复默认排版');
                      } else {
                        handleOffsetChange(0);
                        showToast('已恢复标准歌词对齐');
                      }
                    }}
                    title="重置当前项"
                    className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    title="关闭"
                    className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tab 1: Layout & Typography */}
              {activeSettingsTab === 'layout' && (
                <div className="space-y-3.5 pt-0.5">
                  {/* Font Size Control */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-[#516050] dark:text-[#8FB996]" />
                        <span>歌词字号</span>
                      </span>
                      <span className="font-mono text-stone-400 dark:text-stone-500 font-semibold">
                        {fontSize}px
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif-luxury text-xs text-stone-400">A</span>
                      <input
                        id="lyrics-font-size-slider"
                        type="range"
                        min={MIN_FONT_SIZE}
                        max={MAX_FONT_SIZE}
                        step={1}
                        value={fontSize}
                        onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
                        className="flex-1 accent-[#516050] dark:accent-[#8FB996] h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer appearance-none"
                      />
                      <span className="font-serif-luxury text-base text-stone-700 dark:text-stone-200 font-semibold">A</span>
                    </div>
                  </div>

                  {/* Line Spacing Control */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                        <MoveVertical className="w-3.5 h-3.5 text-[#516050] dark:text-[#8FB996]" />
                        <span>行间距</span>
                      </span>
                      <span className="font-mono text-stone-400 dark:text-stone-500 font-semibold">
                        {lineSpacing}px
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MoveVertical className="w-3.5 h-3.5 text-stone-400" />
                      <input
                        id="lyrics-line-spacing-slider"
                        type="range"
                        min={MIN_LINE_SPACING}
                        max={MAX_LINE_SPACING}
                        step={2}
                        value={lineSpacing}
                        onChange={(e) => handleLineSpacingChange(parseFloat(e.target.value))}
                        className="flex-1 accent-[#516050] dark:accent-[#8FB996] h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer appearance-none"
                      />
                      <MoveVertical className="w-4.5 h-4.5 text-stone-700 dark:text-stone-200" />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Lyrics Sync & Offset */}
              {activeSettingsTab === 'sync' && (
                <div className="space-y-3 pt-0.5">
                  {/* Status Indicator Pill */}
                  <div className="flex items-center justify-between bg-stone-100/90 dark:bg-stone-800/80 px-3 py-2 rounded-xl border border-stone-200/60 dark:border-stone-750">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#516050] dark:text-[#8FB996]" />
                      <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                        当前时间偏移
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        currentOffset > 0
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                          : currentOffset < 0
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25'
                          : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      {currentOffset > 0
                        ? `提前 +${currentOffset.toFixed(1)}s`
                        : currentOffset < 0
                        ? `延后 ${currentOffset.toFixed(1)}s`
                        : '0.0s'}
                    </span>
                  </div>

                  {/* Fast Preset Step Buttons */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleOffsetStep(0.5)}
                      className="py-1.5 px-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 hover:border-emerald-500/50 text-xs font-mono text-stone-700 dark:text-stone-200 active:scale-95 transition-all cursor-pointer shadow-2xs"
                    >
                      +0.5s
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOffsetStep(0.2)}
                      className="py-1.5 px-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 hover:border-emerald-500/50 text-xs font-mono text-stone-700 dark:text-stone-200 active:scale-95 transition-all cursor-pointer shadow-2xs"
                    >
                      +0.2s
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOffsetStep(-0.2)}
                      className="py-1.5 px-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 hover:border-amber-500/50 text-xs font-mono text-stone-700 dark:text-stone-200 active:scale-95 transition-all cursor-pointer shadow-2xs"
                    >
                      -0.2s
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOffsetStep(-0.5)}
                      className="py-1.5 px-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 hover:border-amber-500/50 text-xs font-mono text-stone-700 dark:text-stone-200 active:scale-95 transition-all cursor-pointer shadow-2xs"
                    >
                      -0.5s
                    </button>
                  </div>

                  {/* Range Slider for Fine Continuous Tuning */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 dark:text-stone-500">
                      <span>延后 (-5s)</span>
                      <span>0s</span>
                      <span>提前 (+5s)</span>
                    </div>
                    <input
                      id="lyrics-offset-slider"
                      type="range"
                      min={-5}
                      max={5}
                      step={0.1}
                      value={currentOffset}
                      onChange={(e) => handleOffsetChange(parseFloat(e.target.value))}
                      className="w-full accent-[#516050] dark:accent-[#8FB996] h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer appearance-none"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
