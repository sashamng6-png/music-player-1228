import { cn } from '../../lib/utils';

/** Range input styled with the app accent, used for seek + volume. */
export default function Slider({
  value,
  max = 100,
  min = 0,
  step = 0.1,
  onChange,
  disabled = false,
  className,
  ariaLabel,
  onPointerDown,
  onPointerUp,
}) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1;
  const safeValue = Math.min(Math.max(Number(value) || 0, min), safeMax);
  const percent = ((safeValue - min) / (safeMax - min)) * 100;

  return (
    <input
      type="range"
      min={min}
      max={safeMax}
      step={step}
      value={safeValue}
      disabled={disabled}
      onChange={(event) => onChange?.(Number(event.target.value))}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      aria-label={ariaLabel}
      style={{ '--value': `${percent}%` }}
      className={cn('slider select-none disabled:cursor-not-allowed disabled:opacity-50', className)}
    />
  );
}
