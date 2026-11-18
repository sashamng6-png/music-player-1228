import {
  AlertTriangle,
  Heart,
  ListMusic,
  Maximize2,
  Music2,
  Plus,
  RefreshCw,
  SkipForward,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import CoverArt from '../ui/CoverArt';
import Visualizer from '../ui/Visualizer';
import ProgressBar from './ProgressBar';
import PlaybackControls from './PlaybackControls';
import VolumeControl from './VolumeControl';

export default function PlayerBar() {
  const {
    currentTrack,
    favorites,
    toggleFavorite,
    openAddToPlaylist,
    setNowPlayingOpen,
    playbackError,
    retryPlayback,
    next,
    settings,
  } = useApp();

  const isFavorite = currentTrack ? favorites.includes(currentTrack.id) : false;
  const compact = settings.playerSize === 'compact';

  return (
    <div className="fixed inset-x-0 bottom-[var(--tabbar-height)] z-50">
      {playbackError ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-full flex justify-center px-2 pb-2 sm:px-5">
          <div
            role="alert"
            className="pointer-events-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-rose-500/30 bg-surface/95 p-3 shadow-2xl backdrop-blur-xl animate-slide-up sm:flex-row sm:items-center sm:gap-3 sm:px-4"
          >
            <AlertTriangle className="hidden h-5 w-5 shrink-0 text-rose-400 sm:block" />
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-ink sm:text-[13px]">
              {playbackError.message}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={retryPlayback}>
                <RefreshCw className="h-3.5 w-3.5" />
                Повторити
              </button>
              <button type="button" className="btn-primary px-3 py-1.5 text-xs" onClick={() => next()}>
                Наступний
                <SkipForward className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="player-bar-shell glass-bar border-t shadow-[0_-16px_40px_-24px_rgba(0,0,0,0.55)]">
        {/* desktop / tablet */}
        <div
          className={cn(
            'mx-auto hidden max-w-[1700px] grid-cols-[minmax(0,1fr)_minmax(340px,1.55fr)_minmax(0,1fr)] items-center gap-4 px-5 md:grid',
            compact ? 'h-[80px]' : 'h-[96px]',
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => currentTrack && setNowPlayingOpen(true)}
              className="relative shrink-0 rounded-xl"
              aria-label={currentTrack ? 'Відкрити екран «Зараз грає»' : 'Обрати трек'}
              title={currentTrack ? 'Зараз грає' : undefined}
              disabled={!currentTrack}
            >
              <CoverArt
                src={currentTrack?.cover}
                alt={currentTrack?.album || ''}
                rounded="rounded-xl"
                className={cn(
                  'cover-shadow transition-all duration-300',
                  compact ? 'h-12 w-12' : 'h-14 w-14',
                  currentTrack && 'playing-glow',
                )}
              />
              {currentTrack ? (
                <span
                  className={cn(
                    'absolute -inset-1 -z-10 rounded-2xl bg-accent/25 opacity-0 blur-md transition-opacity',
                    isFavorite && 'opacity-100',
                  )}
                />
              ) : null}
            </button>

            <div className="min-w-0 flex-1">
              {currentTrack ? (
                <>
                  <p className="truncate text-sm font-bold text-ink" title={currentTrack.title}>
                    {currentTrack.title}
                  </p>
                  <p className="truncate text-xs text-muted" title={currentTrack.artist}>
                    {currentTrack.artist} <span className="opacity-50">·</span>{' '}
                    <span className="hidden lg:inline">{currentTrack.album}</span>
                    <span className="lg:hidden">{currentTrack.genre}</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-ink">Обери трек</p>
                  <p className="truncate text-xs text-muted">Бібліотека вже готова до прослуховування</p>
                </>
              )}
            </div>

            {currentTrack ? (
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => toggleFavorite(currentTrack.id)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full transition-all hover:bg-elevated active:scale-90',
                    isFavorite ? 'text-rose-400' : 'text-muted hover:text-ink',
                  )}
                  aria-label={isFavorite ? 'Видалити з улюблених' : 'Додати до улюблених'}
                  aria-pressed={isFavorite}
                  title={isFavorite ? 'Видалити з улюблених (F)' : 'Додати до улюблених (F)'}
                >
                  <Heart className={cn('h-[18px] w-[18px]', isFavorite && 'fill-current')} />
                </button>
                <button
                  type="button"
                  onClick={() => openAddToPlaylist(currentTrack)}
                  className="hidden h-9 w-9 items-center justify-center rounded-full text-muted transition-all hover:bg-elevated hover:text-ink active:scale-90 lg:flex"
                  aria-label="Додати до плейлиста"
                  title="Додати до плейлиста"
                >
                  <Plus className="h-[18px] w-[18px]" />
                </button>
              </div>
            ) : (
              <Music2 className="hidden h-5 w-5 text-muted/40 sm:block" aria-hidden />
            )}
          </div>

          <div className="flex min-w-0 flex-col items-center gap-1">
            <PlaybackControls />
            <ProgressBar />
          </div>

          <div className="flex items-center justify-end gap-2">
            {settings.showVisualizer && !compact ? (
              <div className="hidden h-8 w-16 lg:block xl:w-24">
                <Visualizer compact bars={20} />
              </div>
            ) : null}
            <div className="group/volume flex items-center">
              <VolumeControl alwaysVisible />
            </div>
            <button
              type="button"
              onClick={() => setNowPlayingOpen(true)}
              className="icon-btn"
              aria-label="Відкрити чергу та візуалізатор"
              title="Черга та візуалізатор"
            >
              <ListMusic className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => setNowPlayingOpen(true)}
              className="icon-btn hidden xl:inline-flex"
              aria-label="Розгорнути плеєр"
              title="Розгорнути плеєр"
            >
              <Maximize2 className="h-[17px] w-[17px]" />
            </button>
          </div>
        </div>

        {/* mobile */}
        <div className="flex flex-col gap-1 px-3 pb-2 pt-2 md:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => currentTrack && setNowPlayingOpen(true)}
              className="relative shrink-0"
              aria-label={currentTrack ? 'Відкрити екран «Зараз грає»' : 'Обрати трек'}
              disabled={!currentTrack}
            >
              <CoverArt
                src={currentTrack?.cover}
                alt={currentTrack?.album || ''}
                className="h-10 w-10 cover-shadow"
                rounded="rounded-lg"
              />
              {currentTrack ? (
                <span className="absolute -inset-0.5 -z-10 rounded-xl bg-accent/25 blur" aria-hidden />
              ) : null}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-ink">
                {currentTrack?.title || 'Обери трек'}
              </p>
              <p className="truncate text-[11px] text-muted">
                {currentTrack ? `${currentTrack.artist} · ${currentTrack.album}` : 'Music Player 1228 готова до музики'}
              </p>
            </div>
            {currentTrack ? (
              <button
                type="button"
                onClick={() => toggleFavorite(currentTrack.id)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full transition active:scale-90',
                  isFavorite ? 'text-rose-400' : 'text-muted',
                )}
                aria-label={isFavorite ? 'Видалити з улюблених' : 'Додати до улюблених'}
                aria-pressed={isFavorite}
              >
                <Heart className={cn('h-[18px] w-[18px]', isFavorite && 'fill-current')} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => currentTrack && setNowPlayingOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition active:scale-90"
              aria-label="Розгорнути плеєр"
              disabled={!currentTrack}
            >
              <Maximize2 className="h-[17px] w-[17px]" />
            </button>
          </div>

          <PlaybackControls className="gap-2.5" />

          <div className="flex items-center gap-2">
            <ProgressBar />
          </div>
        </div>
      </div>
    </div>
  );
}
