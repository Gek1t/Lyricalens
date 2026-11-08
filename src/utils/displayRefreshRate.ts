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
      nativeNetEaseQrKey?: () => string;
      nativeNetEaseQrCheck?: (key: string) => string;
      nativeQqQrKey?: () => string;
      nativeQqQrCheck?: (qrsig: string) => string;
      getDeviceRefreshRate?: () => number;
      getSafeTopDp?: () => number;
      boostFrameRate?: (durationMs: number) => void;
    };
  }
}

let currentState: RefreshRateState = {
  fps: 60,
  frameBudgetMs: 16.67,
  isHighRefresh: false,
};

// Monotonic hardware capability floor so LTPO idle dips never downgrade interactive spring timing
let maxConfirmedTier: RefreshRateTier = 60;
let lastAppliedDomTier: number = -1;
let lastAppliedSafeTopDp: number = -1;
const listeners = new Set<(state: RefreshRateState) => void>();
let isInitialized = false;
let isSampling = false;
let lastBoostTime = 0;

/**
 * Wake up native SurfaceFlinger 120Hz/144Hz keep-alive view on Android (throttled to avoid redundant JNI calls).
 */
export function triggerHighRefreshBoost(durationMs: number = 1400): void {
  if (typeof window === 'undefined') return;
  const now = performance.now();
  if (now - lastBoostTime < 350) return;
  lastBoostTime = now;
  try {
    if (typeof window.AndroidNativeMedia?.boostFrameRate === 'function') {
      window.AndroidNativeMedia.boostFrameRate(durationMs);
    }
  } catch {
    // ignore bridge call failure
  }
}

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
      if (Number.isFinite(safeTopDp) && safeTopDp > 0 && safeTopDp !== lastAppliedSafeTopDp) {
        lastAppliedSafeTopDp = safeTopDp;
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

  // Guard against redundant :root style mutations that would trigger full-document Blink Style Recalc
  if (effectiveTier === lastAppliedDomTier) {
    return;
  }
  lastAppliedDomTier = effectiveTier;

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
    const spaceDuration = effectiveTier >= 120 ? '340ms' : effectiveTier >= 90 ? '360ms' : '380ms';
    const cardDuration = effectiveTier >= 120 ? '300ms' : effectiveTier >= 90 ? '320ms' : '340ms';
    const modalDuration = effectiveTier >= 120 ? '280ms' : effectiveTier >= 90 ? '300ms' : '320ms';
    root.style.setProperty('--spring-duration-space', spaceDuration);
    root.style.setProperty('--spring-duration-card', cardDuration);
    root.style.setProperty('--spring-duration-modal', modalDuration);
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
 * Query injected window property or Android Native Bridge if running inside Capacitor Android WebView.
 */
function readNativeRefreshRate(): RefreshRateTier | null {
  if (typeof window === 'undefined') return null;

  // Prefer zero-cost injected JS global first if already confirmed at >= 120Hz
  if (typeof window.__DEVICE_REFRESH_RATE__ === 'number' && window.__DEVICE_REFRESH_RATE__ >= 115) {
    return snapToRefreshRateTier(window.__DEVICE_REFRESH_RATE__);
  }

  try {
    if (typeof window.AndroidNativeMedia?.getDeviceRefreshRate === 'function') {
      const nativeHz = window.AndroidNativeMedia.getDeviceRefreshRate();
      if (nativeHz && nativeHz >= 55) {
        if (nativeHz >= 115) {
          window.__DEVICE_REFRESH_RATE__ = nativeHz;
        }
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
 * Measure actual VSync cadence via requestAnimationFrame when running in standard browser without native bridge.
 */
export function measureVSyncRefreshRate(): void {
  if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') return;

  // Always check native bridge/global first for instant 0ms hardware truth
  const nativeTier = readNativeRefreshRate();
  if (nativeTier) {
    applyRefreshRateToDOM(nativeTier);
    // Only skip rAF probe if native bridge already confirmed 120Hz/144Hz peak capability
    if (nativeTier >= 120 && typeof window.AndroidNativeMedia?.getDeviceRefreshRate === 'function') {
      return;
    }
  }

  if (isSampling) return;
  isSampling = true;
  const deltas: number[] = [];
  let lastTime = 0;
  let frameCount = 0;
  const TARGET_SAMPLES = 24;

  const sampleStep = (now: number) => {
    if (lastTime > 0) {
      const dt = now - lastTime;
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
 * Initialize adaptive refresh rate tracking on app startup and visibility resume (never during active touch gestures).
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

    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        const resumedTier = readNativeRefreshRate();
        if (resumedTier) {
          applyRefreshRateToDOM(resumedTier);
        }
      }
    };

    document.addEventListener('visibilitychange', handleResume, { passive: true });
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
