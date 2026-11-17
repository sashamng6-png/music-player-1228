import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CURATED_PLAYLISTS,
  DEFAULT_SETTINGS,
  DEMO_TRACKS,
  SEED_PLAYLISTS,
} from '../data/library';
import {
  STORAGE_KEYS,
  readStored,
  usePersistentState,
} from '../lib/storage';
import {
  clearAudioBlobs,
  deleteAudioBlob,
  getAudioBlob,
  saveAudioBlob,
} from '../lib/db';
import {
  assetUrl,
  clamp,
  createLocalCover,
  downloadJson,
  isAudioFile,
  parseTrackFilename,
  pluralTracks,
  readAudioDuration,
  shuffleArray,
  uid,
} from '../lib/utils';

const AppContext = createContext(null);

const mergeSettings = (defaults, stored) => ({ ...defaults, ...stored });

const PLAYBACK_ERROR_FALLBACK =
  'Не вдалося відтворити трек. Файл недоступний або пошкоджений.';

export function AppProvider({ children }) {
  /* ---------------------------------------------------------------- */
  /* persisted data                                                    */
  /* ---------------------------------------------------------------- */
  const [settings, setSettings] = usePersistentState(
    STORAGE_KEYS.settings,
    DEFAULT_SETTINGS,
    mergeSettings,
  );
  const [favorites, setFavorites] = usePersistentState(STORAGE_KEYS.favorites, []);
  const [playlists, setPlaylists] = usePersistentState(
    STORAGE_KEYS.playlists,
    SEED_PLAYLISTS,
  );
  const [history, setHistory] = usePersistentState(STORAGE_KEYS.history, []);
  const [localMeta, setLocalMeta] = usePersistentState(STORAGE_KEYS.localTracks, []);
  const [localTracks, setLocalTracks] = useState([]);
  const [communityTracks, setCommunityTracks] = useState([]);
  const [libraryReady, setLibraryReady] = useState(false);

  /* ---------------------------------------------------------------- */
  /* ui state                                                          */
  /* ---------------------------------------------------------------- */
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addTarget, setAddTarget] = useState(null);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ---------------------------------------------------------------- */
  /* player state                                                      */
  /* ---------------------------------------------------------------- */
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const objectUrlsRef = useRef(new Set());
  const initialLocalMetaRef = useRef(localMeta);
  const handlersRef = useRef({ ended: () => {}, error: () => {} });
  const stateRef = useRef({});

  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [queue, setQueue] = useState([]);
  const [playIntent, setPlayIntent] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() =>
    clamp(Number(settings.defaultVolume) || 0.8, 0, 1),
  );
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState([]);
  const [repeat, setRepeat] = useState('off');
  const [playbackError, setPlaybackError] = useState(null);

  /* ---------------------------------------------------------------- */
  /* library                                                           */
  /* ---------------------------------------------------------------- */
  const demoTracks = useMemo(
    () =>
      DEMO_TRACKS.map((track) => ({
        ...track,
        src: assetUrl(track.src),
        cover: assetUrl(track.cover),
      })),
    [],
  );

  const allTracks = useMemo(() => [...localTracks, ...demoTracks], [localTracks, demoTracks]);
  /* Community uploads are playable but never mixed into "Моя музика". */
  const playableTracks = useMemo(
    () => [...communityTracks, ...allTracks],
    [communityTracks, allTracks],
  );
  const trackMap = useMemo(
    () => new Map(playableTracks.map((track) => [track.id, track])),
    [playableTracks],
  );

  const favoriteTracks = useMemo(
    () => favorites.map((id) => trackMap.get(id)).filter(Boolean),
    [favorites, trackMap],
  );

  const historyEntries = useMemo(
    () =>
      history
        .map((entry) => ({ ...entry, track: trackMap.get(entry.trackId) }))
        .filter((entry) => Boolean(entry.track)),
    [history, trackMap],
  );

  const queueTracks = useMemo(
    () => queue.map((id) => trackMap.get(id)).filter(Boolean),
    [queue, trackMap],
  );

  const currentTrack = currentTrackId ? trackMap.get(currentTrackId) || null : null;

  const userPlaylistById = useCallback(
    (id) => playlists.find((playlist) => playlist.id === id) || null,
    [playlists],
  );

  const getPlaylistById = useCallback(
    (id) => playlists.find((playlist) => playlist.id === id) || CURATED_PLAYLISTS.find((playlist) => playlist.id === id) || null,
    [playlists],
  );

  /* keep a fresh snapshot for audio event handlers / async code */
  stateRef.current = {
    currentTrackId,
    queue,
    playIntent,
    isPlaying,
    shuffle,
    shuffleOrder,
    repeat,
    volume,
    muted,
    favorites,
    localTracks,
    settings,
    repeatSetting: settings.autoplayNext,
    currentTrack,
    trackMap,
    playbackError,
  };

  /* ---------------------------------------------------------------- */
  /* toasts                                                            */
  /* ---------------------------------------------------------------- */
  const toastTimers = useRef(new Map());

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (message, type = 'info') => {
      const id = uid('toast');
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
        toastTimers.current.delete(id);
      }, 4600);
      toastTimers.current.set(id, timer);
    },
    [],
  );

  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /* theme + appearance                                                */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme === 'light' ? 'light' : 'dark';
    root.dataset.accent = settings.accent || 'teal';
    root.dataset.motion = settings.reduceMotion ? 'reduced' : 'full';
    root.dataset.playerSize = settings.playerSize === 'compact' ? 'compact' : 'comfortable';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', settings.theme === 'light' ? '#f3f5f9' : '#07080c');
  }, [settings]);

  /* ---------------------------------------------------------------- */
  /* restore uploaded audio from IndexedDB                             */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    const toHydrate = initialLocalMetaRef.current;
    (async () => {
      if (!toHydrate.length) {
        setLibraryReady(true);
        return;
      }
      const restored = [];
      for (const meta of toHydrate) {
        try {
          const blob = await getAudioBlob(meta.id);
          if (!blob || cancelled) continue;
          const src = URL.createObjectURL(blob);
          objectUrlsRef.current.add(src);
          restored.push({
            ...meta,
            src,
            cover: createLocalCover(meta.title, meta.artist),
          });
        } catch (error) {
          console.warn('[Music Player 1228] Не вдалося відновити локальний трек', error);
        }
      }
      if (cancelled) return;
      setLocalTracks((prev) => [
        ...prev,
        ...restored.filter((track) => !prev.some((item) => item.id === track.id)),
      ]);
      setLibraryReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /* history + favorites                                               */
  /* ---------------------------------------------------------------- */
  const recordHistory = useCallback(
    (trackId) => {
      setHistory((prev) => {
        const entry = { trackId, playedAt: new Date().toISOString() };
        return [entry, ...prev.filter((item) => item.trackId !== trackId)].slice(0, 60);
      });
    },
    [setHistory],
  );

  const toggleFavorite = useCallback(
    (trackId) => {
      if (!trackId) return;
      const wasFavorite = stateRef.current.favorites.includes(trackId);
      setFavorites((prev) =>
        prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [trackId, ...prev],
      );
      pushToast(
        wasFavorite ? 'Видалено з улюблених' : 'Додано до улюблених',
        wasFavorite ? 'info' : 'success',
      );
    },
    [pushToast, setFavorites],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    pushToast('Історію прослуховувань очищено', 'success');
  }, [pushToast, setHistory]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    pushToast('Список улюбленого очищено', 'success');
  }, [pushToast, setFavorites]);

  /* ---------------------------------------------------------------- */
  /* audio graph (visualizer)                                          */
  /* ---------------------------------------------------------------- */
  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const source = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.82;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        sourceRef.current = source;
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch (error) {
      console.warn('[Music Player 1228] Візуалізатор недоступний', error);
    }
  }, []);

  const getOrder = useCallback(() => {
    const snapshot = stateRef.current;
    const order = snapshot.shuffle && snapshot.shuffleOrder.length
      ? snapshot.shuffleOrder
      : snapshot.queue;
    return order.length ? order : snapshot.queue;
  }, []);

  const setPlaybackFailure = useCallback(
    (message, trackId) => {
      const finalMessage = message || PLAYBACK_ERROR_FALLBACK;
      setPlaybackError({
        message: finalMessage,
        trackId: trackId || stateRef.current.currentTrackId,
        at: Date.now(),
      });
      setPlayIntent(false);
      setIsPlaying(false);
      setBuffering(false);
      pushToast(finalMessage, 'error');
    },
    [pushToast],
  );

  /* ---------------------------------------------------------------- */
  /* playback actions                                                  */
  /* ---------------------------------------------------------------- */
  const playTrack = useCallback(
    (trackOrId, contextList, options = {}) => {
      const id = typeof trackOrId === 'string' ? trackOrId : trackOrId?.id;
      if (!id || !stateRef.current.trackMap.has(id)) {
        pushToast('Цей трек більше недоступний у бібліотеці', 'error');
        return;
      }

      const validIds = (list) => (Array.isArray(list) ? list.filter((item) => stateRef.current.trackMap.has(item)) : []);

      let nextQueue;
      if (Array.isArray(contextList) && contextList.length) {
        nextQueue = validIds(contextList);
        if (!nextQueue.includes(id)) nextQueue = [id, ...nextQueue];
      } else {
        const currentQueue = validIds(stateRef.current.queue);
        nextQueue = currentQueue.includes(id) ? currentQueue : [id, ...currentQueue];
      }

      const audio = audioRef.current;
      const isSameTrack = stateRef.current.currentTrackId === id && audio?.dataset.trackId === id;

      setQueue(nextQueue);
      setPlaybackError(null);

      if (isSameTrack) {
        if (options.restart) {
          try {
            audio.currentTime = 0;
          } catch {
            /* ignore */
          }
          setCurrentTime(0);
        }
        if (audio.error) {
          audio.load();
        }
        ensureAudioGraph();
        setPlayIntent(true);
        const promise = audio.play();
        if (promise?.catch) {
          promise.catch((error) => {
            if (error?.name === 'AbortError') return;
            if (error?.name === 'NotAllowedError') {
              setPlayIntent(false);
              pushToast('Браузер заблокував відтворення. Натисніть кнопку Play ще раз.', 'error');
              return;
            }
            handlersRef.current.error(error);
          });
        }
        return;
      }

      setCurrentTrackId(id);
      setPlayIntent(true);
    },
    [ensureAudioGraph, pushToast],
  );

  const playCollection = useCallback(
    (tracks, options = {}) => {
      const ids = (tracks || []).map((track) => (typeof track === 'string' ? track : track.id)).filter((id) => stateRef.current.trackMap.has(id));
      if (!ids.length) {
        pushToast('У цій добірці ще немає доступних треків', 'error');
        return;
      }
      const shouldShuffle = options.shuffle ?? stateRef.current.shuffle;
      const startId = shouldShuffle ? ids[Math.floor(Math.random() * ids.length)] : ids[0];
      playTrack(startId, ids, { restart: options.restart });
    },
    [playTrack, pushToast],
  );

  const next = useCallback(
    ({ auto = false } = {}) => {
      const snapshot = stateRef.current;
      const order = getOrder();
      if (!order.length) return;
      const idx = Math.max(0, order.indexOf(snapshot.currentTrackId));
      const lastIndex = order.length - 1;

      if (order.length === 1) {
        if (!auto || snapshot.repeat === 'one' || snapshot.repeat === 'all') {
          playTrack(order[0], order, { restart: true });
        } else {
          setPlayIntent(false);
        }
        return;
      }

      if (!auto) {
        playTrack(order[(idx + 1) % order.length]);
        return;
      }

      if (idx < lastIndex) {
        playTrack(order[idx + 1]);
        return;
      }

      if (snapshot.repeat === 'all') {
        playTrack(order[0]);
        return;
      }

      if (snapshot.settings.autoplayNext && snapshot.repeat !== 'one') {
        setPlayIntent(false);
        pushToast('Черга завершилась. Увімкніть повтор, щоб слухати далі.', 'info');
        return;
      }

      setPlayIntent(false);
    },
    [getOrder, playTrack, pushToast],
  );

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const order = getOrder();
    if (!order.length) return;
    const idx = Math.max(0, order.indexOf(stateRef.current.currentTrackId));
    const prevIdx = (idx - 1 + order.length) % order.length;
    playTrack(order[prevIdx]);
  }, [getOrder, playTrack]);

  const handleEnded = useCallback(() => {
    const snapshot = stateRef.current;
    if (snapshot.repeat === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        const promise = audio.play();
        if (promise?.catch) promise.catch((error) => handlersRef.current.error(error));
        setPlayIntent(true);
      }
      return;
    }
    next({ auto: true });
  }, [next]);

  const handlePlaybackError = useCallback(
    (error) => {
      const snapshot = stateRef.current;
      const track = snapshot.trackMap.get(snapshot.currentTrackId);
      const isLocal = Boolean(track?.isLocal);
      const message = track
        ? isLocal
          ? `Не вдалося відтворити «${track.title}». Локальний файл переміщено або видалено — додайте його знову.`
          : `Не вдалося відтворити «${track.title}». Файл недоступний або пошкоджений. Спробуйте ще раз.`
        : PLAYBACK_ERROR_FALLBACK;
      console.warn('[Music Player 1228] Помилка відтворення', error);
      setPlaybackFailure(message, snapshot.currentTrackId);
    },
    [setPlaybackFailure],
  );

  handlersRef.current = { ended: handleEnded, error: handlePlaybackError };

  const retryPlayback = useCallback(() => {
    const audio = audioRef.current;
    const id = stateRef.current.currentTrackId;
    if (!audio || !id) return;
    setPlaybackError(null);
    try {
      audio.load();
      ensureAudioGraph();
      setPlayIntent(true);
    } catch (error) {
      handlePlaybackError(error);
    }
  }, [ensureAudioGraph, handlePlaybackError]);

  const togglePlay = useCallback(() => {
    const snapshot = stateRef.current;
    if (!snapshot.currentTrackId) {
      const tracks = Array.from(snapshot.trackMap.values());
      if (tracks.length) {
        playCollection(tracks);
      } else {
        pushToast('Бібліотека порожня — додайте аудіофайли', 'error');
      }
      return;
    }
    if (snapshot.playbackError) {
      retryPlayback();
      return;
    }
    setPlayIntent((prevState) => !prevState);
  }, [playCollection, pushToast, retryPlayback]);

  const seekTo = useCallback((value) => {
    const audio = audioRef.current;
    if (!audio) return;
    const max = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : stateRef.current.currentTrack?.duration || 0;
    const nextTime = clamp(Number(value) || 0, 0, max);
    try {
      audio.currentTime = nextTime;
    } catch {
      /* seeking may fail before metadata loads */
    }
    setCurrentTime(nextTime);
  }, []);

  const setVolume = useCallback((value) => {
    const nextVolume = clamp(Number(value) || 0, 0, 1);
    setVolumeState(nextVolume);
    if (nextVolume > 0 && stateRef.current.muted) setMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (stateRef.current.muted) {
      setMuted(false);
      if (stateRef.current.volume === 0) setVolumeState(0.6);
      return;
    }
    if (stateRef.current.volume === 0) {
      setVolumeState(0.6);
      setMuted(false);
      return;
    }
    setMuted(true);
  }, []);

  const toggleShuffle = useCallback(() => {
    const nextShuffle = !stateRef.current.shuffle;
    setShuffle(nextShuffle);
    pushToast(nextShuffle ? 'Випадкове відтворення увімкнено' : 'Випадкове відтворення вимкнено', 'info');
  }, [pushToast]);

  const cycleRepeat = useCallback(() => {
    const order = ['off', 'all', 'one'];
    const currentIndex = order.indexOf(stateRef.current.repeat);
    const nextRepeat = order[(currentIndex + 1) % order.length];
    setRepeat(nextRepeat);
    const labels = {
      off: 'Повтор вимкнено',
      all: 'Повтор усієї черги',
      one: 'Повтор одного треку',
    };
    pushToast(labels[nextRepeat], 'info');
  }, [pushToast]);

  const stopPlayback = useCallback((clearTrack = false) => {
    const audio = audioRef.current;
    setPlayIntent(false);
    setIsPlaying(false);
    setBuffering(false);
    if (audio) {
      audio.pause();
      if (clearTrack) {
        audio.removeAttribute('src');
        delete audio.dataset.trackId;
        try {
          audio.load();
        } catch {
          /* ignore */
        }
      }
    }
    if (clearTrack) {
      setCurrentTrackId(null);
      setCurrentTime(0);
      setDuration(0);
      setQueue([]);
      setPlaybackError(null);
    }
  }, []);

  /* ---------------------------------------------------------------- */
  /* audio element lifecycle                                           */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = clamp(Number(readStored(STORAGE_KEYS.settings, DEFAULT_SETTINGS)?.defaultVolume ?? 0.8), 0, 1);
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoadedMetadata = () => {
      setBuffering(false);
      if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
    };
    const onDurationChange = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
    };
    const onPlaying = () => {
      setIsPlaying(true);
      setBuffering(false);
      setPlaybackError(null);
      const id = audio.dataset.trackId;
      if (id) recordHistory(id);
    };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);
    const onEnded = () => handlersRef.current.ended();
    const onError = () => {
      if (!audio.currentSrc) return;
      handlersRef.current.error(audio.error);
    };
    const onVolumeChange = () => {
      if (!Number.isFinite(audio.volume)) return;
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('volumechange', onVolumeChange);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('volumechange', onVolumeChange);
      audio.pause();
      audio.removeAttribute('src');
      try {
        audio.load();
      } catch {
        /* ignore */
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;
      }
      audioRef.current = null;
    };
  }, [recordHistory]);

  /* load a new source when the current track changes */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = currentTrackId ? trackMap.get(currentTrackId) : null;
    if (!track) {
      audio.removeAttribute('src');
      delete audio.dataset.trackId;
      return;
    }
    if (audio.dataset.trackId === track.id) return;
    audio.dataset.trackId = track.id;
    setCurrentTime(0);
    setDuration(track.duration || 0);
    if (!track.src) {
      setPlaybackFailure('Аудіофайл для цього треку не знайдено.', track.id);
      return;
    }
    audio.src = track.src;
    try {
      audio.load();
    } catch {
      /* ignore */
    }
    setBuffering(true);
  }, [currentTrackId, trackMap, setPlaybackFailure]);

  /* play / pause intent */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrackId) return;
    if (!playIntent) {
      audio.pause();
      return;
    }
    ensureAudioGraph();
    const promise = audio.play();
    if (promise?.catch) {
      promise.catch((error) => {
        if (error?.name === 'AbortError') return;
        if (error?.name === 'NotAllowedError') {
          setPlayIntent(false);
          pushToast('Браузер заблокував відтворення. Натисніть кнопку Play ще раз.', 'error');
          return;
        }
        handlersRef.current.error(error);
      });
    }
  }, [playIntent, currentTrackId, ensureAudioGraph, pushToast]);

  /* volume + mute */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = clamp(volume, 0, 1);
    audio.muted = muted;
  }, [volume, muted]);

  /* keep the shuffled order in sync with the queue */
  useEffect(() => {
    if (!shuffle) {
      setShuffleOrder((prev) => (prev.length ? [] : prev));
      return;
    }
    setShuffleOrder((prev) => {
      const valid = prev.filter((id) => queue.includes(id));
      const missing = queue.filter((id) => !valid.includes(id));
      return [...valid, ...shuffleArray(missing)];
    });
  }, [shuffle, queue]);

  /* buffering watchdog — never leave the player hanging forever */
  useEffect(() => {
    if (!buffering || !playIntent) return undefined;
    const timer = setTimeout(() => {
      const audio = audioRef.current;
      if (audio && audio.readyState < 3) {
        handlersRef.current.error(new Error('Час очікування аудіо вичерпано'));
        setBuffering(false);
      }
    }, 20000);
    return () => clearTimeout(timer);
  }, [buffering, playIntent]);

  /* media session metadata + hardware controls */
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return undefined;
    try {
      const artworkUrl = /^(https?:|data:|blob:)/.test(currentTrack.cover)
        ? currentTrack.cover
        : new URL(currentTrack.cover, window.location.href).href;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: [
          {
            src: artworkUrl,
            sizes: '512x512',
            type: currentTrack.cover.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg',
          },
        ],
      });
      navigator.mediaSession.setActionHandler('play', () => setPlayIntent(true));
      navigator.mediaSession.setActionHandler('pause', () => setPlayIntent(false));
      navigator.mediaSession.setActionHandler('previoustrack', prev);
      navigator.mediaSession.setActionHandler('nexttrack', () => next());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') seekTo(details.seekTime);
      });
      if (typeof navigator.mediaSession.setPlaybackState === 'function') {
        navigator.mediaSession.setPlaybackState(isPlaying ? 'playing' : 'paused');
      }
    } catch (error) {
      console.warn('[Music Player 1228] Media Session недоступний', error);
    }
    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      } catch {
        /* ignore */
      }
    };
  }, [currentTrack, next, prev, seekTo, isPlaying]);

  /* media session position — throttled to whole seconds */
  const wholeSecond = Math.floor(currentTime);
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    if (typeof navigator.mediaSession.setPositionState !== 'function') return;
    const total = duration || currentTrack.duration || 0;
    if (!total) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: total,
        playbackRate: 1,
        position: clamp(wholeSecond, 0, total),
      });
    } catch {
      /* ignore unsupported state */
    }
  }, [wholeSecond, duration, currentTrack]);

  /* ---------------------------------------------------------------- */
  /* playlist actions                                                  */
  /* ---------------------------------------------------------------- */
  const createPlaylist = useCallback(
    (name, trackIds = []) => {
      const trimmed = (name || '').trim();
      if (!trimmed) {
        pushToast('Введіть назву плейлиста', 'error');
        return null;
      }
      const playlist = {
        id: uid('pl'),
        name: trimmed.slice(0, 80),
        description: '',
        trackIds: [...new Set(trackIds)],
        createdAt: new Date().toISOString(),
      };
      setPlaylists((prev) => [playlist, ...prev]);
      pushToast(`Плейлист «${playlist.name}» створено`, 'success');
      return playlist;
    },
    [pushToast, setPlaylists],
  );

  const renamePlaylist = useCallback(
    (playlistId, name) => {
      const trimmed = (name || '').trim();
      if (!trimmed) {
        pushToast('Назва не може бути порожньою', 'error');
        return false;
      }
      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist.id === playlistId ? { ...playlist, name: trimmed.slice(0, 80) } : playlist,
        ),
      );
      pushToast('Назву плейлиста оновлено', 'success');
      return true;
    },
    [pushToast, setPlaylists],
  );

  const deletePlaylist = useCallback(
    (playlistId) => {
      const playlist = playlists.find((item) => item.id === playlistId);
      setPlaylists((prev) => prev.filter((item) => item.id !== playlistId));
      pushToast(playlist ? `Плейлист «${playlist.name}» видалено` : 'Плейлист видалено', 'success');
    },
    [playlists, pushToast, setPlaylists],
  );

  const addTrackToPlaylist = useCallback(
    (playlistId, trackId) => {
      const playlist = playlists.find((item) => item.id === playlistId);
      if (!playlist) {
        pushToast('Плейлист не знайдено', 'error');
        return false;
      }
      if (playlist.trackIds.includes(trackId)) {
        pushToast(`«${playlist.name}» вже містить цей трек`, 'info');
        return false;
      }
      setPlaylists((prev) =>
        prev.map((item) =>
          item.id === playlistId ? { ...item, trackIds: [...item.trackIds, trackId] } : item,
        ),
      );
      pushToast(`Додано до «${playlist.name}»`, 'success');
      return true;
    },
    [playlists, pushToast, setPlaylists],
  );

  const removeTrackFromPlaylist = useCallback(
    (playlistId, trackId) => {
      setPlaylists((prev) =>
        prev.map((item) =>
          item.id === playlistId
            ? { ...item, trackIds: item.trackIds.filter((id) => id !== trackId) }
            : item,
        ),
      );
      pushToast('Трек видалено з плейлиста', 'success');
    },
    [pushToast, setPlaylists],
  );

  const updatePlaylistDescription = useCallback(
    (playlistId, description) => {
      setPlaylists((prev) =>
        prev.map((item) => (item.id === playlistId ? { ...item, description } : item)),
      );
    },
    [setPlaylists],
  );

  const openAddToPlaylist = useCallback((track) => setAddTarget(track), []);
  const closeAddToPlaylist = useCallback(() => setAddTarget(null), []);

  /* ---------------------------------------------------------------- */
  /* local uploads                                                     */
  /* ---------------------------------------------------------------- */
  const addLocalFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []).filter(isAudioFile);
      if (!files.length) {
        pushToast('Оберіть аудіофайли (MP3, WAV, OGG, M4A, FLAC)', 'error');
        return { added: 0, failed: 0 };
      }
      let added = 0;
      let failed = 0;
      let sessionOnly = false;
      for (const file of files) {
        try {
          const id = uid('local');
          const { title, artist } = parseTrackFilename(file.name);
          const duration = await readAudioDuration(file);
          const meta = {
            id,
            title,
            artist,
            album: 'Локальна бібліотека',
            genre: 'Локальні',
            duration,
            size: file.size,
            fileName: file.name,
            addedAt: new Date().toISOString(),
            isLocal: true,
          };
          const { persisted } = await saveAudioBlob(id, file);
          if (!persisted) sessionOnly = true;
          const src = URL.createObjectURL(file);
          objectUrlsRef.current.add(src);
          const track = { ...meta, src, cover: createLocalCover(title, artist) };
          setLocalTracks((prev) => [track, ...prev]);
          setLocalMeta((prev) => [meta, ...prev]);
          added += 1;
        } catch (error) {
          console.warn('[Music Player 1228] Не вдалося додати файл', error);
          failed += 1;
        }
      }
      if (added) {
        pushToast(
          added === 1 ? 'Трек додано до локальної бібліотеки' : `Додано треків: ${added}`,
          'success',
        );
      }
      if (failed) {
        pushToast(`Не вдалося обробити файлів: ${failed}`, 'error');
      }
      if (sessionOnly) {
        pushToast(
          'Браузер не дозволив зберегти аудіо назавжди — файли доступні до перезавантаження',
          'error',
        );
      }
      return { added, failed };
    },
    [pushToast, setLocalMeta],
  );

  const deleteLocalTrack = useCallback(
    async (trackId) => {
      const track = stateRef.current.trackMap.get(trackId);
      if (!track || !track.isLocal) return;
      if (stateRef.current.currentTrackId === trackId) {
        stopPlayback(true);
      }
      if (track.src) {
        URL.revokeObjectURL(track.src);
        objectUrlsRef.current.delete(track.src);
      }
      setLocalTracks((prev) => prev.filter((item) => item.id !== trackId));
      setLocalMeta((prev) => prev.filter((item) => item.id !== trackId));
      setFavorites((prev) => prev.filter((id) => id !== trackId));
      setPlaylists((prev) =>
        prev.map((item) => ({
          ...item,
          trackIds: item.trackIds.filter((id) => id !== trackId),
        })),
      );
      setHistory((prev) => prev.filter((entry) => entry.trackId !== trackId));
      setQueue((prev) => prev.filter((id) => id !== trackId));
      await deleteAudioBlob(trackId);
      pushToast('Локальний трек видалено', 'success');
    },
    [pushToast, setFavorites, setHistory, setLocalMeta, setPlaylists, stopPlayback],
  );

  const clearLocalTracks = useCallback(async () => {
    stopPlayback(true);
    localTracks.forEach((track) => {
      if (track.src) {
        URL.revokeObjectURL(track.src);
        objectUrlsRef.current.delete(track.src);
      }
    });
    setLocalTracks([]);
    setLocalMeta([]);
    setFavorites((prev) => prev.filter((id) => !String(id).startsWith('local-')));
    setPlaylists((prev) =>
      prev.map((item) => ({
        ...item,
        trackIds: item.trackIds.filter((id) => !String(id).startsWith('local-')),
      })),
    );
    setHistory((prev) => prev.filter((entry) => !String(entry.trackId).startsWith('local-')));
    await clearAudioBlobs();
    pushToast('Локальні файли видалено', 'success');
  }, [localTracks, pushToast, setFavorites, setHistory, setLocalMeta, setPlaylists, stopPlayback]);

  const clearAllLocalData = clearLocalTracks;

  /* ---------------------------------------------------------------- */
  /* settings + data management                                        */
  /* ---------------------------------------------------------------- */
  const updateSettings = useCallback(
    (patch) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      if (patch.defaultVolume !== undefined) {
        setVolumeState(clamp(Number(patch.defaultVolume) || 0, 0, 1));
        setMuted(false);
      }
    },
    [setSettings],
  );

  const exportData = useCallback(() => {
    const payload = {
      app: 'Music Player 1228',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      favorites,
      playlists,
      history,
      localTracks: localMeta,
      note: 'Аудіофайли, додані користувачем, не включаються у резервну копію — лише метадані.',
    };
    downloadJson(payload, `musicflow-backup-${new Date().toISOString().slice(0, 10)}.json`);
    pushToast('Резервну копію завантажено', 'success');
  }, [favorites, history, localMeta, playlists, pushToast, settings]);

  const importData = useCallback(
    async (file) => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object') throw new Error('Невірний формат файлу');
        const validIds = new Set([
          ...DEMO_TRACKS.map((track) => track.id),
          ...stateRef.current.trackMap.keys(),
        ]);
        if (Array.isArray(data.favorites)) {
          setFavorites(data.favorites.filter((id) => validIds.has(id)));
        }
        if (Array.isArray(data.playlists)) {
          const sanitized = data.playlists
            .filter((item) => item && typeof item.name === 'string')
            .map((item) => ({
              id: typeof item.id === 'string' ? item.id : uid('pl'),
              name: item.name.slice(0, 80),
              description: typeof item.description === 'string' ? item.description.slice(0, 200) : '',
              trackIds: Array.isArray(item.trackIds)
                ? item.trackIds.filter((id) => validIds.has(id))
                : [],
              createdAt: item.createdAt || new Date().toISOString(),
            }));
          setPlaylists(sanitized);
        }
        if (Array.isArray(data.history)) {
          setHistory(
            data.history
              .filter((entry) => entry && validIds.has(entry.trackId))
              .slice(0, 60)
              .map((entry) => ({
                trackId: entry.trackId,
                playedAt: entry.playedAt || new Date().toISOString(),
              })),
          );
        }
        if (data.settings && typeof data.settings === 'object') {
          updateSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
        pushToast('Дані успішно імпортовано', 'success');
        return true;
      } catch (error) {
        console.warn('[Music Player 1228] Помилка імпорту', error);
        pushToast('Не вдалося імпортувати файл. Перевірте формат JSON.', 'error');
        return false;
      }
    },
    [pushToast, setFavorites, setHistory, setPlaylists, updateSettings],
  );

  const resetAllData = useCallback(async () => {
    stopPlayback(true);
    localTracks.forEach((track) => {
      if (track.src) {
        URL.revokeObjectURL(track.src);
        objectUrlsRef.current.delete(track.src);
      }
    });
    await clearAudioBlobs();
    setLocalTracks([]);
    setLocalMeta([]);
    setFavorites([]);
    setPlaylists(SEED_PLAYLISTS);
    setHistory([]);
    setSettings(DEFAULT_SETTINGS);
    setVolumeState(clamp(Number(DEFAULT_SETTINGS.defaultVolume) || 0.8, 0, 1));
    setMuted(false);
    setShuffle(false);
    setRepeat('off');
    setSearchQuery('');
    pushToast('Усі збережені дані скинуто до початкового стану', 'success');
  }, [
    localTracks,
    pushToast,
    setFavorites,
    setHistory,
    setLocalMeta,
    setPlaylists,
    setSettings,
    stopPlayback,
  ]);

  /* ---------------------------------------------------------------- */
  /* derived helpers                                                   */
  /* ---------------------------------------------------------------- */
  const resolvePlaylistTracks = useCallback(
    (playlist) => {
      if (!playlist || !Array.isArray(playlist.trackIds)) return [];
      return playlist.trackIds.map((id) => trackMap.get(id)).filter(Boolean);
    },
    [trackMap],
  );

  const playPlaylist = useCallback(
    (playlist) => {
      const tracks = resolvePlaylistTracks(playlist);
      if (!tracks.length) {
        pushToast('Плейлист порожній — додайте треки', 'info');
        return;
      }
      playCollection(tracks);
    },
    [playCollection, pushToast, resolvePlaylistTracks],
  );

  const playNextInQueue = useCallback(
    (track) => {
      const id = typeof track === 'string' ? track : track?.id;
      if (!id) return;
      const currentQueue = stateRef.current.queue.filter((item) => stateRef.current.trackMap.has(item));
      const without = currentQueue.filter((item) => item !== id);
      const idx = currentQueue.indexOf(stateRef.current.currentTrackId);
      const insertAt = idx >= 0 ? idx + 1 : without.length;
      const nextQueue = [...without.slice(0, insertAt), id, ...without.slice(insertAt)];
      playTrack(id, nextQueue);
      pushToast('Додано наступним у черзі', 'success');
    },
    [playTrack, pushToast],
  );

  const genres = useMemo(() => [...new Set(allTracks.map((track) => track.genre))], [allTracks]);

  const value = {
    /* library */
    allTracks,
    demoTracks,
    localTracks,
    communityTracks,
    setCommunityTracks,
    playableTracks,
    trackMap,
    libraryReady,
    genres,
    favoriteTracks,
    historyEntries,
    queueTracks,
    playlists,
    curatedPlaylists: CURATED_PLAYLISTS,
    userPlaylistById,
    getPlaylistById,
    resolvePlaylistTracks,

    /* player */
    currentTrack,
    currentTrackId,
    isPlaying,
    buffering,
    currentTime,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    queue,
    playbackError,
    analyserRef,
    playTrack,
    playCollection,
    playPlaylist,
    playNextInQueue,
    togglePlay,
    next,
    prev,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    retryPlayback,
    stopPlayback,

    /* favorites + history */
    favorites,
    toggleFavorite,
    clearHistory,
    clearFavorites,

    /* playlists */
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    updatePlaylistDescription,

    /* uploads */
    addLocalFiles,
    deleteLocalTrack,
    clearLocalTracks,
    clearAllLocalData,

    /* settings */
    settings,
    updateSettings,
    exportData,
    importData,
    resetAllData,

    /* ui */
    searchQuery,
    setSearchQuery,
    toasts,
    pushToast,
    dismissToast,
    settingsOpen,
    setSettingsOpen,
    addTarget,
    openAddToPlaylist,
    closeAddToPlaylist,
    nowPlayingOpen,
    setNowPlayingOpen,
    sidebarOpen,
    setSidebarOpen,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
