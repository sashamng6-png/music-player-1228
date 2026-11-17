import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CloudUpload,
  Disc3,
  Loader2,
  LogIn,
  Pause,
  Pencil,
  Play,
  RefreshCw,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { cn, formatDate, formatTime, formatTotalDuration, pluralTracks } from '../lib/utils';
import CoverArt from '../components/ui/CoverArt';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TrackForm from '../components/tracks/TrackForm';
import SetupNotice from '../components/community/SetupNotice';

export default function MyTracksPage() {
  const {
    playTrack,
    togglePlay,
    currentTrackId,
    isPlaying,
    pushToast,
  } = useApp();
  const { configured, user, openAuth } = useAuth();
  const {
    myTracks,
    loading,
    error,
    refresh,
    updateTrack,
    deleteTrack,
  } = useCommunity();

  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const contextIds = myTracks.map((track) => track.id);
  const totalDuration = useMemo(
    () => myTracks.reduce((sum, track) => sum + (track.duration || 0), 0),
    [myTracks],
  );

  const handleEditSubmit = async (values, onProgress) => {
    const track = await updateTrack(editing.remoteId, values, onProgress);
    setEditing(null);
    pushToast('Зміни збережено', 'success');
    return track;
  };

  const handleDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteTrack(pendingDelete.remoteId);
      pushToast(`Трек «${pendingDelete.title}» видалено`, 'success');
      setPendingDelete(null);
    } catch (deleteError) {
      pushToast(deleteError.message || 'Не вдалося видалити трек.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (!configured) {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
            Керування
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Мої треки
          </h1>
        </header>
        <SetupNotice />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
            Керування
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Мої треки
          </h1>
        </header>
        <div className="panel flex flex-col items-center px-6 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/12 text-accent">
            <Disc3 className="h-8 w-8" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">Увійдіть у свій акаунт</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Тут з’являться ваші опубліковані треки: їх можна редагувати, замінювати файли та
            видаляти.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => openAuth('signin')}>
              <LogIn className="h-4 w-4" />
              Увійти
            </button>
            <button type="button" className="btn-secondary" onClick={() => openAuth('signup')}>
              <UserPlus className="h-4 w-4" />
              Зареєструватися
            </button>
            <Link to="/community" className="btn-ghost">
              Слухати спільноту
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
            Керування
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Мої треки
          </h1>
          <p className="mt-1 text-sm text-muted">
            {pluralTracks(myTracks.length)}
            {totalDuration ? ` · ${formatTotalDuration(totalDuration)}` : ''} · змінювати й
            видаляти можете лише ви
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-ghost text-xs"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', (refreshing || loading) && 'animate-spin')} />
            Оновити
          </button>
          <Link to="/upload" className="btn-primary">
            <CloudUpload className="h-4 w-4" />
            Завантажити трек
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="panel flex items-center justify-center gap-2 px-6 py-16 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          Завантажуємо ваші треки...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.07] px-6 py-10 text-center">
          <p className="text-sm font-bold text-ink">Не вдалося завантажити треки</p>
          <p className="max-w-md text-xs leading-relaxed text-muted">{error}</p>
          <button type="button" className="btn-secondary mt-1" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            Спробувати ще раз
          </button>
        </div>
      ) : myTracks.length ? (
        <section className="panel overflow-hidden p-1.5 sm:p-2">
          <div className="hidden items-center gap-3 px-3 pb-1.5 pt-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted/70 md:flex">
            <span className="w-6 text-center">#</span>
            <span className="min-w-0 flex-1">Трек</span>
            <span className="w-[108px]">Жанр</span>
            <span className="hidden w-[110px] xl:block">Опубліковано</span>
            <span className="w-[132px] text-right">Дії</span>
            <span className="w-9 text-right">Час</span>
          </div>
          <div className="space-y-0.5">
            {myTracks.map((track, index) => {
              const isCurrent = currentTrackId === track.id;
              const isActive = isCurrent && isPlaying;
              return (
                <div
                  key={track.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-elevated/70 sm:gap-3 sm:px-3',
                    isCurrent && 'bg-accent/[0.07]',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => (isCurrent ? togglePlay() : playTrack(track.id, contextIds))}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-label={isActive ? `Пауза: ${track.title}` : `Відтворити: ${track.title}`}
                  >
                    <span className="relative">
                      <CoverArt
                        src={track.cover}
                        alt={track.title}
                        rounded="rounded-lg"
                        className="h-11 w-11 cover-shadow"
                      />
                      <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
                        {isActive ? (
                          <Pause className="h-4 w-4 fill-current" />
                        ) : (
                          <Play className="h-4 w-4 fill-current" />
                        )}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-[13px] font-semibold sm:text-sm',
                          isCurrent ? 'text-accent' : 'text-ink',
                        )}
                        title={track.title}
                      >
                        {track.title}
                      </span>
                      <span className="block truncate text-[11px] text-muted" title={track.artist}>
                        {track.artist}
                      </span>
                    </span>
                  </button>

                  <span className="hidden w-[108px] shrink-0 lg:block">
                    <span className="inline-flex max-w-full truncate rounded-full border border-line/60 px-2 py-0.5 text-[10px] font-semibold text-muted">
                      {track.genre}
                    </span>
                  </span>

                  <span className="hidden w-[110px] shrink-0 text-[11px] text-muted xl:block">
                    {formatDate(track.addedAt)}
                  </span>

                  <div className="flex w-[132px] shrink-0 items-center justify-end gap-0.5">
                    <button
                      type="button"
                      onClick={() => setEditing(track)}
                      className="flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold text-muted transition hover:bg-surface hover:text-ink"
                      aria-label={`Редагувати ${track.title}`}
                      title="Редагувати трек"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Редагувати</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(track)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-rose-400"
                      aria-label={`Видалити ${track.title}`}
                      title="Видалити трек"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <span className="hidden w-9 shrink-0 text-right text-[11px] tabular-nums text-muted sm:block">
                    {formatTime(track.duration)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="panel flex flex-col items-center px-6 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/12 text-accent">
            <Disc3 className="h-8 w-8" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">Тут поки порожньо</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Опублікуйте перший трек — він одразу з’явиться у спільній бібліотеці, а ви зможете
            редагувати його саме тут.
          </p>
          <Link to="/upload" className="btn-primary mt-5">
            <CloudUpload className="h-4 w-4" />
            Завантажити трек
          </Link>
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Редагувати трек"
        description="Оновіть метадані або замініть аудіофайл чи обкладинку."
        icon={<Pencil className="h-5 w-5" />}
        size="lg"
      >
        {editing ? (
          <TrackForm
            mode="edit"
            initial={editing}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditing(null)}
            submitLabel="Зберегти зміни"
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Видалити трек назавжди?"
        description={
          pendingDelete
            ? `«${pendingDelete.title}» зникне зі спільноти, а аудіофайл і обкладинка будуть видалені зі Storage. Цю дію не можна скасувати.`
            : ''
        }
        confirmLabel={deleting ? 'Видаляємо...' : 'Видалити трек'}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
