import { Heart, Pause, Play, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn, formatDate, formatTime } from '../../lib/utils';
import CoverArt from '../ui/CoverArt';

function Equalizer({ playing }) {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3].map((bar) => (
        <span
          key={bar}
          className="w-[2.5px] rounded-full bg-accent"
          style={{
            height: `${[10, 16, 7, 13][bar]}px`,
            transformOrigin: 'bottom',
            animation: playing
              ? `equalize ${600 + bar * 130}ms ease-in-out ${bar * 90}ms infinite`
              : 'none',
            transform: playing ? undefined : `scaleY(${0.45 + bar * 0.12})`,
          }}
        />
      ))}
    </span>
  );
}

export default function TrackRow({
  track,
  index,
  contextIds,
  showAlbum = true,
  showGenre = true,
  showDate = false,
  rightMeta = null,
  onRemove = null,
  removeLabel = 'Видалити з плейлиста',
  onDeleteLocal = null,
  className,
}) {
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
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors duration-200 hover:bg-elevated/70 sm:gap-3 sm:px-3',
        isCurrent && 'bg-accent/[0.07] hover:bg-accent/[0.1]',
        className,
      )}
      onClick={handlePlay}
    >
      <div className="hidden w-6 shrink-0 items-center justify-center text-[11px] font-semibold tabular-nums text-muted sm:flex">
        {isCurrent ? (
          <Equalizer playing={isActive} />
        ) : (
          <span className="group-hover:hidden">{(index ?? 0) + 1}</span>
        )}
        {!isCurrent ? (
          <Play className="hidden h-3 w-3 fill-current text-ink group-hover:block" aria-hidden />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative">
          <CoverArt
            src={track.cover}
            alt={track.album}
            rounded="rounded-lg"
            className="h-11 w-11 cover-shadow"
          />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handlePlay();
            }}
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-lg bg-black/55 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100',
              isCurrent && 'opacity-100',
            )}
            aria-label={isActive ? `Пауза: ${track.title}` : `Відтворити: ${track.title}`}
          >
            {isActive ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-[13px] font-semibold sm:text-sm',
              isCurrent ? 'text-accent' : 'text-ink',
            )}
            title={track.title}
          >
            {track.title}
          </p>
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[11px] text-muted sm:text-xs" title={track.artist}>
              {track.artist}
            </p>
            {track.isLocal ? (
              <span className="hidden shrink-0 rounded-md bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent sm:inline">
                локальний
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {showAlbum ? (
        <p className="hidden w-[16%] min-w-0 truncate text-xs text-muted md:block" title={track.album}>
          {track.album}
        </p>
      ) : null}

      {showGenre ? (
        <div className="hidden w-[108px] shrink-0 lg:block">
          <span className="inline-flex max-w-full truncate rounded-full border border-line/60 px-2 py-0.5 text-[10px] font-semibold text-muted">
            {track.genre}
          </span>
        </div>
      ) : null}

      {showDate ? (
        <div className="hidden w-[100px] shrink-0 text-[11px] text-muted xl:block">
          {formatDate(track.addedAt)}
        </div>
      ) : null}

      {rightMeta ? (
        <div className="hidden w-[96px] shrink-0 text-[11px] leading-tight text-muted xl:block">
          {rightMeta}
        </div>
      ) : null}

      <div
        className="flex shrink-0 items-center gap-0.5"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => toggleFavorite(track.id)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-surface active:scale-90',
            isFavorite
              ? 'text-rose-400 opacity-100'
              : 'text-muted opacity-100 hover:text-ink sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100',
          )}
          aria-label={isFavorite ? 'Видалити з улюблених' : 'Додати до улюблених'}
          aria-pressed={isFavorite}
          title={isFavorite ? 'Видалити з улюблених' : 'Додати до улюблених'}
        >
          <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
        </button>

        <button
          type="button"
          onClick={() => openAddToPlaylist(track)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted opacity-100 transition-all duration-200 hover:bg-surface hover:text-ink focus-visible:opacity-100 active:scale-90 sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Додати до плейлиста"
          title="Додати до плейлиста"
        >
          <Plus className="h-4 w-4" />
        </button>

        {onRemove ? (
          <button
            type="button"
            onClick={() => onRemove(track)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-all duration-200 hover:bg-surface hover:text-rose-400 active:scale-90"
            aria-label={removeLabel}
            title={removeLabel}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}

        {onDeleteLocal ? (
          <button
            type="button"
            onClick={() => onDeleteLocal(track)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-all duration-200 hover:bg-surface hover:text-rose-400 active:scale-90"
            aria-label="Видалити локальний файл"
            title="Видалити локальний файл"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="hidden w-9 shrink-0 text-right text-[11px] tabular-nums text-muted sm:block">
        {formatTime(track.duration)}
      </div>
    </div>
  );
}
