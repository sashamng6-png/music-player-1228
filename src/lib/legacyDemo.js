/**
 * Сліди попередньої демо-бібліотеки.
 *
 * Самі демо-треки видалено, але у браузерах користувачів могли залишитися
 * плейлисти, улюблене та історія з посиланнями на них. Ці хелпери один раз
 * прибирають такі записи під час запуску застосунку.
 */
export const LEGACY_DEMO_TRACK_IDS = [
  'neon-district',
  'lofi-letters',
  'blue-hours',
  'northbound',
  'bassline-avenue',
  'jazz-and-kava',
  'golden-dust',
  'orbit',
  'dream-paths',
  'after-hours',
];

export const LEGACY_SEED_PLAYLIST_IDS = ['pl-my-mix', 'pl-deep-work'];

const DEMO_TRACK_SET = new Set(LEGACY_DEMO_TRACK_IDS);
const SEED_PLAYLIST_SET = new Set(LEGACY_SEED_PLAYLIST_IDS);

export function cleanLegacyFavorites(list) {
  if (!Array.isArray(list)) return list;
  const next = list.filter((id) => !DEMO_TRACK_SET.has(id));
  return next.length === list.length ? list : next;
}

export function cleanLegacyHistory(list) {
  if (!Array.isArray(list)) return list;
  const next = list.filter((entry) => entry && !DEMO_TRACK_SET.has(entry.trackId));
  return next.length === list.length ? list : next;
}

export function cleanLegacyPlaylists(list) {
  if (!Array.isArray(list)) return list;

  let changed = false;
  const next = [];

  list.forEach((playlist) => {
    if (!playlist || typeof playlist !== 'object') {
      changed = true;
      return;
    }
    if (SEED_PLAYLIST_SET.has(playlist.id)) {
      changed = true;
      return;
    }

    const trackIds = Array.isArray(playlist.trackIds) ? playlist.trackIds : [];
    const kept = trackIds.filter((id) => !DEMO_TRACK_SET.has(id));

    if (kept.length === trackIds.length) {
      next.push(playlist);
      return;
    }

    changed = true;
    // Плейлист складався лише з демо-треків — це тестова добірка.
    if (!kept.length) return;

    next.push({ ...playlist, trackIds: kept });
  });

  return changed ? next : list;
}
