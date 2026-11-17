import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CalendarDays,
  Camera,
  CloudUpload,
  Disc3,
  Loader2,
  LogIn,
  Music4,
  Pencil,
  Play,
  UserRound,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import {
  COMMUNITY_BUCKETS,
  fileExtension,
  removeStorageFiles,
  uploadFileWithProgress,
  validateCoverFile,
} from '../lib/supabase';
import {
  cn,
  formatDate,
  formatTotalDuration,
  pluralTracks,
} from '../lib/utils';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import TrackRow from '../components/tracks/TrackRow';
import SetupNotice from '../components/community/SetupNotice';

function Avatar({ src, name, className }) {
  const initials = (name || 'MF')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || '')
    .join('')
    .toUpperCase();
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-accent2 shadow-2xl',
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name || 'Аватар'} className="h-full w-full object-cover" />
      ) : (
        <span className="font-display text-3xl font-extrabold text-[rgb(var(--accent-contrast))]">
          {initials || <UserRound className="h-10 w-10" />}
        </span>
      )}
    </div>
  );
}

function EditProfileModal({ open, onClose, profile }) {
  const { user, updateProfile } = useAuth();
  const { pushToast } = useApp();
  const [username, setUsername] = useState(profile?.username || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setUsername(profile?.username || '');
    setAvatarFile(null);
    setProgress(0);
    setError(null);
    setSaving(false);
  }, [open, profile]);

  const preview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatar_url || null),
    [avatarFile, profile?.avatar_url],
  );
  useEffect(
    () => () => {
      if (avatarFile && preview) URL.revokeObjectURL(preview);
    },
    [avatarFile, preview],
  );

  const pickAvatar = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const fileError = validateCoverFile(file);
    if (fileError) {
      setError(fileError);
      return;
    }
    setError(null);
    setAvatarFile(file);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (saving || !user) return;
    const trimmed = username.trim();
    if (trimmed.length < 2) {
      setError('Нікнейм має містити щонайменше 2 символи.');
      return;
    }
    if (trimmed.length > 30) {
      setError('Нікнейм має бути не довшим за 30 символів.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let avatarUrl = profile?.avatar_url || null;
      if (avatarFile) {
        setProgress(0.05);
        const ext = fileExtension(avatarFile.name) || 'jpg';
        const random =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now();
        const path = `${user.id}/avatar-${random}.${ext}`;
        const uploaded = await uploadFileWithProgress(
          COMMUNITY_BUCKETS.covers,
          path,
          avatarFile,
          (value) => setProgress(0.05 + value * 0.85),
        );
        avatarUrl = uploaded.publicUrl;
      }

      setProgress(0.95);
      await updateProfile({ username: trimmed, avatar_url: avatarUrl });

      if (avatarFile && profile?.avatar_url && profile.avatar_url !== avatarUrl) {
        removeStorageFiles(COMMUNITY_BUCKETS.covers, [profile.avatar_url]).catch(() => {});
      }

      setProgress(1);
      pushToast('Профіль оновлено', 'success');
      onClose?.();
    } catch (saveError) {
      setError(saveError.message || 'Не вдалося оновити профіль.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => (saving ? null : onClose?.())}
      title="Редагувати профіль"
      description="Змініть нікнейм або аватар. Зміни побачать усі відвідувачі спільноти."
      icon={<Pencil className="h-5 w-5" />}
      size="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <div className="relative">
            <Avatar src={preview} name={username} className="h-24 w-24" />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={saving}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-lg transition hover:bg-elevated"
              aria-label="Замінити аватар"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={pickAvatar}
              disabled={saving}
            />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs font-bold text-ink">Аватар</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              JPG, PNG або WebP до 5 МБ. Необов’язково — без фото показуємо ініціали.
            </p>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
            Нікнейм
          </span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={30}
            className="field h-11"
            disabled={saving}
            required
          />
        </label>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-rose-300"
          >
            {error}
          </div>
        ) : null}

        {saving ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted">
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                Зберігаємо профіль...
              </span>
              <span className="tabular-nums text-ink">{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-[width] duration-200"
                style={{ width: `${Math.max(Math.round(progress * 100), 3)}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Скасувати
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            Зберегти
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProfilePage() {
  const { userId } = useParams();
  const { configured, user, profile, loading: sessionLoading, openAuth } = useAuth();
  const {
    tracks,
    rows,
    profiles,
    loadProfile,
    loading: communityLoading,
  } = useCommunity();
  const { playCollection } = useApp();

  const [publicProfile, setPublicProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const targetId = userId || user?.id || null;
  const isOwn = Boolean(user?.id && targetId === user.id);

  useEffect(() => {
    if (!targetId || isOwn || !configured) {
      setPublicProfile(null);
      return;
    }
    let alive = true;
    setProfileLoading(true);
    loadProfile(targetId)
      .then((data) => {
        if (alive) setPublicProfile(data);
      })
      .finally(() => {
        if (alive) setProfileLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, isOwn, configured]);

  const authorFromTracks = useMemo(() => {
    const row = rows.find((item) => String(item.user_id) === String(targetId));
    return Array.isArray(row?.author) ? row.author[0] : row?.author || null;
  }, [rows, targetId]);

  const displayProfile = isOwn
    ? profile
    : publicProfile || profiles[targetId] || authorFromTracks;

  const userTracks = useMemo(
    () => tracks.filter((track) => String(track.userId) === String(targetId)),
    [tracks, targetId],
  );

  const contextIds = userTracks.map((track) => track.id);
  const totalDuration = userTracks.reduce((sum, track) => sum + (track.duration || 0), 0);

  if (!configured) {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
            Профіль
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Профіль автора
          </h1>
        </header>
        <SetupNotice />
      </div>
    );
  }

  if (!userId && !user && !sessionLoading) {
    return (
      <div className="panel flex flex-col items-center px-6 py-14 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/12 text-accent">
          <UserRound className="h-8 w-8" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-ink">Увійдіть у свій профіль</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          Публікуйте треки, обирайте нікнейм і аватар — ваш профіль бачитимуть інші слухачі.
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
    );
  }

  const isLoading = (profileLoading || communityLoading) && !displayProfile;

  if (!targetId || (!isLoading && !displayProfile && !userTracks.length)) {
    return (
      <EmptyState
        title="Профіль не знайдено"
        description="Можливо, користувач ще не опублікував жодного треку або посилання застаріле."
        action={
          <Link to="/community" className="btn-primary">
            До спільноти
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] border border-line/60 bg-surface/60 p-5 sm:p-7">
        <div className="absolute inset-0" aria-hidden="true">
          {userTracks[0]?.cover ? (
            <img
              src={userTracks[0].cover}
              alt=""
              className="h-full w-full scale-110 object-cover opacity-25 blur-2xl"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--bg))] via-[rgb(var(--bg))]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--bg))]/70 to-transparent" />
        </div>

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <Avatar
            src={displayProfile?.avatar_url}
            name={displayProfile?.username}
            className="h-24 w-24 sm:h-32 sm:w-32"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
              <Music4 className="h-3 w-3" />
              {isOwn ? 'Мій профіль' : 'Автор спільноти'}
            </p>
            <h1 className="mt-1.5 truncate font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {displayProfile?.username || (isLoading ? 'Завантаження...' : 'Слухач MusicFlow')}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              {displayProfile?.created_at ? (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  З нами з {formatDate(displayProfile.created_at)}
                </span>
              ) : null}
              <span className="flex items-center gap-1.5">
                <Disc3 className="h-3.5 w-3.5" />
                {pluralTracks(userTracks.length)}
                {totalDuration ? ` · ${formatTotalDuration(totalDuration)}` : ''}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => playCollection(userTracks, { shuffle: true })}
                disabled={!userTracks.length}
              >
                <Play className="h-4 w-4 fill-current" />
                Слухати автора
              </button>
              {isOwn ? (
                <>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditOpen(true)}
                    disabled={!profile}
                  >
                    <Pencil className="h-4 w-4" />
                    Редагувати профіль
                  </button>
                  <Link to="/upload" className="btn-ghost text-xs">
                    <CloudUpload className="h-3.5 w-3.5" />
                    Завантажити трек
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 className="section-title text-lg">Опубліковані треки</h2>
          <span className="text-[11px] font-semibold text-muted">
            {isOwn ? 'Ваші композиції' : 'Усі композиції автора'}
          </span>
        </div>

        {isLoading ? (
          <div className="panel flex items-center justify-center gap-2 px-6 py-14 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            Завантажуємо профіль...
          </div>
        ) : userTracks.length ? (
          <div className="panel overflow-hidden p-1.5 sm:p-2">
            <div className="hidden items-center gap-3 px-3 pb-1.5 pt-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted/70 md:flex">
              <span className="w-6 text-center">#</span>
              <span className="min-w-0 flex-1">Трек</span>
              <span className="w-[16%]">Альбом</span>
              <span className="hidden w-[108px] lg:block">Жанр</span>
              <span className="w-[180px] text-right sm:w-[188px]">Дії</span>
              <span className="w-9 text-right">Час</span>
            </div>
            <div className="space-y-0.5">
              {userTracks.map((track, index) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={index}
                  contextIds={contextIds}
                  showDate={false}
                />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title={isOwn ? 'Ви ще не публікували треки' : 'Автор ще не публікував треки'}
            description={
              isOwn
                ? 'Завантажте першу композицію — і вона з’явиться тут та у спільній бібліотеці.'
                : 'Зазирніть до спільноти — там уже є музика інших авторів.'
            }
            compact
            action={
              isOwn ? (
                <Link to="/upload" className="btn-primary">
                  <CloudUpload className="h-4 w-4" />
                  Завантажити трек
                </Link>
              ) : (
                <Link to="/community" className="btn-primary">
                  До спільноти
                </Link>
              )
            }
          />
        )}
      </section>

      {isOwn ? (
        <div className="flex flex-col items-center justify-between gap-2 rounded-2xl border border-line/50 bg-surface/35 px-4 py-3 text-center text-[10px] text-muted sm:flex-row sm:text-left">
          <span className="flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5 text-accent" />
            Ваш профіль бачать усі відвідувачі спільноти.
          </span>
          <Link to="/my-tracks" className="font-bold text-accent hover:underline">
            Керувати треками
          </Link>
        </div>
      ) : null}

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
      />
    </div>
  );
}
