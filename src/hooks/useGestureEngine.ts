import { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

interface GestureEngineOptions {
  enableXSwipe?: boolean;
  enableYSwipeInMusic?: boolean;
}

function isAnyModalOpen(state: ReturnType<typeof useAppStore.getState>): boolean {
  return Boolean(
    state.isWordSheetOpen ||
    state.isQuizDrawerOpen ||
    state.isAssessmentModalOpen ||
    state.isFullscreenLyricsOpen ||
    state.isPersonalHubOpen ||
    state.isNotebookOpen ||
    state.isPlaylistOpen ||
    state.isVocabRadarOpen ||
    state.isCambridgeSelectorOpen ||
    state.isOnlineSearchOpen ||
    state.isAudioQualityModalOpen ||
    state.activeArchiveReviewRecord ||
    state.isIeltsTimeoutModalOpen ||
    state.isIeltsAdjustMenuOpen
  );
}

export function useGestureEngine(options: GestureEngineOptions = {}) {
  const { enableXSwipe = true, enableYSwipeInMusic = true } = options;
  const activeSpace = useAppStore(s => s.activeSpace);
  const activeSpaceRef = useRef(activeSpace);
  useEffect(() => {
    activeSpaceRef.current = activeSpace;
  }, [activeSpace]);

  const setActiveSpace = useAppStore(s => s.setActiveSpace);
  const nextSong = useAppStore(s => s.nextSong);
  const prevSong = useAppStore(s => s.prevSong);

  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const containerWidthRef = useRef(412);
  const isDragging = useRef(false);
  const lockedAxis = useRef<'x' | 'y' | null>(null);
  const suppressClickUntil = useRef(0);
  const vpRef = useRef<HTMLElement | null>(null);
  const pendingDiffX = useRef<number>(0);
  const rafId = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent | MouseEvent) => {
    const state = useAppStore.getState();
    // If any modal sheet, fullscreen lyrics, or overlay is open, do not intercept main viewpager swipes
    if (isAnyModalOpen(state)) {
      isDragging.current = false;
      return;
    }

    // Do not intercept if clicking on dedicated interactive controls or inside modal/sheet/drawer handles
    const target = e.target as HTMLElement | null;
    if (
      target &&
      typeof target.closest === 'function' &&
      target.closest(
        'button, input, textarea, select, [role="slider"], [data-no-swipe="true"], [data-no-gesture="true"], [role="dialog"], #music-playlist-sheet, #vocab-radar-sheet, #audio-quality-sheet, #ielts-quiz-drawer, .no-swipe'
      )
    ) {
      isDragging.current = false;
      return;
    }

    const point = 'touches' in e ? e.touches[0] : e;
    startX.current = point.clientX;
    startY.current = point.clientY;
    startTime.current = Date.now();
    currentX.current = point.clientX;
    currentY.current = point.clientY;
    isDragging.current = true;
    lockedAxis.current = null;

    // Cache viewport container element and width once at gesture onset to eliminate forced layout reflow during RAF animations
    const vp = document.getElementById('viewpager-viewport');
    vpRef.current = vp;
    containerWidthRef.current = vp?.parentElement?.clientWidth || window.innerWidth || 412;
  }, []);

  const updateViewportTransform = useCallback((diffX: number) => {
    pendingDiffX.current = diffX;
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const el = vpRef.current || document.getElementById('viewpager-viewport');
        if (!el) return;
        el.style.transition = 'none';
        (el.style as any).webkitTransition = 'none';
        const containerWidth = containerWidthRef.current || 412;
        const currentActiveSpace = activeSpaceRef.current;
        const currentDiffX = pendingDiffX.current;
        const dragPercent = (currentDiffX / containerWidth) * (100 / 3);
        const basePercent = -(currentActiveSpace * 100) / 3;
        let finalPercent = basePercent + dragPercent;
        // Soft elastic rubber-band resistance at boundary edges
        if ((currentActiveSpace === 0 && currentDiffX > 0) || (currentActiveSpace === 2 && currentDiffX < 0)) {
          finalPercent = basePercent + dragPercent * 0.28;
        }
        el.style.transform = `translate3d(${finalPercent}%, 0, 0)`;
        (el.style as any).webkitTransform = `translate3d(${finalPercent}%, 0, 0)`;
      });
    }
  }, []);

  const resetViewportTransition = useCallback((targetSpace: number) => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    const el = vpRef.current || document.getElementById('viewpager-viewport');
    if (!el) return;
    el.style.transition = 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)';
    (el.style as any).webkitTransition = '-webkit-transform 380ms cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = `translate3d(-${(targetSpace * 100) / 3}%, 0, 0)`;
    (el.style as any).webkitTransform = `translate3d(-${(targetSpace * 100) / 3}%, 0, 0)`;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!isDragging.current) return;

    const state = useAppStore.getState();
    if (isAnyModalOpen(state)) {
      isDragging.current = false;
      return;
    }

    const point = 'touches' in e ? e.touches[0] : e;
    currentX.current = point.clientX;
    currentY.current = point.clientY;

    const diffX = currentX.current - startX.current;
    const diffY = currentY.current - startY.current;

    // Lock axis once user moves beyond initial deadzone (6px)
    if (!lockedAxis.current) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        // Bias towards horizontal navigation: if horizontal movement is dominant or comparable
        if (Math.abs(diffX) >= Math.abs(diffY) * 0.75) {
          lockedAxis.current = 'x';
        } else if (Math.abs(diffY) > Math.abs(diffX) * 1.2 && activeSpaceRef.current === 1) {
          lockedAxis.current = 'y';
        }
      }
    }

    if (lockedAxis.current === 'x' && enableXSwipe) {
      updateViewportTransform(diffX);
    }
  }, [enableXSwipe, updateViewportTransform]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const currentSpace = activeSpaceRef.current;
    const state = useAppStore.getState();
    if (isAnyModalOpen(state)) {
      lockedAxis.current = null;
      resetViewportTransition(currentSpace);
      return;
    }

    const diffX = currentX.current - startX.current;
    const diffY = currentY.current - startY.current;
    const duration = Math.max(1, Date.now() - startTime.current);
    const velocityX = diffX / duration; // px per ms
    const velocityY = diffY / duration;
    const totalDistance = Math.hypot(diffX, diffY);

    // If there was any noticeable drag movement (> 10px), suppress subsequent click events
    if (totalDistance > 10 || lockedAxis.current !== null) {
      suppressClickUntil.current = Date.now() + 250;
    }

    // Responsive thresholds for horizontal space navigation (anti-accidental swipe calibrated)
    const isFastFlickX = Math.abs(velocityX) > 0.22 && Math.abs(diffX) > 25;
    const isNormalSwipeX = Math.abs(diffX) > 45;
    const isHorizontalIntent =
      lockedAxis.current === 'x' ||
      (Math.abs(diffX) > Math.abs(diffY) * 1.2 && (isFastFlickX || isNormalSwipeX));

    let targetSpace = currentSpace;
    if (isHorizontalIntent && enableXSwipe) {
      if (diffX < 0 && (diffX < -45 || isFastFlickX)) {
        // Swipe Left (drag finger left) -> Go Right to next space (e.g. from AR [0] -> Music [1] -> IELTS [2])
        if (currentSpace < 2) {
          targetSpace = currentSpace + 1;
        }
      } else if (diffX > 0 && (diffX > 45 || isFastFlickX)) {
        // Swipe Right (drag finger right) -> Go Left to previous space (e.g. from IELTS [2] -> Music [1] -> AR [0])
        if (currentSpace > 0) {
          targetSpace = currentSpace - 1;
        }
      }
    } else if (lockedAxis.current === 'y' && enableYSwipeInMusic && currentSpace === 1) {
      const isFastFlickY = Math.abs(velocityY) > 0.22 && Math.abs(diffY) > 20;
      if (diffY < -30 || (diffY < 0 && isFastFlickY)) {
        // Swipe Up -> Next song
        nextSong('up');
      } else if (diffY > 30 || (diffY > 0 && isFastFlickY)) {
        // Swipe Down -> Previous song
        prevSong('down');
      }
    }

    resetViewportTransition(targetSpace);
    if (targetSpace !== currentSpace) {
      setActiveSpace(targetSpace);
    }

    lockedAxis.current = null;
  }, [enableXSwipe, enableYSwipeInMusic, nextSong, prevSong, resetViewportTransition, setActiveSpace]);

  useEffect(() => {
    const el = window;

    const handleCancel = () => {
      isDragging.current = false;
      resetViewportTransition(activeSpaceRef.current);
      lockedAxis.current = null;
    };

    // Use capture phase so no nested element's stopPropagation can block gesture detection
    el.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true, capture: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true, capture: true });
    el.addEventListener('touchcancel', handleCancel, { passive: true, capture: true });

    // Mouse events for desktop testability
    el.addEventListener('mousedown', handleTouchStart, true);
    el.addEventListener('mousemove', handleTouchMove, true);
    el.addEventListener('mouseup', handleTouchEnd, true);
    el.addEventListener('mouseleave', handleCancel, true);

    // Suppress click events immediately following a drag/swipe
    const handleCaptureClick = (e: MouseEvent) => {
      if (Date.now() < suppressClickUntil.current) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    window.addEventListener('click', handleCaptureClick, true);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart, { capture: true });
      el.removeEventListener('touchmove', handleTouchMove, { capture: true });
      el.removeEventListener('touchend', handleTouchEnd, { capture: true });
      el.removeEventListener('touchcancel', handleCancel, { capture: true });
      el.removeEventListener('mousedown', handleTouchStart, true);
      el.removeEventListener('mousemove', handleTouchMove, true);
      el.removeEventListener('mouseup', handleTouchEnd, true);
      el.removeEventListener('mouseleave', handleCancel, true);
      window.removeEventListener('click', handleCaptureClick, true);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, resetViewportTransition]);
}
