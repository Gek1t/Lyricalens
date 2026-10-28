import { useState, useRef, useCallback, useEffect } from 'react';

export type GestureStage = 
  | 'idle'
  | 'selecting'      // Phase 1: Free word expansion & edge scrolling, vertical action blocked for multi-word
  | 'locked'         // Phase 2: Dwell locked (200ms stationary) or single word ready
  | 'action_swiping'; // Phase 3: Actively swiping up/down from anchor

export interface GestureWordCaptureConfig<TWord> {
  // Callback when selection range changes [startIndex, endIndex] inclusive
  onRangeChange?: (startIndex: number, endIndex: number) => void;
  // Callback to find word index at client coordinates (clientX, clientY)
  getWordIndexAtPoint: (clientX: number, clientY: number) => number | null;
  // Callback to get scrollable container element for edge auto-scrolling
  getScrollContainer?: () => HTMLElement | null;
  // On save triggered (slide down release or fast path)
  onSave: (startIndex: number, endIndex: number, words: TWord[]) => void;
  // On cancel triggered (slide up release)
  onCancel: () => void;
  // On click/tap/stationary release triggered (open detail modal/card)
  onInspect: (startIndex: number, endIndex: number, words: TWord[], anchorRect?: DOMRect) => void;
  // Words array
  allWords: TWord[];
}

export interface GestureState {
  stage: GestureStage;
  isCapturing: boolean;
  isMultiWord: boolean;
  startIndex: number;
  endIndex: number;
  isDwellLocked: boolean;
  isEscapingUp: boolean;     // Swiping UP to cancel
  isSavingDown: boolean;     // Swiping DOWN to save
  pullDistanceY: number;     // Vertical offset from anchor
  canReArm: boolean;         // In locked state, can unlock if horizontal drag occurs
}

export function useGestureWordCapture<TWord>(config: GestureWordCaptureConfig<TWord>) {
  const [gestureState, setGestureState] = useState<GestureState>({
    stage: 'idle',
    isCapturing: false,
    isMultiWord: false,
    startIndex: -1,
    endIndex: -1,
    isDwellLocked: false,
    isEscapingUp: false,
    isSavingDown: false,
    pullDistanceY: 0,
    canReArm: false,
  });

  const stateRef = useRef(gestureState);
  stateRef.current = gestureState;

  const configRef = useRef(config);
  configRef.current = config;

  // Internal tracking refs
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const anchorPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dwellTimerRef = useRef<number | null>(null);
  const autoScrollAnimRef = useRef<number | null>(null);
  const autoScrollSpeedRef = useRef<number>(0);
  const initialWordIndexRef = useRef<number>(-1);
  const lastMovedTimeRef = useRef<number>(0);

  // Trigger tactile haptic feedback safely
  const triggerHaptic = useCallback((pattern: number | number[] = 15) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // ignore
    }
  }, []);

  // Stop auto-scroll loop
  const stopAutoScroll = useCallback(() => {
    if (autoScrollAnimRef.current !== null) {
      cancelAnimationFrame(autoScrollAnimRef.current);
      autoScrollAnimRef.current = null;
    }
    autoScrollSpeedRef.current = 0;
  }, []);

  // Continuous smooth auto-scroll loop
  const stepAutoScroll = useCallback(() => {
    const container = configRef.current.getScrollContainer?.();
    if (container && autoScrollSpeedRef.current !== 0) {
      container.scrollTop += autoScrollSpeedRef.current;
      
      // While auto-scrolling, re-evaluate word under current touch point
      const wordIdx = configRef.current.getWordIndexAtPoint(
        currentPosRef.current.x,
        currentPosRef.current.y
      );
      if (wordIdx !== null && wordIdx >= 0 && initialWordIndexRef.current >= 0) {
        const start = Math.min(initialWordIndexRef.current, wordIdx);
        const end = Math.max(initialWordIndexRef.current, wordIdx);
        if (start !== stateRef.current.startIndex || end !== stateRef.current.endIndex) {
          const isMulti = start !== end;
          setGestureState(prev => ({
            ...prev,
            startIndex: start,
            endIndex: end,
            isMultiWord: isMulti,
          }));
          configRef.current.onRangeChange?.(start, end);
        }
      }
      autoScrollAnimRef.current = requestAnimationFrame(stepAutoScroll);
    } else {
      stopAutoScroll();
    }
  }, [stopAutoScroll]);

  // Start edge auto-scroll when near top/bottom boundaries
  const updateEdgeScroll = useCallback((clientY: number) => {
    const container = configRef.current.getScrollContainer?.();
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const edgeThreshold = 65; // px from top or bottom
    const maxSpeed = 12;

    if (clientY < rect.top + edgeThreshold && clientY > rect.top - 20) {
      // Near top edge: scroll UP
      const ratio = 1 - Math.max(0, (clientY - rect.top) / edgeThreshold);
      autoScrollSpeedRef.current = -Math.max(2, ratio * maxSpeed);
      if (autoScrollAnimRef.current === null) {
        autoScrollAnimRef.current = requestAnimationFrame(stepAutoScroll);
      }
    } else if (clientY > rect.bottom - edgeThreshold && clientY < rect.bottom + 20) {
      // Near bottom edge: scroll DOWN
      const ratio = 1 - Math.max(0, (rect.bottom - clientY) / edgeThreshold);
      autoScrollSpeedRef.current = Math.max(2, ratio * maxSpeed);
      if (autoScrollAnimRef.current === null) {
        autoScrollAnimRef.current = requestAnimationFrame(stepAutoScroll);
      }
    } else {
      // Neutral zone: stop scroll
      stopAutoScroll();
    }
  }, [stepAutoScroll, stopAutoScroll]);

  // Clear dwell timer
  const clearDwellTimer = useCallback(() => {
    if (dwellTimerRef.current !== null) {
      window.clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
  }, []);

  // Schedule dwell lock (200ms stationary)
  const scheduleDwellLock = useCallback(() => {
    clearDwellTimer();
    dwellTimerRef.current = window.setTimeout(() => {
      // When 200ms stationary elapses: Lock selection and establish gesture anchor
      anchorPosRef.current = { ...currentPosRef.current };
      triggerHaptic([18, 40, 18]); // Crisp dwell-lock haptic
      setGestureState(prev => ({
        ...prev,
        stage: 'locked',
        isDwellLocked: true,
        canReArm: true,
        pullDistanceY: 0,
      }));
    }, 200);
  }, [clearDwellTimer, triggerHaptic]);

  // Start gesture capture from a long press on wordIndex
  const startCapture = useCallback((
    wordIndex: number,
    clientX: number,
    clientY: number
  ) => {
    initialWordIndexRef.current = wordIndex;
    touchStartPosRef.current = { x: clientX, y: clientY };
    currentPosRef.current = { x: clientX, y: clientY };
    anchorPosRef.current = { x: clientX, y: clientY };
    lastMovedTimeRef.current = Date.now();

    triggerHaptic(20);

    setGestureState({
      stage: 'selecting',
      isCapturing: true,
      isMultiWord: false,
      startIndex: wordIndex,
      endIndex: wordIndex,
      isDwellLocked: false,
      isEscapingUp: false,
      isSavingDown: false,
      pullDistanceY: 0,
      canReArm: false,
    });

    configRef.current.onRangeChange?.(wordIndex, wordIndex);
    // Start dwell timer for multi-word anticipation or single word dwell
    scheduleDwellLock();
  }, [triggerHaptic, scheduleDwellLock]);

  // Handle Touch/Mouse Move
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!stateRef.current.isCapturing) return;

    currentPosRef.current = { x: clientX, y: clientY };
    const dxFromStart = clientX - touchStartPosRef.current.x;
    const dyFromStart = clientY - touchStartPosRef.current.y;
    const isSingleWord = stateRef.current.startIndex === stateRef.current.endIndex;

    // --- Fast Path for Single Word ---
    // If single word and user directly pulls down without dwelling
    if (isSingleWord && !stateRef.current.isDwellLocked) {
      if (dyFromStart > 25 && Math.abs(dyFromStart) > Math.abs(dxFromStart) * 1.2) {
        // Fast path downward swipe
        clearDwellTimer();
        const pullDistance = dyFromStart - 25;
        const isSaving = pullDistance > 35;
        setGestureState(prev => ({
          ...prev,
          stage: 'action_swiping',
          pullDistanceY: pullDistance,
          isSavingDown: isSaving,
          isEscapingUp: false,
        }));
        return;
      } else if (dyFromStart < -25 && Math.abs(dyFromStart) > Math.abs(dxFromStart) * 1.2) {
        // Fast path upward cancel swipe
        clearDwellTimer();
        const pullDistance = dyFromStart + 25;
        const isEscaping = pullDistance < -35;
        setGestureState(prev => ({
          ...prev,
          stage: 'action_swiping',
          pullDistanceY: pullDistance,
          isSavingDown: false,
          isEscapingUp: isEscaping,
        }));
        return;
      }
    }

    // --- Multi-Word or Free Selection Range Mode ---
    if (!stateRef.current.isDwellLocked) {
      // In Phase 1: Free word expansion & edge scrolling
      updateEdgeScroll(clientY);

      // Check if finger moved over a different word
      const targetWordIdx = configRef.current.getWordIndexAtPoint(clientX, clientY);
      if (targetWordIdx !== null && targetWordIdx >= 0 && initialWordIndexRef.current >= 0) {
        const newStart = Math.min(initialWordIndexRef.current, targetWordIdx);
        const newEnd = Math.max(initialWordIndexRef.current, targetWordIdx);
        
        if (newStart !== stateRef.current.startIndex || newEnd !== stateRef.current.endIndex) {
          const isMulti = newStart !== newEnd;
          setGestureState(prev => ({
            ...prev,
            startIndex: newStart,
            endIndex: newEnd,
            isMultiWord: isMulti,
          }));
          configRef.current.onRangeChange?.(newStart, newEnd);
          triggerHaptic(10); // subtle tick on word expand
        }
      }

      // Reset dwell timer on motion so it only locks after 200ms stillness
      scheduleDwellLock();
      return;
    }

    // --- Phase 2 & 3: Locked State ---
    if (stateRef.current.isDwellLocked) {
      const dxFromAnchor = clientX - anchorPosRef.current.x;
      const dyFromAnchor = clientY - anchorPosRef.current.y;

      // Check Re-arm Unlock: If user makes horizontal move (|dx| > 20px and |dx| > |dy| * 1.1)
      if (stateRef.current.canReArm && Math.abs(dxFromAnchor) > 22 && Math.abs(dxFromAnchor) > Math.abs(dyFromAnchor)) {
        // Unlock back to Free Selection phase
        triggerHaptic(12); // light re-arm tick
        setGestureState(prev => ({
          ...prev,
          stage: 'selecting',
          isDwellLocked: false,
          canReArm: false,
          pullDistanceY: 0,
          isSavingDown: false,
          isEscapingUp: false,
        }));
        scheduleDwellLock();
        return;
      }

      // Phase 3: Action Dispatch (Vertical Swiping)
      const isSaving = dyFromAnchor > 35;
      const isEscaping = dyFromAnchor < -35;

      setGestureState(prev => ({
        ...prev,
        stage: Math.abs(dyFromAnchor) > 15 ? 'action_swiping' : 'locked',
        pullDistanceY: dyFromAnchor,
        isSavingDown: isSaving,
        isEscapingUp: isEscaping,
      }));
    }
  }, [clearDwellTimer, scheduleDwellLock, triggerHaptic, updateEdgeScroll]);

  // Handle Pointer Up / Release
  const handlePointerUp = useCallback(() => {
    if (!stateRef.current.isCapturing) return;

    clearDwellTimer();
    stopAutoScroll();

    const { startIndex, endIndex, isSavingDown, isEscapingUp, isMultiWord, isDwellLocked } = stateRef.current;
    const dyFromStart = currentPosRef.current.y - touchStartPosRef.current.y;
    const allWords = configRef.current.allWords;
    const selectedWords = (startIndex >= 0 && endIndex >= startIndex && allWords) 
      ? allWords.slice(startIndex, endIndex + 1) 
      : [];

    // 1. Fast Path single word check on release
    if (!isMultiWord && !isDwellLocked) {
      if (dyFromStart > 40) {
        // Instant save single word
        triggerHaptic([20, 50]);
        configRef.current.onSave(startIndex, endIndex, selectedWords);
        resetState();
        return;
      } else if (dyFromStart < -40) {
        // Cancel
        triggerHaptic(15);
        configRef.current.onCancel();
        resetState();
        return;
      }
    }

    // 2. Action Dispatch based on swipe direction in locked/swiping mode
    if (isSavingDown) {
      // Save
      triggerHaptic([25, 60]);
      configRef.current.onSave(startIndex, endIndex, selectedWords);
    } else if (isEscapingUp) {
      // Cancel
      triggerHaptic(15);
      configRef.current.onCancel();
    } else {
      // Stationary Release -> Inspect / Open Details
      triggerHaptic(20);
      configRef.current.onInspect(startIndex, endIndex, selectedWords);
    }

    resetState();
  }, [clearDwellTimer, stopAutoScroll, triggerHaptic]);

  const resetState = useCallback(() => {
    stopAutoScroll();
    clearDwellTimer();
    setGestureState({
      stage: 'idle',
      isCapturing: false,
      isMultiWord: false,
      startIndex: -1,
      endIndex: -1,
      isDwellLocked: false,
      isEscapingUp: false,
      isSavingDown: false,
      pullDistanceY: 0,
      canReArm: false,
    });
  }, [clearDwellTimer, stopAutoScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearDwellTimer();
      stopAutoScroll();
    };
  }, [clearDwellTimer, stopAutoScroll]);

  return {
    gestureState,
    startCapture,
    handlePointerMove,
    handlePointerUp,
    cancelCapture: resetState,
  };
}
