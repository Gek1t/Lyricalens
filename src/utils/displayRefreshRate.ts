// Adaptive Display Refresh Rate Detector & VSync Frame Budget Engine (60Hz / 90Hz / 120Hz / 144Hz)

export type RefreshRateTier = 60 | 90 | 120 | 144;

interface RefreshRateState {
  fps: RefreshRateTier;
  frameBudgetMs: number;
  isHighRefresh: boolean;
}

declare global {
  interface Window {
    __DEVICE_REFRESH_RATE__?: number;
    AndroidNativeMedia?: {
      openAppScheme?: (url: string) => boolean;
      launchApp?: (url: string) => boolean;
      saveImageToGallery?: (base64: string, filename: string) => boolean;
      getCookiesForUrl?: (url: string) => string;
      getDeviceRefreshRate?: () => number;
      getSafeTopDp?: () => number;
    };
  }
}

let currentState: RefreshRateState = {
  fps: 60,
  frameBudgetMs: 16.67,
  isHighRefresh: false,
};

// Monotonic hardware capability floor so LTPO idle dips (1Hz-60Hz when static) never downgrade interactive spring timing
let maxConfirmedTier: RefreshRateTier = 60;
const listeners = new Set<(state: RefreshRateState) => void>();
let isInitialized = false;
let isSampling = false;
let lastTouchProbeTime = 0;

/**
 * Snap raw measured or reported refresh rate (e.g., 59.9, 89.8, 119.9, 143.9) to standard mobile hardware tiers.
 */
export function snapToRefreshRateTier(rawHz: number): RefreshRateTier {
  if (!Number.isFinite(rawHz) || rawHz <= 0) return 60;
  if (rawHz >= 132) return 144;
  if (rawHz >= 105) return 120;
  if (rawHz >= 75) return 90;
  return 60;
}

function syncNativeSafeTopInset(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !document.documentElement) return;
  try {
    if (typeof window.AndroidNativeMedia?.getSafeTopDp === 'function') {
      const safeTopDp = window.AndroidNativeMedia.getSafeTopDp();
      if (Number.isFinite(safeTopDp) && safeTopDp > 0) {
        document.documentElement.style.setProperty('--android-safe-top', `${safeTopDp}px`);
      }
    }
  } catch {
    // ignore bridge call failure
  }
}

function applyRefreshRateToDOM(tier: RefreshRateTier): void {
  const effectiveTier = Math.max(tier, maxConfirmedTier) as RefreshRateTier;
  maxConfirmedTier = effectiveTier;

  const budget = Number((1000 / effectiveTier).toFixed(2));
  const isHigh = effectiveTier >= 90;

  currentState = {
    fps: effectiveTier,
    frameBudgetMs: budget,
    isHighRefresh: isHigh,
  };

  if (typeof document !== 'undefined' && document.documentElement) {
    const root = document.documentElement;
    root.style.setProperty('--device-fps', String(effectiveTier));
    root.style.setProperty('--frame-budget-ms', `${budget}ms`);
    // High-refresh screens (90Hz/120Hz) resolve sub-pixel motion faster; calibrate spring settle durations
    const spaceDuration = effectiveTier >= 120 ? '360ms' : effectiveTier >= 90 ? '380ms' : '400ms';
    const cardDuration = effectiveTier >= 120 ? '320ms' : effectiveTier >= 90 ? '340ms' : '360ms';
    root.style.setProperty('--spring-duration-space', spaceDuration);
    root.style.setProperty('--spring-duration-card', cardDuration);
    root.dataset.refreshRate = String(effectiveTier);
  }

  listeners.forEach((listener) => {
    try {
      listener(currentState);
    } catch {
      // ignore listener errors
    }
  });
}

/**
 * Query Android Native Bridge or injected window property if running inside Capacitor Android WebView.
 */
function readNativeRefreshRate(): RefreshRateTier | null {
  if (typeof window === 'undefined') return null;

  try {
    if (typeof window.AndroidNativeMedia?.getDeviceRefreshRate === 'function') {
      const nativeHz = window.AndroidNativeMedia.getDeviceRefreshRate();
      if (nativeHz && nativeHz >= 55) {
        return snapToRefreshRateTier(nativeHz);
      }
    }
  } catch {
    // ignore bridge call failure
  }

  if (typeof window.__DEVICE_REFRESH_RATE__ === 'number' && window.__DEVICE_REFRESH_RATE__ >= 55) {
    return snapToRefreshRateTier(window.__DEVICE_REFRESH_RATE__);
  }

  return null;
}

/**
 * Measure actual VSync cadence via requestAnimationFrame P15-P25 shortest stable delta cluster over 28 frames.
 * Accurately distinguishes 60Hz (16.67ms), 90Hz (11.11ms), 120Hz (8.33ms), and 144Hz (6.94ms) even during main-thread hydration.
 */
export function measureVSyncRefreshRate(): void {
  if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') return;
  syncNativeSafeTopInset();
  if (isSampling) return;

  // Always check native bridge first for instant 0ms hardware truth
  const nativeTier = readNativeRefreshRate();
  if (nativeTier && nativeTier > 60) {
    applyRefreshRateToDOM(nativeTier);
  }

  isSampling = true;
  const deltas: number[] = [];
  let lastTime = 0;
  let frameCount = 0;
  const TARGET_SAMPLES = 28;

  const sampleStep = (now: number) => {
    if (lastTime > 0) {
      const dt = now - lastTime;
      // Filter out sub-VSync micro-callbacks (< 5.2ms) and background tab pauses / GC spikes (> 35.0ms)
      if (dt >= 5.2 && dt <= 35.0) {
        deltas.push(dt);
      }
    }
    lastTime = now;
    frameCount += 1;

    if (frameCount <= TARGET_SAMPLES) {
      requestAnimationFrame(sampleStep);
      return;
    }

    isSampling = false;
    if (deltas.length >= 8) {
      // Sort deltas ascending and average the P15-P25 cluster (shortest stable VSync intervals)
      // to capture true hardware refresh capability without skew from single-frame JS/GC stalls
      deltas.sort((a, b) => a - b);
      const startIdx = Math.max(0, Math.floor(deltas.length * 0.15));
      const endIdx = Math.max(startIdx + 1, Math.ceil(deltas.length * 0.28));
      const cluster = deltas.slice(startIdx, endIdx);
      const avgShortestDelta = cluster.reduce((sum, v) => sum + v, 0) / cluster.length;
      const measuredHz = 1000 / avgShortestDelta;
      const measuredTier = snapToRefreshRateTier(measuredHz);
      const currentNative = readNativeRefreshRate();
      const finalTier = currentNative ? (Math.max(currentNative, measuredTier) as RefreshRateTier) : measuredTier;
      applyRefreshRateToDOM(finalTier);
    }
  };

  requestAnimationFrame(sampleStep);
}

/**
 * Initialize adaptive refresh rate tracking on app startup, post-hydration, touch boost (LTPO), and visibility resume.
 */
export function initDisplayRefreshRateAdapter(): RefreshRateState {
  if (typeof window === 'undefined') return currentState;

  syncNativeSafeTopInset();
  const initialNative = readNativeRefreshRate();
  if (initialNative) {
    applyRefreshRateToDOM(initialNative);
  } else {
    applyRefreshRateToDOM(60);
  }

  if (!isInitialized) {
    isInitialized = true;
    measureVSyncRefreshRate();

    // Post-hydration re-verification once initial IndexedDB/Dexie & React mount work has settled
    window.setTimeout(() => {
      measureVSyncRefreshRate();
    }, 1200);

    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        measureVSyncRefreshRate();
      }
    };

    // LTPO panels often idle at 60Hz until touched; probe on active touch interaction
    const handleTouchBoostProbe = () => {
      const now = performance.now();
      const cooldown = maxConfirmedTier >= 120 ? 60000 : 12000;
      if (now - lastTouchProbeTime >= cooldown) {
        lastTouchProbeTime = now;
        measureVSyncRefreshRate();
      }
    };

    window.addEventListener('focus', measureVSyncRefreshRate, { passive: true });
    document.addEventListener('visibilitychange', handleResume, { passive: true });
    window.addEventListener('touchstart', handleTouchBoostProbe, { passive: true, capture: true });
    window.addEventListener('pointerdown', handleTouchBoostProbe, { passive: true, capture: true });
  }

  return currentState;
}

export function getDisplayRefreshRateState(): RefreshRateState {
  return currentState;
}

export function subscribeDisplayRefreshRate(listener: (state: RefreshRateState) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
