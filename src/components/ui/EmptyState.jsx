import { Music2, Headphones, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Original CSS/SVG-inspired vinyl illustration (no external images). */
export function VinylIllustration({ className }) {
  return (
    <div className={cn('relative h-44 w-44 shrink-0 sm:h-52 sm:w-52', className)} aria-hidden="true">
      <div className="absolute inset-6 rounded-full bg-gradient-to-br from-accent via-accent2 to-accent opacity-40 blur-2xl" />
      <div className="absolute inset-0 animate-spin-slow rounded-full bg-[#08090d] p-[10%] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)]">
        <div
          className="relative h-full w-full rounded-full border border-white/10"
          style={{
            backgroundImage:
              'repeating-radial-gradient(circle at center, rgba(255,255,255,0.09) 0 1px, transparent 1px 7px)',
          }}
        >
          <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-accent to-accent2 shadow-[inset_0_0_20px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-[41%] rounded-full bg-[#08090d]" />
            <Music2 className="absolute left-1/2 top-[18%] h-5 w-5 -translate-x-1/2 text-black/60" />
          </div>
          <span className="absolute left-[18%] top-[22%] h-1.5 w-1.5 rounded-full bg-white/40" />
        </div>
      </div>
      <div className="absolute -right-2 top-3 flex h-12 w-12 animate-float items-center justify-center rounded-2xl border border-line/60 bg-surface/90 text-accent shadow-xl backdrop-blur">
        <Headphones className="h-6 w-6" />
      </div>
      <div
        className="absolute -left-1 bottom-6 flex h-10 w-10 animate-float items-center justify-center rounded-xl border border-line/60 bg-surface/90 text-accent2 shadow-lg backdrop-blur"
        style={{ animationDelay: '1.2s' }}
      >
        <Music2 className="h-5 w-5" />
      </div>
      <Sparkles className="absolute bottom-0 right-2 h-5 w-5 text-accent/70" />
    </div>
  );
}

/**
 * Consistent empty state with the app's signature illustration.
 */
export default function EmptyState({
  title = 'Твоя музика — твій настрій.',
  description = 'Знайди улюблені треки та створи власний плейлист',
  action = null,
  compact = false,
  className,
  illustration = true,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-line/70 bg-surface/40 px-6 text-center',
        compact ? 'py-10' : 'py-12 sm:py-16',
        className,
      )}
    >
      {illustration ? <VinylIllustration className={compact ? 'h-36 w-36 sm:h-40 sm:w-40' : ''} /> : null}
      <div className="max-w-md space-y-2">
        <h3 className="font-display text-lg font-bold text-ink sm:text-xl">{title}</h3>
        <p className="text-sm leading-relaxed text-muted">{description}</p>
      </div>
      {action ? <div className="flex flex-wrap items-center justify-center gap-3">{action}</div> : null}
    </div>
  );
}
