import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, History, Play, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatClock, formatRelativeDate, pluralTracks } from '../lib/utils';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TrackRow from '../components/tracks/TrackRow';

export default function HistoryPage() {
  const { historyEntries, clearHistory, playCollection, demoTracks } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);

  const tracks = historyEntries.map((entry) => entry.track);
  const contextIds = tracks.map((track) => track.id);

  const groups = useMemo(() => {
    const map = new Map();
    historyEntries.forEach((entry) => {
      const key = formatRelativeDate(entry.playedAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(entry);
    });
    return [...map.entries()];
  }, [historyEntries]);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] border border-line/60 bg-gradient-to-br from-accent/15 via-surface to-accent2/15 p-5 sm:p-7">
        <div
          className="absolute -left-10 -top-20 h-60 w-60 rounded-full bg-accent/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-line/60 bg-surface/70 shadow-xl sm:h-32 sm:w-32">
            <Clock3 className="h-10 w-10 text-accent sm:h-14 sm:w-14" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
              Ваш музичний шлях
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Історія
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {pluralTracks(historyEntries.length)}
              {historyEntries.length ? ' · останні прослуховування' : ''}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => playCollection(tracks)}
                disabled={!tracks.length}
              >
                <Play className="h-4 w-4 fill-current" />
                Відтворити все
              </button>
              {historyEntries.length ? (
                <button
                  type="button"
                  className="btn-secondary text-rose-400"
                  onClick={() => setConfirmClear(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Очистити історію
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {historyEntries.length ? (
        <div className="space-y-5">
          {groups.map(([label, entries]) => (
            <section key={label}>
              <div className="mb-1.5 flex items-center gap-2 px-1">
                <History className="h-3.5 w-3.5 text-muted" />
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">
                  {label}
                </h2>
                <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[9px] font-bold text-muted">
                  {entries.length}
                </span>
              </div>
              <div className="panel p-1.5 sm:p-2">
                <div className="space-y-0.5">
                  {entries.map((entry, index) => (
                    <TrackRow
                      key={`${entry.trackId}-${entry.playedAt}`}
                      track={entry.track}
                      index={index}
                      contextIds={contextIds}
                      rightMeta={formatClock(entry.playedAt)}
                      showAlbum
                    />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Історія поки що порожня"
          description="Увімкніть будь-який трек — і тут з’явиться список нещодавно прослуханих композицій."
          action={
            <>
              <button
                type="button"
                className="btn-primary"
                onClick={() => playCollection(demoTracks)}
              >
                <Play className="h-4 w-4 fill-current" />
                Почати слухати
              </button>
              <Link to="/library" className="btn-secondary">
                До бібліотеки
              </Link>
            </>
          }
        />
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Очистити історію?"
        description="Список нещодавно прослуханих треків буде видалено. Улюблене та плейлисти залишаться без змін."
        confirmLabel="Очистити історію"
        danger={false}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          clearHistory();
        }}
      />
    </div>
  );
}
