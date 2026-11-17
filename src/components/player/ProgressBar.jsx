import { useApp } from '../../context/AppContext';
import { formatTime } from '../../lib/utils';
import Slider from '../ui/Slider';

export default function ProgressBar({ showTimes = true, size = 'md', className }) {
  const { currentTime, duration, currentTrack, seekTo } = useApp();
  const max = Math.max(duration || currentTrack?.duration || 0, 0);
  const timeClass =
    size === 'lg'
      ? 'w-11 text-xs'
      : 'w-9 text-[10px] sm:text-[11px]';

  return (
    <div className={`flex w-full items-center gap-2 ${className || ''}`}>
      {showTimes ? (
        <span className={`${timeClass} shrink-0 text-right tabular-nums text-muted`}>
          {formatTime(currentTime)}
        </span>
      ) : null}
      <Slider
        value={currentTime}
        max={max}
        step={0.1}
        onChange={seekTo}
        disabled={!currentTrack || max <= 0}
        ariaLabel="Позиція відтворення"
        className="min-w-0 flex-1"
      />
      {showTimes ? (
        <span className={`${timeClass} shrink-0 tabular-nums text-muted`}>
          {formatTime(max)}
        </span>
      ) : null}
    </div>
  );
}
