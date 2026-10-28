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
  const setActiveSpace = useAppStore(s => s.setActiveSpace);
  const nextSong = useAppStore(s => s.nextSong);
  const prevSong = useAppStore(s => s.prevSong);

  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const lockedAxis = useRef<'x' | 'y' | null>(null);
  const suppressClickUntil = useRef(0);

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
  }, []);

  const rafId = useRef<number | null>(null);
  const cardRafId = useRef<number | null>(null);

  const updateViewportTransform = useCallback((diffX: number) => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = requestAnimationFrame(() => {
      const el = document.getElementById('viewpager-viewport');
      if (!el) return;
      el.style.transition = 'none';
      (el.style as any).webkitTransition = 'none';
      const containerWidth = el.parentElement?.clientWidth || window.innerWidth || 412;
      const dragRatio = Math.min(1, Math.abs(diffX) / containerWidth);
      const dragPercent = (diffX / containerWidth) * (100 / 3);
      const basePercent = -(activeSpace * 100) / 3;
      let finalPercent = basePercent + dragPercent;
      // Soft elastic rubber-band resistance at boundary edges
      if ((activeSpace === 0 && diffX > 0) || (activeSpace === 2 && diffX < 0)) {
        finalPercent = basePercent + dragPercent * 0.28;
      }
      el.style.transform = `translate3d(${finalPercent}%, 0, 0)`;
      (el.style as any).webkitTransform = `translate3d(${finalPercent}%, 0, 0)`;

      // Real-time spatial scale & opacity interpolation across panels so transition feels organic
      const panels = [
        document.getElementById('panel-ar-space'),
        document.getElementById('panel-music-space'),
        document.getElementById('panel-ielts-space')
      ];
      const targetIdx = diffX < 0 ? Math.min(2, activeSpace + 1) : Math.max(0, activeSpace - 1);
      panels.forEach((p, idx) => {
        if (!p) return;
        p.style.transition = 'none';
        (p.style as any).webkitTransition = 'none';
        if (idx === activeSpace) {
          const s = 1 - dragRatio * 0.035;
          const o = 1 - dragRatio * 0.25;
          p.style.transform = `translate3d(0, 0, 0) scale(${s.toFixed(4)})`;
          (p.style as any).webkitTransform = `translate3d(0, 0, 0) scale(${s.toFixed(4)})`;
          p.style.opacity = o.toFixed(3);
        } else if (idx === targetIdx) {
          const s = 0.965 + dragRatio * 0.035;
          const o = 0.72 + dragRatio * 0.28;
          p.style.transform = `translate3d(0, 0, 0) scale(${s.toFixed(4)})`;
          (p.style as any).webkitTransform = `translate3d(0, 0, 0) scale(${s.toFixed(4)})`;
          p.style.opacity = o.toFixed(3);
        }
      });
    });
  }, [activeSpace]);

  const resetViewportTransition = useCallback((targetSpace: number) => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    const el = document.getElementById('viewpager-viewport');
    if (!el) return;
    el.style.transition = 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)';
    (el.style as any).webkitTransition = '-webkit-transform 420ms cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = `translate3d(-${(targetSpace * 100) / 3}%, 0, 0)`;
    (el.style as any).webkitTransform = `translate3d(-${(targetSpace * 100) / 3}%, 0, 0)`;

    const panels = [
      document.getElementById('panel-ar-space'),
      document.getElementById('panel-music-space'),
      document.getElementById('panel-ielts-space')
    ];
    panels.forEach((p, idx) => {
      if (!p) return;
      p.style.transition = 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 380ms cubic-bezier(0.22, 1, 0.36, 1)';
      (p.style as any).webkitTransition = '-webkit-transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 380ms cubic-bezier(0.22, 1, 0.36, 1)';
      const isTarget = idx === targetSpace;
      p.style.transform = isTarget ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(0, 0, 0) scale(0.965)';
      (p.style as any).webkitTransform = isTarget ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(0, 0, 0) scale(0.965)';
      p.style.opacity = isTarget ? '1' : '0.72';
    });
  }, []);

  const updateCardVerticalTransform = useCallback((diffY: number) => {
    if (cardRafId.current !== null) {
      cancelAnimationFrame(cardRafId.current);
    }
    cardRafId.current = requestAnimationFrame(() => {
      const wrapper = document.getElementById('gallery-card-drag-stage');
      const titleStage = document.getElementById('gallery-title-stage');
      const quoteStage = document.getElementById('gallery-quote-stage');
      if (!wrapper) return;

      wrapper.style.transition = 'none';
      (wrapper.style as any).webkitTransition = 'none';
      // Responsive 1:1 tactile tracking with gentle progressive resistance only at extremes
      const dampedY = diffY * 0.78;
      const progress = Math.min(1, Math.abs(diffY) / 150);
      const scale = 1 - progress * 0.055;
      const opacity = 1 - progress * 0.32;
      wrapper.style.transform = `translate3d(0, ${dampedY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      (wrapper.style as any).webkitTransform = `translate3d(0, ${dampedY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      wrapper.style.opacity = opacity.toFixed(3);

      if (titleStage) {
        titleStage.style.transition = 'none';
        titleStage.style.transform = `translate3d(0, ${(dampedY * 0.35).toFixed(2)}px, 0)`;
        titleStage.style.opacity = (1 - progress * 0.55).toFixed(3);
      }
      if (quoteStage) {
        quoteStage.style.transition = 'none';
        quoteStage.style.transform = `translate3d(0, ${(dampedY * 0.35).toFixed(2)}px, 0)`;
        quoteStage.style.opacity = (1 - progress * 0.55).toFixed(3);
      }
    });
  }, []);

  const animateCardVerticalSwitch = useCallback((direction: 'up' | 'down' | null) => {
    if (cardRafId.current !== null) {
      cancelAnimationFrame(cardRafId.current);
      cardRafId.current = null;
    }
    const wrapper = document.getElementById('gallery-card-drag-stage');
    const titleStage = document.getElementById('gallery-title-stage');
    const quoteStage = document.getElementById('gallery-quote-stage');
    if (!wrapper) return;

    if (!direction) {
      // Smooth spring snapback when swipe didn't reach threshold
      const springCss = 'transform 340ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease-out';
      wrapper.style.transition = springCss;
      (wrapper.style as any).webkitTransition = springCss;
      wrapper.style.transform = 'translate3d(0, 0, 0) scale(1)';
      (wrapper.style as any).webkitTransform = 'translate3d(0, 0, 0) scale(1)';
      wrapper.style.opacity = '1';

      if (titleStage) {
        titleStage.style.transition = springCss;
        titleStage.style.transform = 'translate3d(0, 0, 0)';
        titleStage.style.opacity = '1';
      }
      if (quoteStage) {
        quoteStage.style.transition = springCss;
        quoteStage.style.transform = 'translate3d(0, 0, 0)';
        quoteStage.style.opacity = '1';
      }
      return;
    }

    // Pure compositor-thread inertial entry from incoming direction (up = next song enters from bottom +72px)
    const entryY = direction === 'up' ? 72 : -72;
    const textEntryY = direction === 'up' ? 22 : -22;

    wrapper.style.transition = 'none';
    (wrapper.style as any).webkitTransition = 'none';
    wrapper.style.transform = `translate3d(0, ${entryY}px, 0) scale(0.92)`;
    (wrapper.style as any).webkitTransform = `translate3d(0, ${entryY}px, 0) scale(0.92)`;
    wrapper.style.opacity = '0.18';

    if (titleStage) {
      titleStage.style.transition = 'none';
      titleStage.style.transform = `translate3d(0, ${textEntryY}px, 0)`;
      titleStage.style.opacity = '0';
    }
    if (quoteStage) {
      quoteStage.style.transition = 'none';
      quoteStage.style.transform = `translate3d(0, ${textEntryY}px, 0)`;
      quoteStage.style.opacity = '0';
    }

    // Flush style on compositor and immediately glide to resting state at 120fps
    void wrapper.offsetHeight;
    const enterSpring = 'transform 380ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms cubic-bezier(0.16, 1, 0.3, 1)';
    wrapper.style.transition = enterSpring;
    (wrapper.style as any).webkitTransition = enterSpring;
    wrapper.style.transform = 'translate3d(0, 0, 0) scale(1)';
    (wrapper.style as any).webkitTransform = 'translate3d(0, 0, 0) scale(1)';
    wrapper.style.opacity = '1';

    if (titleStage) {
      titleStage.style.transition = enterSpring;
      titleStage.style.transform = 'translate3d(0, 0, 0)';
      titleStage.style.opacity = '1';
    }
    if (quoteStage) {
      quoteStage.style.transition = enterSpring;
      quoteStage.style.transform = 'translate3d(0, 0, 0)';
      quoteStage.style.opacity = '1';
    }
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

    // Lock axis once user moves beyond initial deadzone (5px)
    if (!lockedAxis.current) {
      if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
        if (activeSpace === 1 && Math.abs(diffY) > Math.abs(diffX) * 1.05) {
          lockedAxis.current = 'y';
        } else if (Math.abs(diffX) >= Math.abs(diffY)) {
          lockedAxis.current = 'x';
        }
      }
    }

    if (lockedAxis.current === 'x' && enableXSwipe) {
      updateViewportTransform(diffX);
    } else if (lockedAxis.current === 'y' && enableYSwipeInMusic && activeSpace === 1) {
      updateCardVerticalTransform(diffY);
    }
  }, [activeSpace, enableXSwipe, enableYSwipeInMusic, updateViewportTransform, updateCardVerticalTransform]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const state = useAppStore.getState();
    if (isAnyModalOpen(state)) {
      lockedAxis.current = null;
      resetViewportTransition(activeSpace);
      animateCardVerticalSwitch(null);
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
      (lockedAxis.current !== 'y' && Math.abs(diffX) > Math.abs(diffY) * 1.2 && (isFastFlickX || isNormalSwipeX));

    let targetSpace = activeSpace;
    let switchedDirection: 'up' | 'down' | null = null;
    if (isHorizontalIntent && enableXSwipe) {
      if (diffX < 0 && (diffX < -45 || isFastFlickX)) {
        if (activeSpace < 2) {
          targetSpace = activeSpace + 1;
        }
      } else if (diffX > 0 && (diffX > 45 || isFastFlickX)) {
        if (activeSpace > 0) {
          targetSpace = activeSpace - 1;
        }
      }
    } else if (lockedAxis.current === 'y' && enableYSwipeInMusic && activeSpace === 1) {
      const isFastFlickY = Math.abs(velocityY) > 0.18 && Math.abs(diffY) > 16;
      if (diffY < -26 || (diffY < 0 && isFastFlickY)) {
        // Swipe Up -> Next song
        switchedDirection = 'up';
        nextSong('up');
        animateCardVerticalSwitch('up');
      } else if (diffY > 26 || (diffY > 0 && isFastFlickY)) {
        // Swipe Down -> Previous song
        switchedDirection = 'down';
        prevSong('down');
        animateCardVerticalSwitch('down');
      }
    }

    if (!switchedDirection) {
      animateCardVerticalSwitch(null);
    }
    resetViewportTransition(targetSpace);
    if (targetSpace !== activeSpace) {
      setActiveSpace(targetSpace);
    }

    lockedAxis.current = null;
  }, [activeSpace, enableXSwipe, enableYSwipeInMusic, nextSong, prevSong, resetViewportTransition, animateCardVerticalSwitch, setActiveSpace]);

  useEffect(() => {
    const el = window;

    const handleCancel = () => {
      isDragging.current = false;
      resetViewportTransition(activeSpace);
      animateCardVerticalSwitch(null);
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
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
}
