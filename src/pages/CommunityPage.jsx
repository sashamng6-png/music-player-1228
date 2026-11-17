import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  CloudUpload,
  Globe2,
  Loader2,
  Music4,
  Play,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { cn, formatTotalDuration, pluralTracks } from '../lib/utils';
import CommunityTrackCard from '../components/community/CommunityTrackCard';
import SetupNotice from '../components/community/SetupNotice';
import EmptyState from '../components/ui/EmptyState';

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Спочатку нові' },
  { value: 'date-asc', label: 'Спочатку старі' },
  { value: 'title', label: 'Назва А–Я' },
  { value: 'artist', label: 'Виконавець А–Я' },
];

const collator = new Intl.Collator('uk-UA', { sensitivity: 'base', numeric: true });

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-line/40 bg-surface/40 p-2.5">
      <div className="aspect-square w-full animate-pulse rounded-xl bg-elevated" />
      <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-elevated" />
      <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded bg-elevated" />
      <div className="mt-3 h-2.5 w-2/3 animate-pulse rounded bg-elevated" />
    </div>
  );
}

export default function CommunityPage() {
  const { playableTracks, playCollection, searchQuery, setSearchQuery } = useApp();
  const { user, openAuth, configured: authConfigured } = useAuth();
  const {
    configured,
    tracks,
    loading,
    error,
    refresh,
    lastLoadedAt,
  } = useCommunity();
  const navigate = useNavigate();

  const [genre, setGenre] = useState('Усі');
  const [sort, setSort] = useState('date-desc');
  const [refreshing, setRefreshing] = useState(false);

  const genres = useMemo(() => {
    const used = Array.from(new Set(tracks.map((track) => track.genre).filter(Boolean)));
    return ['Усі', ...used];
  }, [tracks]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = tracks.filter((track) => {
      if (genre !== 'Усі' && track.genre !== genre) return false;
      if (!query) return true;
      return (
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        (track.authorName || '').toLowerCase().includes(query)
      );
    });

    return result.sort((a, b) => {
      switch (sort) {
        case 'date-asc':
          return new Date(a.addedAt) - new Date(b.addedAt);
        case 'title':
          return collator.compare(a.title, b.title);
        case 'artist':
          return collator.compare(a.artist, b.artist) || collator.compare(a.title, b.title);
        case 'date-desc':
        default:
          return new Date(b.addedAt) - new Date(a.addedAt);
      }
    });
  }, [tracks, genre, searchQuery, sort]);

  const contextIds = filtered.map((track) => track.id);
  const totalDuration = filtered.reduce((sum, track) => sum + (track.duration || 0), 0);
  const authorCount = useMemo(
    () => new Set(tracks.map((track) => track.userId)).size,
    [tracks],
  );
  const isFiltered = Boolean(searchQuery.trim()) || genre !== 'Усі';

  const handleUpload = () => {
    if (!user) {
      openAuth('signin');
      return;
    }
    navigate('/upload');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const playableIds = new Set(playableTracks.map((track) => track.id));
  const playableFiltered = filtered.filter((track) => playableIds.has(track.id));

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] border border-line/60 bg-gradient-to-br from-accent/15 via-surface to-accent2/15 p-5 sm:p-7">
        <div
          className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-accent2 shadow-2xl sm:h-32 sm:w-32">
            <Globe2 className="h-12 w-12 text-[rgb(var(--accent-contrast))] sm:h-14 sm:w-14" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
              <Sparkles className="h-3 w-3" />
              Спільна музична бібліотека
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Спільнота
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {pluralTracks(tracks.length)}
              {tracks.length ? ` · ${authorCount} ${authorCount === 1 ? 'автор' : 'авторів'}` : ''}
              {totalDuration ? ` · ${formatTotalDuration(totalDuration)}` : ''}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => playCollection(playableFiltered, { shuffle: true })}
                disabled={!playableFiltered.length}
              >
                <Play className="h-4 w-4 fill-current" />
                Слухати спільноту
              </button>
              <button type="button" className="btn-secondary" onClick={handleUpload}>
                <CloudUpload className="h-4 w-4" />
                Завантажити трек
              </button>
              {configured ? (
                <button
                  type="button"
                  className="btn-ghost text-xs"
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', (refreshing || loading) && 'animate-spin')} />
                  Оновити
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {!configured || !authConfigured ? (
        <SetupNotice title="Спільнота чекає на підключення Supabase" />
      ) : null}

      {configured ? (
        <section className="panel p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Пошук за назвою, виконавцем або автором..."
                aria-label="Пошук у спільноті"
                className="field h-10 pl-10 pr-9 [&::-webkit-search-cancel-button]:hidden"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-elevated hover:text-ink"
                  aria-label="Очистити пошук"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="relative shrink-0">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Сортувати треки спільноти"
                className="h-10 w-full appearance-none rounded-xl border border-line/80 bg-elevated/70 pl-9 pr-8 text-xs font-semibold text-ink transition focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20 sm:w-auto"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>
          </div>

          <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
            {genres.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setGenre(item)}
                className={cn('chip', genre === item && 'chip-active')}
                aria-pressed={genre === item}
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {!configured ? null : loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.07] px-6 py-10 text-center">
          <p className="text-sm font-bold text-ink">Не вдалося завантажити спільноту</p>
          <p className="max-w-md text-xs leading-relaxed text-muted">{error}</p>
          <button type="button" className="btn-secondary mt-1" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            Спробувати ще раз
          </button>
        </div>
      ) : filtered.length ? (
        <>
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
              <Music4 className="h-3.5 w-3.5 text-accent" />
              <span className="text-ink">{filtered.length}</span> із {tracks.length} ·{' '}
              {formatTotalDuration(totalDuration)}
              {lastLoadedAt ? ' · оновлено щойно' : ''}
            </p>
            {isFiltered ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setGenre('Усі');
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
              >
                <X className="h-3 w-3" />
                Скинути фільтри
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {filtered.map((track) => (
              <CommunityTrackCard key={track.id} track={track} contextIds={contextIds} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title={tracks.length ? 'Нічого не знайдено' : 'Спільнота ще порожня'}
          description={
            tracks.length
              ? 'Спробуйте інший запит або жанр — у спільноті вже є музика.'
              : 'Станьте першим автором Music Player 1228: завантажте власний трек, і його почують усі відвідувачі.'
          }
          compact
          action={
            <>
              {isFiltered ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setSearchQuery('');
                    setGenre('Усі');
                  }}
                >
                  Скинути фільтри
                </button>
              ) : null}
              <button type="button" className="btn-secondary" onClick={handleUpload}>
                <CloudUpload className="h-4 w-4" />
                Завантажити трек
              </button>
            </>
          }
        />
      )}

      <div className="flex flex-col items-center justify-between gap-2 rounded-2xl border border-line/50 bg-surface/35 px-4 py-3 text-center text-[10px] text-muted sm:flex-row sm:text-left">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-accent" />
          Треки спільноти зберігаються у Supabase Storage. Слухати й шукати може кожен.
        </span>
        {user ? (
          <span>Ви увійшли як {user.email}</span>
        ) : (
          <button
            type="button"
            onClick={() => openAuth('signup')}
            className="font-bold text-accent hover:underline"
          >
            Приєднатися до спільноти
          </button>
        )}
      </div>
    </div>
  );
}
