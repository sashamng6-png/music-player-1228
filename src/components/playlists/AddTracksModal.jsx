import { useMemo, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn, formatTime } from '../../lib/utils';
import Modal from '../ui/Modal';
import CoverArt from '../ui/CoverArt';

/** Track picker used on a playlist detail page. */
export default function AddTracksModal({ open, onClose, playlist }) {
  const {
    allTracks,
    playlists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  } = useApp();
  const [query, setQuery] = useState('');

  const livePlaylist = playlists.find((item) => item.id === playlist?.id) || playlist;
  const selectedIds = livePlaylist?.trackIds || [];

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return allTracks.filter((track) => {
      if (!normalized) return true;
      return (
        track.title.toLowerCase().includes(normalized) ||
        track.artist.toLowerCase().includes(normalized) ||
        track.album.toLowerCase().includes(normalized)
      );
    });
  }, [allTracks, query]);

  if (!livePlaylist) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Додати треки"
      description={`Оберіть композиції для «${livePlaylist.name}»`}
      icon={<Plus className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">
            У плейлисті: <strong className="text-ink">{selectedIds.length}</strong>
          </span>
          <button type="button" className="btn-primary" onClick={onClose}>
            Готово
          </button>
        </div>
      }
    >
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="field pl-9 pr-9"
          placeholder="Пошук у бібліотеці..."
          aria-label="Пошук треків"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:text-ink"
            aria-label="Очистити пошук"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="space-y-1">
        {filtered.map((track) => {
          const selected = selectedIds.includes(track.id);
          return (
            <div
              key={track.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-2 py-1.5 transition',
                selected ? 'border-accent/30 bg-accent/[0.06]' : 'border-transparent hover:bg-elevated/60',
              )}
            >
              <CoverArt
                src={track.cover}
                alt={track.album}
                className="h-10 w-10"
                rounded="rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{track.title}</p>
                <p className="truncate text-xs text-muted">
                  {track.artist} · {track.genre}
                </p>
              </div>
              <span className="hidden text-[11px] tabular-nums text-muted sm:block">
                {formatTime(track.duration)}
              </span>
              <button
                type="button"
                onClick={() =>
                  selected
                    ? removeTrackFromPlaylist(livePlaylist.id, track.id)
                    : addTrackToPlaylist(livePlaylist.id, track.id)
                }
                className={cn(
                  'flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition active:scale-95',
                  selected
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-line text-muted hover:border-accent/40 hover:text-ink',
                )}
                aria-pressed={selected}
              >
                {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {selected ? 'Додано' : 'Додати'}
              </button>
            </div>
          );
        })}
        {!filtered.length ? (
          <div className="rounded-xl border border-dashed border-line/60 py-8 text-center text-sm text-muted">
            Нічого не знайдено. Спробуйте інший запит.
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
