import { Heart, Pause, Play, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { cn, formatRelativeDate, formatTime } from '../../lib/utils';
import CoverArt from '../ui/CoverArt';

export default function CommunityTrackCard({ track, contextIds, className }) {
  const {
    playTrack,
    togglePlay,
    currentTrackId,
    isPlaying,
    favorites,
    toggleFavorite,
  } = useApp();

  if (!track) return null;
  const isCurrent = currentTrackId === track.id;
  const isActive = isCurrent && isPlaying;
  const isFavorite = favorites.includes(track.id);

  const handlePlay = () => {
    if (isCurrent) togglePlay();
    else playTrack(track.id, contextIds || [track.id]);
  };

  return (
    <article
      className={cn(
        'group flex min-w-0 flex-col rounded-2xl border border-transparent bg-surface/45 p-2.5 transition-all duration-300 hover:border-line/70 hover:bg-surface/80 hover:shadow-card',
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
            alt={track.title}
            rounded="rounded-xl"
            className="aspect-square w-full cover-shadow"
            imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <span className="absolute inset-x-0 bottom-0 h-16 rounded-b-xl bg-gradient-to-t from-black/60 to-transparent" aria-hidden="true" />
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

        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
          Спільнота
        </span>

        <button
          type="button"
          onClick={() => toggleFavorite(track.id)}
          className={cn(
            'absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65 active:scale-90',
            isFavorite && 'text-rose-400',
          )}
          aria-label={isFavorite ? 'Видалити з улюблених' : 'Додати до улюблених'}
          aria-pressed={isFavorite}
        >
          <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
        </button>
      </div>

      <div className="min-w-0 flex-1 px-0.5 pb-0.5 pt-2.5">
        <button
          type="button"
          onClick={handlePlay}
          className="block w-full truncate text-left text-[13px] font-bold text-ink transition hover:text-accent"
          title={track.title}
        >
          {track.title}
        </button>
        <p className="mt-0.5 truncate text-[11px] text-muted" title={track.artist}>
          {track.artist}
        </p>

        {track.description ? (
          <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-muted/80">
            {track.description}
          </p>
        ) : null}

        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-medium text-muted/80">
          <span className="truncate rounded-full border border-line/60 px-2 py-0.5 font-semibold">
            {track.genre}
          </span>
          <span className="shrink-0 tabular-nums">{formatTime(track.duration)}</span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-line/50 pt-2">
          <Link
            to={`/u/${track.userId}`}
            onClick={(event) => event.stopPropagation()}
            className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-muted transition hover:text-accent"
            title={`Профіль ${track.authorName || track.artist}`}
          >
            {track.authorAvatar ? (
              <img
                src={track.authorAvatar}
                alt=""
                className="h-5 w-5 shrink-0 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-elevated text-muted">
                <UserRound className="h-3 w-3" />
              </span>
            )}
            <span className="truncate">{track.authorName || track.artist}</span>
          </Link>
          <span className="shrink-0 text-[9px] text-muted/70">
            {formatRelativeDate(track.addedAt)}
          </span>
        </div>
      </div>
    </article>
  );
}
