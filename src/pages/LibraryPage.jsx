import { useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Grid2X2,
  List,
  ListMusic,
  Loader2,
  Play,
  Search,
  SlidersHorizontal,
  Upload,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn, formatTotalDuration, pluralTracks } from '../lib/utils';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TrackRow from '../components/tracks/TrackRow';
import TrackCard from '../components/tracks/TrackCard';

const SORT_OPTIONS = [
  { value: 'added-desc', label: 'Спочатку нові' },
  { value: 'added-asc', label: 'Спочатку старі' },
  { value: 'title', label: 'Назва А–Я' },
  { value: 'artist', label: 'Виконавець А–Я' },
  { value: 'duration', label: 'Тривалість' },
];

const collator = new Intl.Collator('uk-UA', { sensitivity: 'base', numeric: true });

export default function LibraryPage() {
  const {
    allTracks,
    localTracks,
    searchQuery,
    setSearchQuery,
    addLocalFiles,
    deleteLocalTrack,
    playCollection,
    libraryReady,
  } = useApp();

  const [genre, setGenre] = useState('Усі');
  const [sort, setSort] = useState('added-desc');
  const [view, setView] = useState('list');
  const [dragging, setDragging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const fileInputRef = useRef(null);
  const dragDepth = useRef(0);

  const genres = useMemo(
    () => ['Усі', ...Array.from(new Set(allTracks.map((track) => track.genre)))],
    [allTracks],
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = allTracks.filter((track) => {
      const matchesGenre = genre === 'Усі' || track.genre === genre;
      if (!matchesGenre) return false;
      if (!query) return true;
      return (
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.album.toLowerCase().includes(query)
      );
    });

    return result.sort((a, b) => {
      switch (sort) {
        case 'title':
          return collator.compare(a.title, b.title);
        case 'artist':
          return collator.compare(a.artist, b.artist) || collator.compare(a.title, b.title);
        case 'duration':
          return (a.duration || 0) - (b.duration || 0);
        case 'added-asc':
          return new Date(a.addedAt) - new Date(b.addedAt);
        case 'added-desc':
        default:
          return new Date(b.addedAt) - new Date(a.addedAt);
      }
    });
  }, [allTracks, genre, searchQuery, sort]);

  const contextIds = filtered.map((track) => track.id);
  const totalDuration = filtered.reduce((sum, track) => sum + (track.duration || 0), 0);
  const libraryDuration = allTracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const isFiltered = Boolean(searchQuery.trim()) || genre !== 'Усі';

  const handleFiles = async (files) => {
    if (!files || !files.length) return;
    setAdding(true);
    try {
      const result = await addLocalFiles(files);
      if (result?.added) setGenre('Усі');
    } finally {
      setAdding(false);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setDragging(false);
    await handleFiles(event.dataTransfer?.files);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setGenre('Усі');
    setSort('added-desc');
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
            Бібліотека
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Моя музика
          </h1>
          <p className="mt-1 text-sm text-muted">
            {pluralTracks(allTracks.length)} · {formatTotalDuration(libraryDuration)}
            {localTracks.length ? ` · ${localTracks.length} локальних` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.opus"
            multiple
            className="hidden"
            onChange={(event) => {
              handleFiles(event.target.files);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            disabled={adding}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {adding ? 'Додаємо...' : 'Додати файли'}
          </button>
          <button
            type="button"
            onClick={() => playCollection(filtered)}
            className="btn-primary"
            disabled={!filtered.length}
          >
            <Play className="h-4 w-4 fill-current" />
            Відтворити {isFiltered ? 'знайдене' : 'все'}
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={handleDrop}
        className={cn(
          'group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-5 py-6 text-center transition-all duration-200 sm:flex-row sm:gap-4 sm:py-5',
          dragging
            ? 'border-accent bg-accent/10 ring-4 ring-accent/10'
            : 'border-line/70 bg-surface/35 hover:border-accent/40 hover:bg-surface/60',
        )}
        aria-label="Додати локальні аудіофайли"
      >
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl transition-colors',
            dragging ? 'bg-accent text-[rgb(var(--accent-contrast))]' : 'bg-accent/10 text-accent',
          )}
        >
          {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-ink">
            {dragging ? 'Відпустіть, щоб додати музику' : 'Перетягніть аудіофайли сюди'}
          </span>
          <span className="mt-0.5 block text-[11px] text-muted">
            або натисніть, щоб вибрати · MP3, WAV, OGG, M4A, FLAC · файли зберігаються локально
          </span>
        </span>
        {!libraryReady ? (
          <span className="flex items-center gap-1 text-[10px] text-muted sm:ml-auto">
            <Loader2 className="h-3 w-3 animate-spin" />
            Відновлюємо локальні треки...
          </span>
        ) : null}
      </button>

      <section className="panel p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Пошук за назвою, виконавцем або альбомом..."
              aria-label="Пошук у бібліотеці"
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

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Сортувати музику"
                className="h-10 appearance-none rounded-xl border border-line/80 bg-elevated/70 pl-9 pr-8 text-xs font-semibold text-ink transition focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>

            <div className="flex rounded-xl border border-line/80 bg-elevated/60 p-0.5">
              <button
                type="button"
                onClick={() => setView('list')}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition',
                  view === 'list' ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-ink',
                )}
                aria-label="Показати списком"
                aria-pressed={view === 'list'}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('grid')}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition',
                  view === 'grid' ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-ink',
                )}
                aria-label="Показати сіткою"
                aria-pressed={view === 'grid'}
              >
                <Grid2X2 className="h-4 w-4" />
              </button>
            </div>
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

      <section>
        <div className="mb-2.5 flex items-center justify-between gap-3 px-1">
          <p className="text-[11px] font-semibold text-muted">
            <span className="text-ink">{filtered.length}</span> із {allTracks.length} ·{' '}
            {formatTotalDuration(totalDuration)}
            {isFiltered ? ' у добірці' : ' загалом'}
          </p>
          {isFiltered ? (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
            >
              <X className="h-3 w-3" />
              Скинути фільтри
            </button>
          ) : null}
        </div>

        {!filtered.length ? (
          <EmptyState
            title="Нічого не знайдено"
            description={
              allTracks.length
                ? 'Спробуйте змінити пошуковий запит або обрати інший жанр.'
                : 'Бібліотека порожня. Додайте власні аудіофайли, щоб почати слухати.'
            }
            compact
            action={
              <>
                <button type="button" className="btn-primary" onClick={resetFilters}>
                  Скинути фільтри
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Додати файли
                </button>
              </>
            }
          />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {filtered.map((track) => (
              <TrackCard key={track.id} track={track} contextIds={contextIds} />
            ))}
          </div>
        ) : (
          <div className="panel overflow-hidden p-1.5 sm:p-2">
            <div className="hidden items-center gap-3 px-3 pb-1.5 pt-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted/70 md:flex">
              <span className="w-6 shrink-0 text-center">#</span>
              <span className="min-w-0 flex-1">Трек</span>
              <span className="w-[16%] shrink-0">Альбом</span>
              <span className="hidden w-[108px] shrink-0 lg:block">Жанр</span>
              <span className="w-[180px] shrink-0 text-right sm:w-[188px]">Дії</span>
              <span className="w-9 shrink-0 text-right sm:block">Час</span>
            </div>
            <div className="space-y-0.5">
              {filtered.map((track, index) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={index}
                  contextIds={contextIds}
                  showDate={false}
                  showGenre
                  onDeleteLocal={
                    track.isLocal
                      ? (item) => setPendingDelete(item)
                      : null
                  }
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="flex flex-col items-center justify-between gap-2 rounded-2xl border border-line/50 bg-surface/35 px-4 py-3 text-center text-[10px] text-muted sm:flex-row sm:text-left">
        <span className="flex items-center gap-1.5">
          <ListMusic className="h-3.5 w-3.5 text-accent" />
          Демо-треки — оригінальні синтезовані записи MusicFlow. Жодних сторонніх аудіофайлів.
        </span>
        <span>Локальні файли зберігаються в IndexedDB цього браузера.</span>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Видалити локальний файл?"
        description={
          pendingDelete
            ? `«${pendingDelete.title}» буде видалено з бібліотеки, плейлистів та улюбленого. Демо-бібліотека залишиться незмінною.`
            : ''
        }
        confirmLabel="Видалити файл"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const track = pendingDelete;
          setPendingDelete(null);
          if (track) deleteLocalTrack(track.id);
        }}
      />
    </div>
  );
}
