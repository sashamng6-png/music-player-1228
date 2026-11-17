import { Link } from 'react-router-dom';
import { AudioWaveform } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Logo({ compact = false, className, onClick }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className={cn('group flex items-center gap-2.5', className)}
      aria-label="MusicFlow — на головну"
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-accent2 text-[rgb(var(--accent-contrast))] shadow-glow transition-transform duration-300 group-hover:scale-105">
        <AudioWaveform className="h-5 w-5" strokeWidth={2.4} />
        <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      {!compact ? (
        <span className="min-w-0">
          <span className="block font-display text-[15px] font-bold leading-tight tracking-tight text-ink">
            Music<span className="text-gradient">Flow</span>
          </span>
          <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
            modern player
          </span>
        </span>
      ) : null}
    </Link>
  );
}
