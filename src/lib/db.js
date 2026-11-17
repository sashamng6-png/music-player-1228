/**
 * Tiny IndexedDB wrapper used for user-uploaded audio blobs.
 * Metadata lives in localStorage; the actual (potentially large) audio bytes
 * live here so uploads survive a page reload without blowing the 5 MB quota.
 */
const DB_NAME = 'musicflow-audio';
const DB_VERSION = 1;
const STORE = 'files';

let dbPromise = null;
const memoryFallback = new Map();

function supportsIndexedDb() {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

function openDb() {
  if (!supportsIndexedDb()) return Promise.reject(new Error('IndexedDB недоступний'));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Помилка IndexedDB'));
    request.onblocked = () => reject(new Error('IndexedDB заблокований іншою вкладкою'));
  }).catch((error) => {
    dbPromise = null;
    throw error;
  });
  return dbPromise;
}

function withStore(mode, operation) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        let result;
        try {
          result = operation(store);
        } catch (error) {
          reject(error);
          return;
        }
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Транзакцію скасовано'));
      }),
  );
}

export async function saveAudioBlob(id, blob) {
  try {
    await withStore('readwrite', (store) => store.put(blob, id));
    return { persisted: true };
  } catch (error) {
    console.warn('[Music Player 1228] Blob збережено лише в памʼяті', error);
    memoryFallback.set(id, blob);
    return { persisted: false, error };
  }
}

export async function getAudioBlob(id) {
  if (memoryFallback.has(id)) return memoryFallback.get(id);
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[Music Player 1228] Не вдалося прочитати аудіофайл', error);
    return null;
  }
}

export async function deleteAudioBlob(id) {
  memoryFallback.delete(id);
  try {
    await withStore('readwrite', (store) => store.delete(id));
  } catch (error) {
    console.warn('[Music Player 1228] Не вдалося видалити аудіофайл', error);
  }
}

export async function clearAudioBlobs() {
  memoryFallback.clear();
  try {
    await withStore('readwrite', (store) => store.clear());
  } catch (error) {
    console.warn('[Music Player 1228] Не вдалося очистити сховище аудіо', error);
  }
}
