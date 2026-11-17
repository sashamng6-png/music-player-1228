import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ChevronDown,
  Heart,
  ListMusic,
  Plus,
  RefreshCw,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn, formatTime } from '../../lib/utils';
import CoverArt from '../ui/CoverArt';
import Visualizer from '../ui/Visualizer';
import Logo from '../layout/Logo';
import ProgressBar from './ProgressBar';
import PlaybackControls from './PlaybackControls';
import VolumeControl from './VolumeControl';

function MiniBars({ playing }) {
  return (
    <span className="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
      {[0, 1, 2, 3].map((bar) => (
        <span
          key={bar}
          className="w-[2px] rounded-full bg-accent"
          style={{
            height: `${[8, 13, 6, 11][bar]}px`,
            transformOrigin: 'bottom',
            animation: playing
              ? `equalize ${620 + bar * 120}ms ease-in-out ${bar * 90}ms infinite`
              : 'none',
            transform: playing ? undefined : 'scaleY(0.4)',
          }}
        />
      ))}
    </span>
  );
}

export default function NowPlayingPanel() {
  const {
    nowPlayingOpen,
    setNowPlayingOpen,
    currentTrack,
    isPlaying,
    favorites,
    toggleFavorite,
    openAddToPlaylist,
    queueTracks,
    playTrack,
    playbackError,
    retryPlayback,
    next,
    settings,
  } = useApp();
  const closeRef = useRef(null);
  const open = nowPlayingOpen && Boolean(currentTrack);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') setNowPlayingOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setNowPlayingOpen]);

  if (!open) return null;

  const isFavorite = favorites.includes(currentTrack.id);
  const currentIndex = queueTracks.findIndex((track) => track.id === currentTrack.id);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[rgb(var(--bg))] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Зараз грає"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <img
          src={currentTrack.cover}
          alt=""
          className="h-full w-full scale-125 object-cover opacity-30 blur-[90px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--bg))]/60 via-[rgb(var(--bg))]/85 to-[rgb(var(--bg))]" />
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-line/30 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo compact onClick={() => setNowPlayingOpen(false)} />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">
              Зараз грає
            </p>
            <p className="max-w-[42vw] truncate text-xs font-semibold text-ink sm:max-w-none">
              {currentTrack.album}
            </p>
          </div>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={() => setNowPlayingOpen(false)}
          className="icon-btn border border-line/60 bg-surface/60"
          aria-label="Закрити екран «Зараз грає»"
          title="Закрити (Esc)"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {playbackError ? (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 rounded-2xl border border-rose-500/30 bg-surface/80 p-4 backdrop-blur sm:flex-row sm:items-center"
            >
              <AlertTriangle className="hidden h-5 w-5 shrink-0 text-rose-400 sm:block" />
              <p className="flex-1 text-xs leading-relaxed text-ink">{playbackError.message}</p>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={retryPlayback}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Повторити
                </button>
                <button type="button" className="btn-primary px-3 py-1.5 text-xs" onClick={() => next()}>
                  Далі
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-center lg:gap-12">
            <div className="mx-auto w-full max-w-[360px]">
              <div className="relative aspect-square w-full">
                <div
                  className="absolute inset-8 rounded-full bg-gradient-to-br from-accent/35 via-accent2/25 to-transparent blur-3xl"
                  aria-hidden="true"
                />
                <div
                  className={cn(
                    'absolute right-0 top-1/2 h-[82%] w-[82%] -translate-y-1/2 rounded-full border border-white/10 bg-[#060709] p-[9%] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.9)]',
                    isPlaying ? 'animate-spin-slow' : 'animate-spin-slow cover-paused',
                  )}
                  style={{
                    backgroundImage:
                      'repeating-radial-gradient(circle at center, rgba(255,255,255,0.10) 0 1px, transparent 1px 8px)',
                  }}
                  aria-hidden="true"
                >
                  <div className="h-full w-full overflow-hidden rounded-full opacity-70">
                    <img src={currentTrack.cover} alt="" className="h-full w-full object-cover" />
                  </div>
                  <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(var(--bg))] ring-2 ring-white/20" />
                </div>
                <div
                  className={cn(
                    'playing-glow absolute left-0 top-0 z-10 aspect-square w-[86%]',
                    isPlaying && 'is-playing',
                  )}
                >
                  <CoverArt
                    src={currentTrack.cover}
                    alt={currentTrack.album}
                    rounded="rounded-3xl"
                    className="h-full w-full border border-white/10 cover-shadow"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-3xl bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-10">
                    <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/70">
                      <Sparkles className="h-3 w-3" />
                      Music Player 1228 original
                    </p>
                  </div>
                </div>
              </div>

              {settings.showVisualizer ? (
                <div className="mt-6 hidden h-14 w-full lg:block" aria-hidden="true">
                  <Visualizer bars={38} />
                </div>
              ) : null}
            </div>

            <div className="min-w-0 text-center lg:text-left">
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-accent">
                  {currentTrack.genre}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {currentTrack.album} · {currentTrack.year || '2026'}
                </span>
              </div>
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-[42px]">
                {currentTrack.title}
              </h1>
              <p className="mt-2 text-base font-semibold text-muted sm:text-lg">
                {currentTrack.artist}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <button
                  type="button"
                  onClick={() => toggleFavorite(currentTrack.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition active:scale-95',
                    isFavorite
                      ? 'border-rose-400/40 bg-rose-500/10 text-rose-400'
                      : 'border-line bg-surface/60 text-muted hover:border-rose-400/30 hover:text-ink',
                  )}
                  aria-pressed={isFavorite}
                >
                  <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
                  {isFavorite ? 'В улюбленому' : 'В улюблене'}
                </button>
                <button
                  type="button"
                  onClick={() => openAddToPlaylist(currentTrack)}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-4 py-2 text-xs font-bold text-muted transition hover:border-accent/30 hover:text-ink active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  До плейлиста
                </button>
                {currentTrack.isLocal ? (
                  <span className="rounded-full bg-elevated px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-muted">
                    Локальний файл
                  </span>
                ) : null}
              </div>

              <div className="mt-7">
                <ProgressBar size="lg" />
              </div>

              <div className="mt-4">
                <PlaybackControls size="lg" />
              </div>

              <div className="mt-5 flex items-center justify-center gap-4 lg:justify-start">
                <div className="group/volume flex items-center">
                  <VolumeControl alwaysVisible />
                </div>
                {isPlaying ? (
                  <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    <MiniBars playing />
                    Відтворюється
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Пауза
                  </span>
                )}
              </div>
            </div>
          </div>

          <section className="mt-9 overflow-hidden rounded-3xl border border-line/60 bg-surface/55 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-line/50 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <ListMusic className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-bold text-ink">Черга відтворення</h2>
                <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-bold text-muted">
                  {queueTracks.length}
                </span>
              </div>
              <span className="hidden text-[10px] uppercase tracking-wide text-muted sm:block">
                {currentIndex >= 0 ? `Трек ${currentIndex + 1} з ${queueTracks.length}` : 'Готово'}
              </span>
            </div>

            <div className="max-h-[42vh] overflow-y-auto p-2">
              {queueTracks.map((track, index) => {
                const isCurrent = track.id === currentTrack.id;
                return (
                  <button
                    key={`${track.id}-${index}`}
                    type="button"
                    onClick={() => playTrack(track.id, queueTracks.map((item) => item.id))}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-elevated/70',
                      isCurrent && 'bg-accent/[0.08]',
                    )}
                  >
                    <span className="flex w-5 shrink-0 items-center justify-center text-[10px] tabular-nums text-muted">
                      {isCurrent ? <MiniBars playing={isPlaying} /> : index + 1}
                    </span>
                    <CoverArt
                      src={track.cover}
                      alt={track.album}
                      className="h-9 w-9"
                      rounded="rounded-md"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-[13px] font-semibold',
                          isCurrent ? 'text-accent' : 'text-ink',
                        )}
                      >
                        {track.title}
                      </span>
                      <span className="block truncate text-[11px] text-muted">{track.artist}</span>
                    </span>
                    <span className="hidden shrink-0 text-[10px] text-muted sm:block">
                      {track.genre}
                    </span>
                    <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-muted">
                      {formatTime(track.duration)}
                    </span>
                  </button>
                );
              })}
              {!queueTracks.length ? (
                <p className="px-4 py-6 text-center text-xs text-muted">Черга порожня.</p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
