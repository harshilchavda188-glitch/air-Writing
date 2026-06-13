import type { Stroke, HistoryEntry } from '../types/mediapipe';
import { useDrawingStore } from '../store/drawingStore';

const DB_NAME = 'airdrawing_db';
const DB_VERSION = 1;
const STORE_NAME = 'artwork';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveToIndexedDB(strokes: Stroke[], undoStack: HistoryEntry[], redoStack: HistoryEntry[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ strokes, undoStack, redoStack, savedAt: Date.now() }, 'current');
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB unavailable
  }
}

export async function loadFromIndexedDB(): Promise<{ strokes: Stroke[]; undoStack: HistoryEntry[]; redoStack: HistoryEntry[] } | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get('current');
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

const AUTOSAVE_INTERVAL = 30000;
let autoSaveTimer: ReturnType<typeof setInterval> | null = null;

export function startAutoSave(): void {
  if (autoSaveTimer) return;
  autoSaveTimer = setInterval(() => {
    const s = useDrawingStore.getState();
    if (s.strokes.length > 0) {
      saveToIndexedDB(s.strokes, s.undoStack, s.redoStack);
    }
  }, AUTOSAVE_INTERVAL);
}

export function stopAutoSave(): void {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
}

export async function restoreAutoSave(): Promise<void> {
  const data = await loadFromIndexedDB();
  if (data && data.strokes.length > 0) {
    useDrawingStore.getState().restore(data);
  }
}
