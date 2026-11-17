import { AlertTriangle, ExternalLink } from 'lucide-react';

export default function SetupNotice({ title = 'Спільнота ще не підключена' }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.08] p-4 sm:flex-row sm:items-start sm:gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div className="min-w-0 text-xs leading-relaxed text-muted">
        <p className="text-sm font-bold text-ink">{title}</p>
        <p className="mt-1">
          Додайте у файл <code className="rounded bg-elevated px-1 py-0.5 text-ink">.env</code>{' '}
          змінні <code className="rounded bg-elevated px-1 py-0.5 text-ink">VITE_SUPABASE_URL</code>{' '}
          та{' '}
          <code className="rounded bg-elevated px-1 py-0.5 text-ink">VITE_SUPABASE_ANON_KEY</code>,
          виконайте <code className="rounded bg-elevated px-1 py-0.5 text-ink">supabase/schema.sql</code>{' '}
          у SQL Editor і перезапустіть застосунок. Локальний плеєр і «Моя музика» працюють і без
          цього.
        </p>
        <a
          href="https://supabase.com/dashboard/project/kjwwsretcsgwvgtjgqah/settings/api"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-bold text-accent hover:underline"
        >
          Отримати ключі в Supabase Dashboard
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
