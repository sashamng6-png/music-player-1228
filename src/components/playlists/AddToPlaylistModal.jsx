import { useState } from 'react';
import { Check, ListPlus, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import Modal from '../ui/Modal';
import CoverArt from '../ui/CoverArt';
import PlaylistMosaic from '../ui/PlaylistMosaic';

export default function AddToPlaylistModal() {
  const {
    addTarget,
    closeAddToPlaylist,
    playlists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    createPlaylist,
    resolvePlaylistTracks,
  } = useApp();
  const [name, setName] = useState('');

  const open = Boolean(addTarget);

  const handleCreate = (event) => {
    event.preventDefault();
    if (!addTarget) return;
    const created = createPlaylist(name, [addTarget.id]);
    if (created) setName('');
  };

  const handleClose = () => {
    setName('');
    closeAddToPlaylist();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Додати до плейлиста"
      description={addTarget ? `Оберіть добірку для «${addTarget.title}»` : undefined}
      icon={<ListPlus className="h-5 w-5" />}
      size="md"
      footer={
        <div className="flex justify-end">
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Готово
          </button>
        </div>
      }
    >
      {addTarget ? (
        <>
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line/60 bg-elevated/60 p-2.5">
            <CoverArt
              src={addTarget.cover}
              alt={addTarget.album}
              className="h-12 w-12"
              rounded="rounded-lg"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{addTarget.title}</p>
              <p className="truncate text-xs text-muted">
                {addTarget.artist} · {addTarget.album}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            {playlists.length ? (
              playlists.map((playlist) => {
                const contains = playlist.trackIds.includes(addTarget.id);
                return (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() =>
                      contains
                        ? removeTrackFromPlaylist(playlist.id, addTarget.id)
                        : addTrackToPlaylist(playlist.id, addTarget.id)
                    }
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-all duration-200',
                      contains
                        ? 'border-accent/40 bg-accent/[0.07]'
                        : 'border-transparent hover:border-line/60 hover:bg-elevated/70',
                    )}
                  >
                    <PlaylistMosaic
                      tracks={resolvePlaylistTracks(playlist)}
                      className="h-11 w-11"
                      rounded="rounded-lg"
                      iconSize="h-5 w-5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{playlist.name}</p>
                      <p className="text-[11px] text-muted">
                        {playlist.trackIds.length} трек(ів)
                      </p>
                    </div>
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition',
                        contains
                          ? 'border-accent bg-accent text-[rgb(var(--accent-contrast))]'
                          : 'border-line text-muted',
                      )}
                    >
                      {contains ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="rounded-xl border border-dashed border-line/70 px-4 py-5 text-center text-sm text-muted">
                У вас ще немає плейлистів. Створіть перший нижче.
              </p>
            )}
          </div>

          <form onSubmit={handleCreate} className="mt-5 border-t border-line/60 pt-4">
            <label
              htmlFor="new-playlist-name"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted"
            >
              Новий плейлист
            </label>
            <div className="flex gap-2">
              <input
                id="new-playlist-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="field"
                placeholder="Наприклад, Вечірній вайб"
                maxLength={80}
              />
              <button type="submit" className="btn-primary shrink-0 px-4" disabled={!name.trim()}>
                <Plus className="h-4 w-4" />
                Створити
              </button>
            </div>
          </form>
        </>
      ) : null}
    </Modal>
  );
}
