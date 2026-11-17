import { Heart, Pause, Play, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn, formatTime } from '../../lib/utils';
import CoverArt from '../ui/CoverArt';

export default function TrackCard({ track, contextIds, className, showArtist = true }) {
  const {
    playTrack,
    togglePlay,
    currentTrackId,
    isPlaying,
    favorites,
    toggleFavorite,
    openAddToPlaylist,
  } = useApp();

  if (!track) return null;
  const isCurrent = currentTrackId === track.id;
  const isActive = isCurrent && isPlaying;
  const isFavorite = favorites.includes(track.id);

  const handlePlay = () => {
    if (isCurrent) togglePlay();
    else playTrack(track.id, contextIds);
  };

  return (
    <article
      className={cn(
        'group relative min-w-0 rounded-2xl border border-transparent bg-surface/45 p-2.5 transition-all duration-300 hover:border-line/70 hover:bg-surface/80 hover:shadow-card',
        isCurrent && 'border-accent/30 bg-accent/[0.06]',
        className,
      )}
    >
      <div className="relative">
        <button
          type="button"
          onClick={handlePlay}
          className="block w-full text-left"
          aria-label={isActive ? `Пауза: ${track.title}` : `Відтворити: ${track.title}`}
        >
          <CoverArt
            src={track.cover}
            alt={track.album}
            rounded="rounded-xl"
            className="aspect-square w-full cover-shadow"
            imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </button>

        <button
          type="button"
          onClick={handlePlay}
          className={cn(
            'absolute bottom-2 right-2 flex h-10 w-10 translate-y-1.5 items-center justify-center rounded-full bg-accent text-[rgb(var(--accent-contrast))] shadow-glow opacity-0 transition-all duration-300 hover:brightness-110 focus-visible:opacity-100 active:scale-90 group-hover:translate-y-0 group-hover:opacity-100',
            isCurrent && 'translate-y-0 opacity-100',
          )}
          aria-label={isActive ? 'Пауза' : 'Відтворити'}
          tabIndex={-1}
        >
          {isActive ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          )}
        </button>

        <div className="absolute left-2 top-2 flex gap-1.5 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <button
            type="button"
            onClick={() => toggleFavorite(track.id)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65 active:scale-90',
              isFavorite && 'text-rose-400',
            )}
            aria-label={isFavorite ? 'Видалити з улюблених' : 'Додати до улюблених'}
            aria-pressed={isFavorite}
          >
            <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
          </button>
          <button
            type="button"
            onClick={() => openAddToPlaylist(track)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65 active:scale-90"
            aria-label="Додати до плейлиста"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-w-0 px-0.5 pb-0.5 pt-2.5">
        <button
          type="button"
          onClick={handlePlay}
          className="block w-full truncate text-left text-[13px] font-bold text-ink transition hover:text-accent"
          title={track.title}
        >
          {track.title}
        </button>
        {showArtist ? (
          <p className="mt-0.5 truncate text-[11px] text-muted" title={track.artist}>
            {track.artist}
          </p>
        ) : null}
        <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-medium text-muted/80">
          <span className="truncate">{track.genre}</span>
          <span className="tabular-nums">{formatTime(track.duration)}</span>
        </div>
      </div>
    </article>
  );
}
