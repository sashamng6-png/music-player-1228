import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';
import {
  COMMUNITY_BUCKETS,
  fileExtension,
  friendlyDataError,
  isSupabaseConfigured,
  removeStorageFiles,
  supabase,
  uploadFileWithProgress,
  validateAudioFile,
  validateCoverFile,
} from '../lib/supabase';
import { createLocalCover } from '../lib/utils';

const CommunityContext = createContext(null);

export const COMMUNITY_ID_PREFIX = 'community-';
export const COMMUNITY_ALBUM = 'Спільнота Music Player 1228';
export const COMMUNITY_GENRES = [
  'Synthwave',
  'Lo-Fi',
  'Ambient',
  'Cinematic',
  'Deep House',
  'Jazz',
  'Chillout',
  'Electronic',
  'Piano',
  'Hip-Hop',
  'Rock',
  'Pop',
  'Класика',
  'Фолк',
  'Інше',
];

const TRACK_SELECT = `
  id,
  user_id,
  title,
  artist,
  description,
  genre,
  audio_url,
  cover_url,
  duration,
  published,
  created_at,
  updated_at,
  author:profiles!tracks_user_id_fkey (id, username, avatar_url, created_at)
`;

const PROFILE_SELECT = 'id, username, avatar_url, created_at, updated_at';

/** Convert a Supabase row into the shape the player already understands. */
export function mapCommunityTrack(row) {
  if (!row) return null;
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  const safeTitle = row.title || 'Без назви';
  const safeArtist = row.artist || 'Невідомий виконавець';
  return {
    id: `${COMMUNITY_ID_PREFIX}${row.id}`,
    remoteId: row.id,
    userId: row.user_id,
    authorId: row.user_id,
    authorName: author?.username || safeArtist,
    authorAvatar: author?.avatar_url || null,
    title: safeTitle,
    artist: safeArtist,
    album: COMMUNITY_ALBUM,
    genre: row.genre || 'Інше',
    description: row.description || '',
    duration: Number(row.duration) || 0,
    src: row.audio_url,
    cover: row.cover_url || createLocalCover(safeTitle, safeArtist),
    addedAt: row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isCommunity: true,
  };
}

const bytesLabel = (bytes) => {
  if (!bytes) return '0 МБ';
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

const uploadPath = (userId, file) => {
  const ext = fileExtension(file?.name) || 'bin';
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${userId}/${random}.${ext}`;
};

function safeProgress(callback, value) {
  if (typeof callback !== 'function') return;
  callback(Math.max(0, Math.min(1, value)));
}

export function CommunityProvider({ children }) {
  const { user, isAdmin } = useAuth();
  const { setCommunityTracks, currentTrackId, stopPlayback } = useApp();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState(null);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [profiles, setProfiles] = useState({});
  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!supabase) {
      setLoading(false);
      setRows([]);
      setError(null);
      return [];
    }
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    if (!silent) setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('tracks')
      .select(TRACK_SELECT)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(500);

    if (!mountedRef.current || requestRef.current !== requestId) return [];

    if (queryError) {
      const message = friendlyDataError(queryError, 'Не вдалося завантажити спільноту.');
      setError(message);
      setLoading(false);
      return [];
    }

    const nextRows = data || [];
    setRows(nextRows);
    setProfiles((prev) => {
      const next = { ...prev };
      nextRows.forEach((row) => {
        const author = Array.isArray(row.author) ? row.author[0] : row.author;
        if (author?.id) next[author.id] = author;
      });
      return next;
    });
    setLastLoadedAt(Date.now());
    setLoading(false);
    return nextRows;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    refresh();
  }, [refresh]);

  /* Feed the player without polluting the local "Моя музика" list. */
  useEffect(() => {
    setCommunityTracks(rows.map(mapCommunityTrack).filter(Boolean));
  }, [rows, setCommunityTracks]);

  const requireUser = useCallback(() => {
    if (!supabase) {
      throw new Error(
        'Supabase не налаштовано. Додайте VITE_SUPABASE_URL і VITE_SUPABASE_ANON_KEY у файл .env.',
      );
    }
    if (!user) throw new Error('Потрібно увійти в акаунт, щоб публікувати музику.');
    return user;
  }, [user]);

  const findRow = useCallback(
    (remoteId) => rows.find((row) => String(row.id) === String(remoteId)) || null,
    [rows],
  );

  const createTrack = useCallback(
    async (values, onProgress) => {
      const account = requireUser();
      const audioError = validateAudioFile(values.audioFile);
      if (audioError) throw new Error(audioError);
      const coverError = validateCoverFile(values.coverFile);
      if (coverError) throw new Error(coverError);

      safeProgress(onProgress, 0.02);

      const audioFile = values.audioFile;
      const audioPath = uploadPath(account.id, audioFile);
      const audio = await uploadFileWithProgress(
        COMMUNITY_BUCKETS.audio,
        audioPath,
        audioFile,
        (progress) => safeProgress(onProgress, progress * 0.8),
      );

      let coverUrl = null;
      if (values.coverFile) {
        safeProgress(onProgress, 0.84);
        const coverPath = uploadPath(account.id, values.coverFile);
        try {
          const cover = await uploadFileWithProgress(
            COMMUNITY_BUCKETS.covers,
            coverPath,
            values.coverFile,
            (progress) => safeProgress(onProgress, 0.84 + progress * 0.12),
          );
          coverUrl = cover.publicUrl;
        } catch (coverError) {
          await removeStorageFiles(COMMUNITY_BUCKETS.audio, [audio.publicUrl]).catch(() => {});
          throw coverError;
        }
      }

      safeProgress(onProgress, 0.97);

      const payload = {
        user_id: account.id,
        title: values.title.trim().slice(0, 120),
        artist: values.artist.trim().slice(0, 120),
        description: (values.description || '').trim().slice(0, 1000) || null,
        genre: (values.genre || 'Інше').trim().slice(0, 60),
        audio_url: audio.publicUrl,
        cover_url: coverUrl,
        duration: Number.isFinite(values.duration) ? Number(values.duration) : null,
        published: true,
      };

      const { data, error: insertError } = await supabase
        .from('tracks')
        .insert(payload)
        .select(TRACK_SELECT)
        .single();

      if (insertError) {
        // Do not leave orphaned files behind if the row could not be created.
        await removeStorageFiles(COMMUNITY_BUCKETS.audio, [audio.publicUrl]).catch(() => {});
        if (coverUrl) {
          await removeStorageFiles(COMMUNITY_BUCKETS.covers, [coverUrl]).catch(() => {});
        }
        throw new Error(friendlyDataError(insertError, 'Не вдалося зберегти трек у базі.'));
      }

      safeProgress(onProgress, 1);
      setRows((prev) => [data, ...prev.filter((row) => row.id !== data.id)]);
      return mapCommunityTrack(data);
    },
    [requireUser],
  );

  const updateTrack = useCallback(
    async (remoteId, values, onProgress) => {
      const account = requireUser();
      const current = findRow(remoteId);
      if (!current) throw new Error('Трек не знайдено. Оновіть сторінку.');
      if (String(current.user_id) !== String(account.id)) {
        throw new Error('Ви можете редагувати лише власні треки.');
      }

      const audioError = validateAudioFile(values.audioFile);
      if (values.audioFile && audioError) throw new Error(audioError);
      const coverError = validateCoverFile(values.coverFile);
      if (coverError) throw new Error(coverError);

      safeProgress(onProgress, 0.03);

      const patch = {
        title: (values.title || current.title).trim().slice(0, 120),
        artist: (values.artist || current.artist).trim().slice(0, 120),
        description:
          values.description !== undefined
            ? (values.description || '').trim().slice(0, 1000) || null
            : current.description,
        genre: (values.genre || current.genre || 'Інше').trim().slice(0, 60),
        updated_at: new Date().toISOString(),
      };
      if (values.duration !== undefined && Number.isFinite(values.duration)) {
        patch.duration = Number(values.duration);
      }

      let newAudioUrl = null;
      let newCoverUrl = null;

      if (values.audioFile) {
        const path = uploadPath(account.id, values.audioFile);
        const uploaded = await uploadFileWithProgress(
          COMMUNITY_BUCKETS.audio,
          path,
          values.audioFile,
          (progress) => safeProgress(onProgress, 0.05 + progress * 0.6),
        );
        newAudioUrl = uploaded.publicUrl;
        patch.audio_url = newAudioUrl;
      }

      if (values.coverFile) {
        safeProgress(onProgress, 0.7);
        const path = uploadPath(account.id, values.coverFile);
        try {
          const uploaded = await uploadFileWithProgress(
            COMMUNITY_BUCKETS.covers,
            path,
            values.coverFile,
            (progress) => safeProgress(onProgress, 0.7 + progress * 0.22),
          );
          newCoverUrl = uploaded.publicUrl;
          patch.cover_url = newCoverUrl;
        } catch (coverError) {
          if (newAudioUrl) {
            await removeStorageFiles(COMMUNITY_BUCKETS.audio, [newAudioUrl]).catch(() => {});
          }
          throw coverError;
        }
      } else if (values.removeCover) {
        patch.cover_url = null;
      }

      safeProgress(onProgress, 0.95);

      const { data, error: updateError } = await supabase
        .from('tracks')
        .update(patch)
        .eq('id', remoteId)
        .eq('user_id', account.id)
        .select(TRACK_SELECT)
        .single();

      if (updateError) {
        if (newAudioUrl) {
          await removeStorageFiles(COMMUNITY_BUCKETS.audio, [newAudioUrl]).catch(() => {});
        }
        if (newCoverUrl) {
          await removeStorageFiles(COMMUNITY_BUCKETS.covers, [newCoverUrl]).catch(() => {});
        }
        throw new Error(friendlyDataError(updateError, 'Не вдалося оновити трек.'));
      }

      // Clean up replaced files only after the database row points to the new ones.
      if (newAudioUrl && current.audio_url) {
        await removeStorageFiles(COMMUNITY_BUCKETS.audio, [current.audio_url]).catch(() => {});
      }
      if (newCoverUrl && current.cover_url) {
        await removeStorageFiles(COMMUNITY_BUCKETS.covers, [current.cover_url]).catch(() => {});
      }
      if (values.removeCover && current.cover_url) {
        await removeStorageFiles(COMMUNITY_BUCKETS.covers, [current.cover_url]).catch(() => {});
      }

      safeProgress(onProgress, 1);
      setRows((prev) => prev.map((row) => (row.id === data.id ? data : row)));
      return mapCommunityTrack(data);
    },
    [findRow, requireUser],
  );

  const deleteTrack = useCallback(
    async (trackOrId) => {
      const account = requireUser();
      const remoteId =
        typeof trackOrId === 'string'
          ? trackOrId.replace(COMMUNITY_ID_PREFIX, '')
          : trackOrId?.remoteId || trackOrId?.id;
      const current = findRow(remoteId);
      if (!current) throw new Error('Трек не знайдено. Оновіть сторінку.');
      const isOwner = String(current.user_id) === String(account.id);
      if (!isOwner && !isAdmin) {
        throw new Error('Ви можете видаляти лише власні треки.');
      }

      let deleteQuery = supabase.from('tracks').delete().eq('id', remoteId);
      // Модератор видаляє будь-який трек, власник — лише свій.
      if (!isAdmin) deleteQuery = deleteQuery.eq('user_id', account.id);

      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        throw new Error(friendlyDataError(deleteError, 'Не вдалося видалити трек.'));
      }

      if (currentTrackId === `${COMMUNITY_ID_PREFIX}${remoteId}`) {
        stopPlayback(true);
      }

      // The row is gone; storage cleanup is best effort.
      const cleanup = [];
      if (current.audio_url) cleanup.push(removeStorageFiles(COMMUNITY_BUCKETS.audio, [current.audio_url]));
      if (current.cover_url) cleanup.push(removeStorageFiles(COMMUNITY_BUCKETS.covers, [current.cover_url]));
      Promise.allSettled(cleanup).then((results) => {
        const failed = results.filter((item) => item.status === 'rejected');
        if (failed.length) {
          console.warn('[Music Player 1228] Не вдалося видалити файли зі Storage', failed);
        }
      });

      setRows((prev) => prev.filter((row) => row.id !== remoteId));
      return true;
    },
    [currentTrackId, findRow, isAdmin, requireUser, stopPlayback],
  );

  const loadProfile = useCallback(
    async (userId, { force = false } = {}) => {
      if (!userId) return null;
      if (!force && profiles[userId]) return profiles[userId];
      if (!supabase) return null;

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn('[Music Player 1228] Не вдалося завантажити профіль', profileError);
        return null;
      }
      if (data) {
        setProfiles((prev) => ({ ...prev, [data.id]: data }));
      }
      return data;
    },
    [profiles],
  );

  const communityTracks = useMemo(
    () => rows.map(mapCommunityTrack).filter(Boolean),
    [rows],
  );

  const myRows = useMemo(
    () => (user?.id ? rows.filter((row) => String(row.user_id) === String(user.id)) : []),
    [rows, user?.id],
  );

  const genreOptions = useMemo(() => {
    const used = rows.map((row) => row.genre).filter(Boolean);
    const merged = [...COMMUNITY_GENRES];
    used.forEach((genre) => {
      if (!merged.includes(genre)) merged.push(genre);
    });
    return merged;
  }, [rows]);

  const value = useMemo(
    () => ({
      configured: isSupabaseConfigured,
      tracks: communityTracks,
      rows,
      loading,
      error,
      lastLoadedAt,
      profiles,
      myRows,
      myTracks: myRows.map(mapCommunityTrack).filter(Boolean),
      genreOptions,
      refresh,
      createTrack,
      updateTrack,
      deleteTrack,
      loadProfile,
      maxAudioLabel: bytesLabel(25 * 1024 * 1024),
      maxCoverLabel: bytesLabel(5 * 1024 * 1024),
    }),
    [
      communityTracks,
      rows,
      loading,
      error,
      lastLoadedAt,
      profiles,
      myRows,
      genreOptions,
      refresh,
      createTrack,
      updateTrack,
      deleteTrack,
      loadProfile,
    ],
  );

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (!context) throw new Error('useCommunity must be used within CommunityProvider');
  return context;
}
