import { Link } from 'react-router-dom';
import { Heart, Library, Play, Shuffle, Sparkles, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTotalDuration, pluralTracks } from '../lib/utils';
import EmptyState from '../components/ui/EmptyState';
import TrackRow from '../components/tracks/TrackRow';

export default function FavoritesPage() {
  const { favoriteTracks, playCollection, clearFavorites, favorites } = useApp();
  const totalDuration = favoriteTracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const contextIds = favoriteTracks.map((track) => track.id);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] border border-line/60 bg-gradient-to-br from-rose-500/20 via-surface to-accent2/20 p-5 sm:p-7">
        <div
          className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-400 to-accent2 shadow-2xl sm:h-36 sm:w-36">
            <Heart className="h-12 w-12 fill-white text-white sm:h-16 sm:w-16" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-rose-300">
              <Sparkles className="h-3 w-3" />
              Персональна добірка
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Улюблене
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {pluralTracks(favoriteTracks.length)}
              {totalDuration ? ` · ${formatTotalDuration(totalDuration)}` : ''}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => playCollection(favoriteTracks)}
                disabled={!favoriteTracks.length}
              >
                <Play className="h-4 w-4 fill-current" />
                Відтворити все
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => playCollection(favoriteTracks, { shuffle: true })}
                disabled={!favoriteTracks.length}
              >
                <Shuffle className="h-4 w-4" />
                Перемішати
              </button>
              {favorites.length ? (
                <button
                  type="button"
                  className="btn-ghost text-xs text-muted hover:text-rose-400"
                  onClick={clearFavorites}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Очистити
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {favoriteTracks.length ? (
        <section className="panel p-1.5 sm:p-2">
          <div className="hidden items-center gap-3 px-3 pb-1.5 pt-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted/70 md:flex">
            <span className="w-6 text-center">#</span>
            <span className="min-w-0 flex-1">Трек</span>
            <span className="w-[16%]">Альбом</span>
            <span className="hidden w-[108px] lg:block">Жанр</span>
            <span className="w-[180px] text-right sm:w-[188px]">Дії</span>
            <span className="w-9 text-right">Час</span>
          </div>
          <div className="space-y-0.5">
            {favoriteTracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                contextIds={contextIds}
              />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title="Улюблених треків ще немає"
          description="Натискайте сердечко біля композиції — і вона з’явиться тут. Улюблене зберігається навіть після перезавантаження."
          action={
            <>
              <Link to="/library" className="btn-primary">
                <Library className="h-4 w-4" />
                Знайти музику
              </Link>
              <Link to="/playlists" className="btn-secondary">
                Відкрити плейлисти
              </Link>
            </>
          }
        />
      )}
    </div>
  );
}
