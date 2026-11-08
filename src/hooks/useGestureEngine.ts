import { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getDisplayRefreshRateState, triggerHighRefreshBoost } from '../utils/displayRefreshRate';

interface GestureEngineOptions {
  enableXSwipe?: boolean;
  enableYSwipeInMusic?: boolean;
}

interface CachedGestureDOM {
  viewport: HTMLElement | null;
  arBackdrop: HTMLElement | null;
  arSolidCore: HTMLElement | null;
  stages: (HTMLElement | null)[];
  cardWrapper: HTMLElement | null;
  titleStage: HTMLElement | null;
  quoteStage: HTMLElement | null;
  containerWidth: number;
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

  // VSync frame-coalescing state (never cancel mid-frame on 240Hz touch sampling; always latch latest delta)
  const rafId = useRef<number | null>(null);
  const cardRafId = useRef<number | null>(null);
  const cardSwitchRafId = useRef<number | null>(null);
  const pendingDiffX = useRef(0);
  const pendingDiffY = useRef(0);

  const domCache = useRef<CachedGestureDOM>({
    viewport: null,
    arBackdrop: null,
    arSolidCore: null,
    stages: [null, null, null],
    cardWrapper: null,
    titleStage: null,
    quoteStage: null,
    containerWidth: 412,
  });

  const refreshDomCache = useCallback(() => {
    const viewport = document.getElementById('viewpager-viewport');
    const containerWidth = viewport?.parentElement?.clientWidth || window.innerWidth || 412;
    domCache.current = {
      viewport,
      arBackdrop: document.getElementById('ar-ambient-backdrop'),
      arSolidCore: document.getElementById('ar-solid-core'),
      stages: [
        document.getElementById('stage-ar-space'),
        document.getElementById('stage-music-space'),
        document.getElementById('stage-ielts-space'),
      ],
      cardWrapper: document.getElementById('gallery-card-drag-stage'),
      titleStage: document.getElementById('gallery-title-stage'),
      quoteStage: document.getElementById('gallery-quote-stage'),
      containerWidth,
    };
  }, []);

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

    // Cancel any pending double-rAF card entry animation if user touches the screen mid-flight
    if (cardSwitchRafId.current !== null) {
      cancelAnimationFrame(cardSwitchRafId.current);
      cardSwitchRafId.current = null;
    }

    // Cache DOM elements & container dimensions once at touchstart (zero layout reads during touchmove)
    refreshDomCache();
    triggerHighRefreshBoost(2200);

    const point = 'touches' in e ? e.touches[0] : e;
    startX.current = point.clientX;
    startY.current = point.clientY;
    startTime.current = performance.now();
    currentX.current = point.clientX;
    currentY.current = point.clientY;
    isDragging.current = true;
    lockedAxis.current = null;
  }, [refreshDomCache]);

  const updateViewportTransform = useCallback((diffX: number) => {
    pendingDiffX.current = diffX;
    if (rafId.current !== null) {
      // Coalesce high-frequency touchmove samples (e.g. 240Hz) into the next 90Hz/120Hz VSync tick
      return;
    }
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      if (!domCache.current.viewport) {
        refreshDomCache();
      }
      const cache = domCache.current;
      const el = cache.viewport;
      if (!el) return;

      const activeSpace = useAppStore.getState().activeSpace;
      const latestDiffX = pendingDiffX.current;
      const containerWidth = cache.containerWidth || 412;
      const dragRatio = Math.min(1, Math.abs(latestDiffX) / containerWidth);
      const dragPercent = (latestDiffX / containerWidth) * (100 / 3);
      const basePercent = -(activeSpace * 100) / 3;
      let finalPercent = basePercent + dragPercent;
      // Soft elastic rubber-band resistance at boundary edges
      if ((activeSpace === 0 && latestDiffX > 0) || (activeSpace === 2 && latestDiffX < 0)) {
        finalPercent = basePercent + dragPercent * 0.28;
      }

      const transformStr = `translate3d(${finalPercent.toFixed(4)}%, 0, 0)`;
      if (el.style.transition !== 'none') {
        el.style.transition = 'none';
        (el.style as any).webkitTransition = 'none';
      }
      el.style.transform = transformStr;
      (el.style as any).webkitTransform = transformStr;

      // Real-time wide S-curve dark camera atmosphere interpolation between AR Space (0) and Music Space (1)
      const arBackdrop = cache.arBackdrop;
      const arSolidCore = cache.arSolidCore;
      if (arBackdrop) {
        if (arBackdrop.style.transition !== 'none') {
          arBackdrop.style.transition = 'none';
          (arBackdrop.style as any).webkitTransition = 'none';
        }
        let arOpacity = activeSpace === 0 ? 1 : 0;
        if (activeSpace === 0 && latestDiffX < 0) {
          arOpacity = Math.max(0, 1 - Math.pow(dragRatio, 1.35) * 0.65);
        } else if (activeSpace === 1 && latestDiffX > 0) {
          arOpacity = Math.min(1, 0.35 + Math.pow(dragRatio, 0.75) * 0.65);
        }
        arBackdrop.style.opacity = arOpacity.toFixed(3);
      }
      if (arSolidCore) {
        if (arSolidCore.style.transition !== 'none') {
          arSolidCore.style.transition = 'none';
          (arSolidCore.style as any).webkitTransition = 'none';
        }
        let coreOpacity = activeSpace === 0 ? 1 : 0;
        if (activeSpace === 0 && latestDiffX < 0) {
          coreOpacity = Math.max(0, 1 - Math.min(1, dragRatio * 2.4));
        } else if (activeSpace === 1 && latestDiffX > 0) {
          coreOpacity = Math.max(0, (dragRatio - 0.65) / 0.35);
        }
        arSolidCore.style.opacity = coreOpacity.toFixed(3);
      }
    });
  }, [refreshDomCache]);

  const resetViewportTransition = useCallback((targetSpace: number) => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    const cache = domCache.current;
    const el = cache.viewport || document.getElementById('viewpager-viewport');
    if (!el) return;

    triggerHighRefreshBoost(1200);
    const durationCss = 'var(--spring-duration-space, 380ms)';
    const curve = 'cubic-bezier(0.22, 1, 0.36, 1)';

    el.style.transition = `transform ${durationCss} ${curve}`;
    (el.style as any).webkitTransition = `-webkit-transform ${durationCss} ${curve}`;
    el.style.transform = `translate3d(-${(targetSpace * 100) / 3}%, 0, 0)`;
    (el.style as any).webkitTransform = `translate3d(-${(targetSpace * 100) / 3}%, 0, 0)`;

    const arBackdrop = cache.arBackdrop || document.getElementById('ar-ambient-backdrop');
    if (arBackdrop) {
      arBackdrop.style.transition = `opacity ${durationCss} ${curve}`;
      (arBackdrop.style as any).webkitTransition = `opacity ${durationCss} ${curve}`;
      arBackdrop.style.opacity = targetSpace === 0 ? '1' : '0';
    }
    const arSolidCore = cache.arSolidCore || document.getElementById('ar-solid-core');
    if (arSolidCore) {
      arSolidCore.style.transition = `opacity ${durationCss} ${curve}`;
      (arSolidCore.style as any).webkitTransition = `opacity ${durationCss} ${curve}`;
      arSolidCore.style.opacity = targetSpace === 0 ? '1' : '0';
    }
  }, []);

  const updateCardVerticalTransform = useCallback((diffY: number) => {
    if (cardSwitchRafId.current !== null) {
      cancelAnimationFrame(cardSwitchRafId.current);
      cardSwitchRafId.current = null;
    }
    pendingDiffY.current = diffY;
    if (cardRafId.current !== null) {
      return;
    }
    cardRafId.current = requestAnimationFrame(() => {
      cardRafId.current = null;
      const cache = domCache.current;
      const wrapper = cache.cardWrapper || document.getElementById('gallery-card-drag-stage');
      if (!wrapper) return;
      const titleStage = cache.titleStage;
      const quoteStage = cache.quoteStage;

      // Cancel any running Web Animations API entry animations before applying finger drag transform
      wrapper.getAnimations?.().forEach(a => a.cancel());
      titleStage?.getAnimations?.().forEach(a => a.cancel());
      quoteStage?.getAnimations?.().forEach(a => a.cancel());

      const latestDiffY = pendingDiffY.current;
      if (wrapper.style.transition !== 'none') {
        wrapper.style.transition = 'none';
        (wrapper.style as any).webkitTransition = 'none';
      }
      // Pure GPU translate3d + scale without mutating wrapper opacity (avoids Group Opacity offscreen surface allocation)
      const dampedY = latestDiffY * 0.78;
      const progress = Math.min(1, Math.abs(latestDiffY) / 150);
      const scale = 1 - progress * 0.055;
      const cardTransform = `translate3d(0, ${dampedY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      wrapper.style.transform = cardTransform;
      (wrapper.style as any).webkitTransform = cardTransform;

      const textTransform = `translate3d(0, ${(dampedY * 0.35).toFixed(2)}px, 0)`;
      const textOpacity = (1 - progress * 0.55).toFixed(3);

      if (titleStage) {
        if (titleStage.style.transition !== 'none') titleStage.style.transition = 'none';
        titleStage.style.transform = textTransform;
        titleStage.style.opacity = textOpacity;
      }
      if (quoteStage) {
        if (quoteStage.style.transition !== 'none') quoteStage.style.transition = 'none';
        quoteStage.style.transform = textTransform;
        quoteStage.style.opacity = textOpacity;
      }
    });
  }, []);

  const animateCardVerticalSwitch = useCallback((direction: 'up' | 'down' | null) => {
    if (cardRafId.current !== null) {
      cancelAnimationFrame(cardRafId.current);
      cardRafId.current = null;
    }
    if (cardSwitchRafId.current !== null) {
      cancelAnimationFrame(cardSwitchRafId.current);
      cardSwitchRafId.current = null;
    }

    const cache = domCache.current;
    const wrapper = cache.cardWrapper || document.getElementById('gallery-card-drag-stage');
    const titleStage = cache.titleStage || document.getElementById('gallery-title-stage');
    const quoteStage = cache.quoteStage || document.getElementById('gallery-quote-stage');
    if (!wrapper) return;

    triggerHighRefreshBoost(1200);
    const { fps } = getDisplayRefreshRateState();
    const settleMs = fps >= 120 ? 320 : fps >= 90 ? 340 : 360;
    const fadeMs = fps >= 120 ? 220 : fps >= 90 ? 240 : 260;

    if (!direction) {
      // Smooth spring snapback when swipe didn't reach threshold
      const cardSpringCss = `transform ${settleMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      const textSpringCss = `transform ${settleMs}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${fadeMs}ms ease-out`;
      wrapper.style.transition = cardSpringCss;
      (wrapper.style as any).webkitTransition = `-webkit-transform ${settleMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      wrapper.style.transform = 'translate3d(0, 0, 0) scale(1)';
      (wrapper.style as any).webkitTransform = 'translate3d(0, 0, 0) scale(1)';

      if (titleStage) {
        titleStage.style.transition = textSpringCss;
        titleStage.style.transform = 'translate3d(0, 0, 0)';
        titleStage.style.opacity = '1';
      }
      if (quoteStage) {
        quoteStage.style.transition = textSpringCss;
        quoteStage.style.transform = 'translate3d(0, 0, 0)';
        quoteStage.style.opacity = '1';
      }
      return;
    }

    // Pure compositor-thread Web Animations API entry on Frame 0 (never swallowed by single-rAF style coalescing)
    const entryY = direction === 'up' ? 64 : -64;
    const textEntryY = direction === 'up' ? 18 : -18;

    wrapper.getAnimations?.().forEach(a => a.cancel());
    wrapper.style.transition = 'none';
    (wrapper.style as any).webkitTransition = 'none';
    wrapper.style.transform = 'translate3d(0, 0, 0) scale(1)';
    (wrapper.style as any).webkitTransform = 'translate3d(0, 0, 0) scale(1)';
    if (typeof wrapper.animate === 'function') {
      wrapper.animate(
        [
          { transform: `translate3d(0, ${entryY}px, 0) scale(0.93)` },
          { transform: 'translate3d(0, 0, 0) scale(1)' },
        ],
        {
          duration: settleMs,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }
      );
    }

    if (titleStage) {
      titleStage.getAnimations?.().forEach(a => a.cancel());
      titleStage.style.transition = 'none';
      titleStage.style.transform = 'translate3d(0, 0, 0)';
      titleStage.style.opacity = '1';
      if (typeof titleStage.animate === 'function') {
        titleStage.animate(
          [
            { transform: `translate3d(0, ${textEntryY}px, 0)`, opacity: 0 },
            { transform: 'translate3d(0, 0, 0)', opacity: 1 },
          ],
          {
            duration: settleMs,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }
        );
      }
    }
    if (quoteStage) {
      quoteStage.getAnimations?.().forEach(a => a.cancel());
      quoteStage.style.transition = 'none';
      quoteStage.style.transform = 'translate3d(0, 0, 0)';
      quoteStage.style.opacity = '1';
      if (typeof quoteStage.animate === 'function') {
        quoteStage.animate(
          [
            { transform: `translate3d(0, ${textEntryY}px, 0)`, opacity: 0 },
            { transform: 'translate3d(0, 0, 0)', opacity: 1 },
          ],
          {
            duration: settleMs,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }
        );
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!isDragging.current) return;

    const state = useAppStore.getState();
    const activeSpace = state.activeSpace;
    if (isAnyModalOpen(state)) {
      isDragging.current = false;
      lockedAxis.current = null;
      resetViewportTransition(activeSpace);
      animateCardVerticalSwitch(null);
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
  }, [enableXSwipe, enableYSwipeInMusic, updateViewportTransform, updateCardVerticalTransform, resetViewportTransition, animateCardVerticalSwitch]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const state = useAppStore.getState();
    const activeSpace = state.activeSpace;
    if (isAnyModalOpen(state)) {
      if (lockedAxis.current === 'x') {
        resetViewportTransition(activeSpace);
      } else if (lockedAxis.current === 'y') {
        animateCardVerticalSwitch(null);
      }
      lockedAxis.current = null;
      return;
    }

    const diffX = currentX.current - startX.current;
    const diffY = currentY.current - startY.current;
    const duration = Math.max(1, performance.now() - startTime.current);
    const velocityX = diffX / duration; // px per ms
    const velocityY = diffY / duration;
    const totalDistance = Math.hypot(diffX, diffY);

    // Pure tap without axis lock: skip any style mutation or spring reset on #viewport / #gallery-card-drag-stage
    if (!lockedAxis.current && totalDistance <= 6) {
      return;
    }

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
      resetViewportTransition(targetSpace);
      if (targetSpace !== activeSpace) {
        setActiveSpace(targetSpace);
      }
    } else if (lockedAxis.current === 'y' && enableYSwipeInMusic && activeSpace === 1) {
      const isFastFlickY = Math.abs(velocityY) > 0.18 && Math.abs(diffY) > 16;
      if (diffY < -26 || (diffY < 0 && isFastFlickY)) {
        // Swipe Up -> Next song
        nextSong('up');
        animateCardVerticalSwitch('up');
      } else if (diffY > 26 || (diffY > 0 && isFastFlickY)) {
        // Swipe Down -> Previous song
        prevSong('down');
        animateCardVerticalSwitch('down');
      } else {
        animateCardVerticalSwitch(null);
      }
    }

    lockedAxis.current = null;
  }, [enableXSwipe, enableYSwipeInMusic, nextSong, prevSong, resetViewportTransition, animateCardVerticalSwitch, setActiveSpace]);

  useEffect(() => {
    const el = window;
    const docEl = document.documentElement;

    const handleCancel = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      resetViewportTransition(useAppStore.getState().activeSpace);
      animateCardVerticalSwitch(null);
      lockedAxis.current = null;
    };

    const handleResize = () => {
      refreshDomCache();
    };

    // Use capture phase so no nested element's stopPropagation can block gesture detection
    el.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true, capture: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true, capture: true });
    el.addEventListener('touchcancel', handleCancel, { passive: true, capture: true });
    el.addEventListener('resize', handleResize, { passive: true });

    // Mouse events for desktop testability (mouseleave bound on documentElement without capture so child element exits don't cancel active animations)
    el.addEventListener('mousedown', handleTouchStart, true);
    el.addEventListener('mousemove', handleTouchMove, true);
    el.addEventListener('mouseup', handleTouchEnd, true);
    docEl.addEventListener('mouseleave', handleCancel, false);

    // Suppress click events immediately following a drag/swipe
    const handleCaptureClick = (e: MouseEvent) => {
      if (Date.now() < suppressClickUntil.current) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    window.addEventListener('click', handleCaptureClick, true);

    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      if (cardRafId.current !== null) cancelAnimationFrame(cardRafId.current);
      if (cardSwitchRafId.current !== null) cancelAnimationFrame(cardSwitchRafId.current);
      el.removeEventListener('touchstart', handleTouchStart, { capture: true });
      el.removeEventListener('touchmove', handleTouchMove, { capture: true });
      el.removeEventListener('touchend', handleTouchEnd, { capture: true });
      el.removeEventListener('touchcancel', handleCancel, { capture: true });
      el.removeEventListener('resize', handleResize);
      el.removeEventListener('mousedown', handleTouchStart, true);
      el.removeEventListener('mousemove', handleTouchMove, true);
      el.removeEventListener('mouseup', handleTouchEnd, true);
      docEl.removeEventListener('mouseleave', handleCancel, false);
      window.removeEventListener('click', handleCaptureClick, true);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, refreshDomCache, resetViewportTransition, animateCardVerticalSwitch]);
}
