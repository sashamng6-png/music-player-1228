import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ListMusic,
  Pencil,
  Play,
  Plus,
  Shuffle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn, formatDate, formatTotalDuration, pluralTracks } from '../lib/utils';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import PlaylistMosaic from '../components/ui/PlaylistMosaic';
import TrackRow from '../components/tracks/TrackRow';
import AddTracksModal from '../components/playlists/AddTracksModal';

function RenamePlaylistModal({ open, onClose, playlist }) {
  const { renamePlaylist, updatePlaylistDescription } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open && playlist) {
      setName(playlist.name || '');
      setDescription(playlist.description || '');
    }
  }, [open, playlist]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    renamePlaylist(playlist.id, name);
    updatePlaylistDescription(playlist.id, description.trim().slice(0, 200));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Редагувати плейлист"
      description="Оновіть назву або додайте короткий опис."
      icon={<Pencil className="h-5 w-5" />}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Скасувати
          </button>
          <button type="submit" form="rename-playlist-form" className="btn-primary" disabled={!name.trim()}>
            Зберегти
          </button>
        </div>
      }
    >
      <form id="rename-playlist-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="rename-playlist"
            className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted"
          >
            Назва
          </label>
          <input
            id="rename-playlist"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field"
            maxLength={80}
            autoComplete="off"
          />
        </div>
        <div>
          <label
            htmlFor="rename-description"
            className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted"
          >
            Опис <span className="font-normal normal-case text-muted/70">(необов’язково)</span>
          </label>
          <textarea
            id="rename-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={200}
            className="field resize-none"
            placeholder="Кілька слів про цю добірку..."
          />
        </div>
      </form>
    </Modal>
  );
}

export default function PlaylistPage() {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const {
    getPlaylistById,
    resolvePlaylistTracks,
    playPlaylist,
    playCollection,
    removeTrackFromPlaylist,
    deletePlaylist,
    userPlaylistById,
  } = useApp();

  const [renameOpen, setRenameOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const liveUserPlaylist = userPlaylistById(playlistId);
  const playlist = liveUserPlaylist || getPlaylistById(playlistId);

  if (!playlist) {
    return (
      <div className="pt-6">
        <EmptyState
          title="Плейлист не знайдено"
          description="Можливо, його було видалено або посилання застаріле. Повернімося до ваших добірок."
          action={
            <Link to="/playlists" className="btn-primary">
              <ListMusic className="h-4 w-4" />
              До плейлистів
            </Link>
          }
        />
      </div>
    );
  }

  const isCurated = Boolean(playlist.curated);
  const tracks = resolvePlaylistTracks(playlist);
  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const contextIds = tracks.map((track) => track.id);

  const handleDelete = () => {
    deletePlaylist(playlist.id);
    setConfirmDelete(false);
    navigate('/playlists');
  };

  return (
    <div className="space-y-5">
      <Link
        to="/playlists"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Усі плейлисти
      </Link>

      <section className="relative overflow-hidden rounded-[28px] border border-line/60 bg-gradient-to-br from-accent/15 via-surface to-accent2/15 p-5 sm:p-7">
        <div
          className="absolute -right-10 -top-20 h-72 w-72 rounded-full bg-accent2/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <PlaylistMosaic
            tracks={tracks}
            className="h-32 w-32 shrink-0 border border-white/10 shadow-2xl sm:h-44 sm:w-44"
            rounded="rounded-2xl"
            iconSize="h-12 w-12"
          />

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
              {isCurated ? (
                <>
                  <Sparkles className="h-3 w-3" />
                  Збірка Music Player 1228
                </>
              ) : (
                <>
                  <ListMusic className="h-3 w-3" />
                  Ваш плейлист
                </>
              )}
            </p>
            <h1 className="mt-1.5 break-words font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {playlist.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {playlist.description ||
                (isCurated
                  ? 'Готова добірка з демонстраційної бібліотеки Music Player 1228.'
                  : 'Власна добірка. Додайте треки з бібліотеки, щоб наповнити її.')}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-muted">
              <span>{pluralTracks(tracks.length)}</span>
              {totalDuration ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-muted/50" />
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    {formatTotalDuration(totalDuration)}
                  </span>
                </>
              ) : null}
              {playlist.createdAt ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-muted/50" />
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(playlist.createdAt)}
                  </span>
                </>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => playPlaylist(playlist)}
                disabled={!tracks.length}
              >
                <Play className="h-4 w-4 fill-current" />
                Слухати
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => playCollection(tracks, { shuffle: true })}
                disabled={!tracks.length}
              >
                <Shuffle className="h-4 w-4" />
                Перемішати
              </button>
              {!isCurated ? (
                <>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Додати треки
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={() => setRenameOpen(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Редагувати
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-xs text-rose-400 hover:bg-rose-500/10"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Видалити
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {tracks.length ? (
        <section className="panel p-1.5 sm:p-2">
          <div className="hidden items-center gap-3 px-3 pb-1.5 pt-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted/70 md:flex">
            <span className="w-6 text-center">#</span>
            <span className="min-w-0 flex-1">Трек</span>
            <span className="w-[16%]">Альбом</span>
            <span className="hidden w-[108px] lg:block">Жанр</span>
            <span className={cn('w-[180px] text-right sm:w-[188px]')}>Дії</span>
            <span className="w-9 text-right">Час</span>
          </div>
          <div className="space-y-0.5">
            {tracks.map((track, index) => (
              <TrackRow
                key={`${track.id}-${index}`}
                track={track}
                index={index}
                contextIds={contextIds}
                onRemove={
                  isCurated
                    ? null
                    : (item) => removeTrackFromPlaylist(playlist.id, item.id)
                }
                removeLabel="Видалити з плейлиста"
              />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title="Плейлист поки що порожній"
          description="Додайте композиції з бібліотеки або перетягніть власні аудіофайли у «Мою музику»."
          compact
          action={
            <>
              <button
                type="button"
                className="btn-primary"
                onClick={() => (isCurated ? playPlaylist(playlist) : setAddOpen(true))}
              >
                <Plus className="h-4 w-4" />
                {isCurated ? 'Слухати добірку' : 'Додати треки'}
              </button>
              <Link to="/library" className="btn-secondary">
                До бібліотеки
              </Link>
            </>
          }
        />
      )}

      {!isCurated ? (
        <>
          <RenamePlaylistModal
            open={renameOpen}
            onClose={() => setRenameOpen(false)}
            playlist={liveUserPlaylist || playlist}
          />
          <AddTracksModal
            open={addOpen}
            onClose={() => setAddOpen(false)}
            playlist={liveUserPlaylist || playlist}
          />
          <ConfirmDialog
            open={confirmDelete}
            title="Видалити плейлист?"
            description={`«${playlist.name}» буде видалено. Самі треки залишаться у бібліотеці та улюбленому.`}
            confirmLabel="Видалити плейлист"
            onCancel={() => setConfirmDelete(false)}
            onConfirm={handleDelete}
          />
        </>
      ) : null}
    </div>
  );
}
