import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import Slider from '../ui/Slider';

export default function VolumeControl({ className, alwaysVisible = false }) {
  const { volume, muted, setVolume, toggleMute } = useApp();
  const effectiveVolume = muted ? 0 : volume;
  const Icon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={toggleMute}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-elevated hover:text-ink active:scale-90"
        aria-label={muted ? 'Увімкнути звук' : 'Вимкнути звук'}
        title={muted ? 'Увімкнути звук (M)' : 'Вимкнути звук (M)'}
      >
        <Icon className="h-[18px] w-[18px]" />
      </button>
      <Slider
        value={effectiveVolume}
        max={1}
        step={0.01}
        onChange={setVolume}
        ariaLabel="Гучність"
        className={cn(
          'w-20 transition-opacity duration-200',
          alwaysVisible ? 'opacity-100' : 'opacity-0 group-hover/volume:opacity-100 focus-within:opacity-100',
        )}
      />
    </div>
  );
}
