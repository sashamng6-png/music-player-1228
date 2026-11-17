import { Loader2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';

/**
 * Shared transport controls used in the docked player and the "Now playing" panel.
 */
export default function PlaybackControls({ size = 'md', className }) {
  const {
    isPlaying,
    buffering,
    togglePlay,
    next,
    prev,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    currentTrack,
  } = useApp();

  const large = size === 'lg';
  const iconSize = large ? 'h-5 w-5' : 'h-[17px] w-[17px]';
  const minorSize = large ? 'h-11 w-11' : 'h-9 w-9';
  const skipSize = large ? 'h-12 w-12' : 'h-10 w-10';
  const playSize = large ? 'h-[68px] w-[68px]' : 'h-[46px] w-[46px]';

  return (
    <div className={cn('flex items-center justify-center gap-1 sm:gap-2.5', className)}>
      <button
        type="button"
        onClick={toggleShuffle}
        className={cn(
          'relative flex items-center justify-center rounded-full transition-colors duration-200 hover:bg-elevated',
          minorSize,
          shuffle ? 'text-accent' : 'text-muted hover:text-ink',
        )}
        aria-label={shuffle ? 'Вимкнути випадкове відтворення' : 'Увімкнути випадкове відтворення'}
        aria-pressed={shuffle}
        title={shuffle ? 'Shuffle увімкнено' : 'Shuffle'}
      >
        <Shuffle className={iconSize} />
        {shuffle ? (
          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" aria-hidden />
        ) : null}
      </button>

      <button
        type="button"
        onClick={prev}
        className={cn(
          'flex items-center justify-center rounded-full text-ink transition-all duration-200 hover:bg-elevated active:scale-90 disabled:opacity-35',
          skipSize,
        )}
        aria-label="Попередній трек"
        title="Попередній трек (←)"
        disabled={!currentTrack}
      >
        <SkipBack className={cn(large ? 'h-6 w-6' : 'h-[21px] w-[21px]', 'fill-current')} />
      </button>

      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          'relative flex items-center justify-center rounded-full bg-accent text-[rgb(var(--accent-contrast))] shadow-glow transition-all duration-200 hover:scale-[1.04] hover:brightness-110 active:scale-95',
          playSize,
        )}
        aria-label={isPlaying ? 'Пауза' : 'Відтворити'}
        title={isPlaying ? 'Пауза (Space)' : 'Відтворити (Space)'}
      >
        {buffering ? (
          <Loader2 className={cn('animate-spin', large ? 'h-7 w-7' : 'h-5 w-5')} />
        ) : isPlaying ? (
          <Pause className={cn(large ? 'h-7 w-7' : 'h-5 w-5', 'fill-current')} />
        ) : (
          <Play
            className={cn(
              large ? 'ml-0.5 h-7 w-7' : 'ml-0.5 h-5 w-5',
              'fill-current',
            )}
          />
        )}
      </button>

      <button
        type="button"
        onClick={() => next()}
        className={cn(
          'flex items-center justify-center rounded-full text-ink transition-all duration-200 hover:bg-elevated active:scale-90 disabled:opacity-35',
          skipSize,
        )}
        aria-label="Наступний трек"
        title="Наступний трек (→)"
        disabled={!currentTrack}
      >
        <SkipForward className={cn(large ? 'h-6 w-6' : 'h-[21px] w-[21px]', 'fill-current')} />
      </button>

      <button
        type="button"
        onClick={cycleRepeat}
        className={cn(
          'relative flex items-center justify-center rounded-full transition-colors duration-200 hover:bg-elevated',
          minorSize,
          repeat !== 'off' ? 'text-accent' : 'text-muted hover:text-ink',
        )}
        aria-label={
          repeat === 'one'
            ? 'Повтор одного треку — змінити'
            : repeat === 'all'
              ? 'Повтор усієї черги — вимкнути'
              : 'Увімкнути повтор'
        }
        title={
          repeat === 'one'
            ? 'Повтор треку'
            : repeat === 'all'
              ? 'Повтор черги'
              : 'Повтор'
        }
      >
        {repeat === 'one' ? <Repeat1 className={iconSize} /> : <Repeat className={iconSize} />}
        {repeat !== 'off' ? (
          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" aria-hidden />
        ) : null}
      </button>
    </div>
  );
}
