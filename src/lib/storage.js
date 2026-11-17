import { useEffect, useState } from 'react';

export const STORAGE_KEYS = {
  settings: 'musicflow.settings.v1',
  favorites: 'musicflow.favorites.v1',
  playlists: 'musicflow.playlists.v1',
  history: 'musicflow.history.v1',
  localTracks: 'musicflow.local-tracks.v1',
};

export function readStored(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === undefined || parsed === null ? fallback : parsed;
  } catch (error) {
    console.warn(`[MusicFlow] Не вдалося прочитати ${key}`, error);
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[MusicFlow] Не вдалося зберегти ${key}`, error);
    return false;
  }
}

export function removeStored(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[MusicFlow] Не вдалося видалити ${key}`, error);
  }
}

/**
 * useState + localStorage. `merge` lets object settings receive new defaults
 * after an app update without wiping a returning user's choices.
 */
export function usePersistentState(key, fallback, merge) {
  const [state, setState] = useState(() => {
    const stored = readStored(key, undefined);
    if (stored === undefined) return fallback;
    if (merge && stored && typeof stored === 'object' && !Array.isArray(stored)) {
      return merge(fallback, stored);
    }
    return stored;
  });

  useEffect(() => {
    writeStored(key, state);
  }, [key, state]);

  return [state, setState];
}
