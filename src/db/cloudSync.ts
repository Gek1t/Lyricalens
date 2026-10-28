import { db } from './index';
import { WordItem } from '../types';

let syncTimer: any = null;
let isSyncing = false;
let lastSyncTimestamp = 0;
const pendingDeletedWords = new Set<string>();

const SYNC_TIMEOUT_MS = 6000;

export interface NetworkSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  serverDbStatus: 'connected' | 'error' | 'checking';
}

const listeners = new Set<(state: NetworkSyncState) => void>();
let currentState: NetworkSyncState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncTime: null,
  serverDbStatus: 'checking',
};

function notifyListeners() {
  listeners.forEach((fn) => fn({ ...currentState }));
}

export function subscribeNetworkSyncState(fn: (state: NetworkSyncState) => void): () => void {
  listeners.add(fn);
  fn({ ...currentState });
  return () => listeners.delete(fn);
}

// Record word deletion tombstone so server deletes it during next batch-sync
export function recordWordDeletion(word: string) {
  pendingDeletedWords.add(word.trim().toLowerCase());
  triggerDebouncedCloudSync(500);
}

// Check server health and connection status with timeout
export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error('Health check failed');
    const data = await res.json();
    const isDbConnected = data.database === 'connected';
    currentState.serverDbStatus = isDbConnected ? 'connected' : 'error';
    currentState.isOnline = true;
    notifyListeners();
    return isDbConnected;
  } catch {
    currentState.serverDbStatus = 'error';
    currentState.isOnline = false;
    notifyListeners();
    return false;
  }
}

// Perform bidirectional sync with atomic transaction & delta queries
export async function syncWordsWithServer(): Promise<boolean> {
  if (isSyncing) return false;
  isSyncing = true;
  currentState.isSyncing = true;
  notifyListeners();

  try {
    // 1. Collect all local words from Dexie
    const localWords = await db.words.toArray();
    const deletedList = Array.from(pendingDeletedWords);

    // 2. Ensure isolated tenant session token exists
    let token = localStorage.getItem('lyricalens_auth_token');
    if (!token) {
      try {
        const guestRes = await fetch('/api/auth/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(3000),
        });
        if (guestRes.ok) {
          const guestData = await guestRes.json();
          if (guestData.token) {
            token = guestData.token;
            localStorage.setItem('lyricalens_auth_token', token);
          }
        }
      } catch (err) {
        console.warn('Failed to obtain guest session token:', err);
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/words/batch-sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        clientLastSync: lastSyncTimestamp,
        localWords,
        deletedWords: deletedList,
      }),
      signal: AbortSignal.timeout(SYNC_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`Batch sync failed with status ${res.status}`);
    }

    const json = await res.json();
    if (!json.success || !Array.isArray(json.words)) {
      throw new Error(json.error || 'Invalid sync payload');
    }

    // Clear pending tombstones upon successful sync
    deletedList.forEach((w) => pendingDeletedWords.delete(w));

    // 3. Atomically update Dexie inside a single transaction with bulkPut
    const serverWords: WordItem[] = json.words;
    if (serverWords.length > 0) {
      await db.transaction('rw', db.words, async () => {
        const existingAll = await db.words.toArray();
        const existingMap = new Map(existingAll.map((w) => [w.word.toLowerCase().trim(), w]));

        const toPut: WordItem[] = [];
        for (const sw of serverWords) {
          const lower = sw.word.toLowerCase().trim();
          const localItem = existingMap.get(lower);
          toPut.push({
            ...sw,
            id: localItem?.id, // Preserve Dexie autoincrement ID
          });
        }
        await db.words.bulkPut(toPut);
      });
    }

    lastSyncTimestamp = json.serverTimestamp || Date.now();
    currentState.lastSyncTime = lastSyncTimestamp;
    currentState.isOnline = true;
    currentState.serverDbStatus = 'connected';
    return true;
  } catch (err) {
    console.warn('[CloudSync] Sync failed, maintaining local state:', err);
    currentState.serverDbStatus = 'error';
    return false;
  } finally {
    isSyncing = false;
    currentState.isSyncing = false;
    notifyListeners();
  }
}

// Debounced trigger for user mutations
export function triggerDebouncedCloudSync(delayMs = 1000) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncWordsWithServer();
  }, delayMs);
}

// Initialize online/offline event listeners
export function initCloudSyncListener() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    currentState.isOnline = true;
    notifyListeners();
    syncWordsWithServer();
  });

  window.addEventListener('offline', () => {
    currentState.isOnline = false;
    currentState.serverDbStatus = 'error';
    notifyListeners();
  });

  // Initial health check and sync on startup
  checkServerHealth().then((ok) => {
    if (ok) {
      syncWordsWithServer();
    }
  });

  // Periodic heartbeat sync every 60 seconds
  setInterval(() => {
    if (navigator.onLine) {
      syncWordsWithServer();
    }
  }, 60000);
}
