import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const TONES = {
  success: 'text-emerald-400',
  error: 'text-rose-400',
  info: 'text-accent',
};

export default function Toasts() {
  const { toasts, dismissToast } = useApp();

  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed right-3 top-3 z-[120] flex w-[min(92vw,380px)] flex-col gap-2 sm:right-5 sm:top-5"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-line/80 bg-surface/95 p-3.5 pl-4 shadow-2xl backdrop-blur-xl animate-slide-in-right"
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', TONES[toast.type] || TONES.info)} />
            <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-full p-1 text-muted transition hover:bg-elevated hover:text-ink"
              aria-label="Закрити повідомлення"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
