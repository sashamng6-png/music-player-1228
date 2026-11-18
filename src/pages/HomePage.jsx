import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock3,
  CloudUpload,
  Globe2,
  Headphones,
  Music2,
  Play,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { greeting, pluralTracks } from '../lib/utils';
import CoverArt from '../components/ui/CoverArt';
import EmptyState from '../components/ui/EmptyState';
import TrackCard from '../components/tracks/TrackCard';
import PlaylistCard from '../components/playlists/PlaylistCard';

export default function HomePage() {
  const {
    localTracks,
    playableTracks,
    historyEntries,
    playlists,
    playCollection,
    playTrack,
  } = useApp();
  const { configured, user, openAuth } = useAuth();
  const { tracks: communityTracks } = useCommunity();
  const navigate = useNavigate();

  const handleUpload = () => {
    if (!configured) {
      navigate('/community');
      return;
    }
    if (!user) {
      openAuth('signin');
      return;
    }
    navigate('/upload');
  };

  const newest = playableTracks[0] || null;
  const newestFromCommunity = Boolean(newest) && communityTracks.some((track) => track.id === newest.id);

  const quickPicks = (historyEntries.length
    ? historyEntries.map((entry) => entry.track)
    : playableTracks
  ).slice(0, 4);
  const recentTracks = historyEntries.slice(0, 8).map((entry) => entry.track);
  const userPlaylistsPreview = playlists.slice(0, 2);
  const communityPreview = communityTracks.slice(0, 6);

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
            <Sparkles className="h-3 w-3" />
            Music Player 1228 · твоя музика
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {greeting()}, слухачу
          </h1>
          <p className="mt-1 text-sm text-muted">Що додамо у твій сьогоднішній саундтрек?</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/library"
            className="btn-secondary px-4 py-2 text-xs"
          >
            <Headphones className="h-4 w-4" />
            Уся бібліотека
          </Link>
        </div>
      </section>

      {/* Hero: найновіший трек або заклик додати перший */}
      <section className="relative overflow-hidden rounded-[28px] border border-line/60 bg-surface/60">
        <div className="absolute inset-0" aria-hidden="true">
          {newest ? (
            <img
              src={newest.cover}
              alt=""
              className="h-full w-full scale-110 object-cover opacity-25 blur-2xl"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--bg))] via-[rgb(var(--bg))]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--bg))]/70 to-transparent" />
        </div>

        <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:p-9">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-accent">
              <Sparkles className="h-3 w-3" />
              {newest
                ? newestFromCommunity
                  ? 'Нове у спільноті'
                  : 'З твоєї бібліотеки'
                : 'Почніть тут'}
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-[44px]">
              {newest ? newest.title : 'Твоя музика — в одному місці'}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              {newest
                ? [newest.artist, newest.album].filter(Boolean).join(' · ')
                : 'Додайте власні аудіофайли або завантажте трек у Спільноту — і він з’явиться тут.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-muted">
              <span>{pluralTracks(playableTracks.length)}</span>
              <span className="h-1 w-1 rounded-full bg-muted/50" />
              <span>
                {communityTracks.length
                  ? `${pluralTracks(communityTracks.length)} зі спільноти`
                  : 'спільнота поки порожня'}
              </span>
              {newest ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-muted/50" />
                  <span className="inline-flex items-center gap-1">
                    <Headphones className="h-3 w-3" />
                    {newestFromCommunity ? 'від слухачів' : 'локальний файл'}
                  </span>
                </>
              ) : null}
            </div>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {newest ? (
                <>
                  <button
                    type="button"
                    onClick={() => playCollection(playableTracks)}
                    className="btn-primary"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Слухати
                  </button>
                  <Link
                    to={newestFromCommunity ? '/community' : '/library'}
                    className="btn-secondary"
                  >
                    Детальніше
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/library" className="btn-primary">
                    <CloudUpload className="h-4 w-4" />
                    Додати музику
                  </Link>
                  <Link to="/community" className="btn-secondary">
                    <Globe2 className="h-4 w-4" />
                    Спільнота
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="relative hidden shrink-0 lg:block">
            <div className="absolute -inset-6 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
            {newest ? (
              <div className="relative rotate-3 pb-4 pr-4 transition-transform duration-500 hover:rotate-0">
                <CoverArt
                  src={newest.cover}
                  alt={newest.album || newest.title}
                  rounded="rounded-3xl"
                  className="h-[250px] w-[250px] border border-white/10 cover-shadow"
                />
                <div className="absolute -bottom-1 -left-6 flex items-center gap-2 rounded-2xl border border-line/70 bg-surface/95 px-3 py-2 shadow-xl backdrop-blur">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[rgb(var(--accent-contrast))]">
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold text-ink">Готово до відтворення</p>
                    <p className="text-[9px] text-muted">HTML5 Audio · офлайн</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative flex h-[250px] w-[250px] items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-accent/25 via-surface to-accent2/25">
                <Music2 className="h-20 w-20 text-accent" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Швидкий старт */}
      {quickPicks.length ? (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="section-title">Швидкий старт</h2>
            <Link to="/library" className="btn-ghost py-1 text-xs">
              До бібліотеки
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {quickPicks.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() =>
                  playTrack(track.id, quickPicks.map((item) => item.id))
                }
                className="group flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-line/50 bg-surface/55 p-1.5 pr-3 text-left transition-all duration-200 hover:border-accent/30 hover:bg-surface"
              >
                <CoverArt
                  src={track.cover}
                  alt={track.album}
                  className="h-12 w-12"
                  rounded="rounded-lg"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-bold text-ink">{track.title}</span>
                  <span className="block truncate text-[10px] text-muted">{track.artist}</span>
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent opacity-70 transition group-hover:bg-accent group-hover:text-[rgb(var(--accent-contrast))] group-hover:opacity-100">
                  <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Нове зі спільноти */}
      {communityPreview.length ? (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title">Нове зі спільноти</h2>
              <p className="mt-0.5 text-[11px] text-muted">Треки, які завантажили слухачі</p>
            </div>
            <Link to="/community" className="btn-ghost py-1 text-xs">
              Уся спільнота
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {communityPreview.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                contextIds={communityPreview.map((item) => item.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Запрошення до спільноти */}
      <section className="relative overflow-hidden rounded-[28px] border border-line/60 bg-gradient-to-r from-accent/12 via-surface/70 to-accent2/12 p-5 sm:p-6">
        <div
          className="absolute -right-14 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent2 text-[rgb(var(--accent-contrast))] shadow-glow">
            <Globe2 className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
              Музика від слухачів
            </p>
            <h2 className="mt-1 font-display text-lg font-bold text-ink sm:text-xl">
              Спільнота Music Player 1228
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {communityTracks.length
                ? `${pluralTracks(communityTracks.length)} від авторів з усього світу — слухайте або додайте власну композицію.`
                : 'Тут з’являться треки, які завантажать слухачі. Станьте першим автором спільноти.'}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link to="/community" className="btn-secondary">
              <Globe2 className="h-4 w-4" />
              Слухати спільноту
            </Link>
            <button type="button" className="btn-primary" onClick={handleUpload}>
              <CloudUpload className="h-4 w-4" />
              Завантажити трек
            </button>
          </div>
        </div>
      </section>

      {/* Нещодавно прослухані */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Нещодавно прослухані</h2>
            <p className="mt-0.5 text-[11px] text-muted">Повернись до того, що вже сподобалось</p>
          </div>
          {historyEntries.length ? (
            <Link to="/history" className="btn-ghost py-1 text-xs">
              Історія
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>

        {recentTracks.length ? (
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
            {recentTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                contextIds={recentTracks.map((item) => item.id)}
                className="w-[148px] shrink-0 sm:w-[164px]"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Твоя музика — твій настрій."
            description="Додайте файли або знайдіть щось нове у Спільноті"
            action={
              <>
                <Link to="/library" className="btn-primary">
                  <CloudUpload className="h-4 w-4" />
                  Додати музику
                </Link>
                <Link to="/community" className="btn-secondary">
                  <Globe2 className="h-4 w-4" />
                  Спільнота
                </Link>
              </>
            }
          />
        )}
      </section>

      {/* Плейлисти + статистика */}
      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="section-title">Твої плейлисти</h2>
            <Link to="/playlists" className="btn-ghost py-1 text-xs">
              Керувати
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {userPlaylistsPreview.length ? (
            <div className="grid grid-cols-2 gap-3">
              {userPlaylistsPreview.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          ) : (
            <Link
              to="/playlists"
              className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-line/70 p-5 text-center transition hover:border-accent/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              </span>
              <p className="mt-2 text-sm font-bold text-ink">Створи перший плейлист</p>
              <p className="mt-0.5 text-[11px] text-muted">Збирай треки під свій настрій</p>
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-line/60 bg-gradient-to-br from-accent/[0.09] via-surface/60 to-accent2/[0.09] p-5">
          <div className="flex items-center gap-2 text-accent">
            <TrendingUp className="h-4 w-4" />
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em]">Твоя статистика</p>
          </div>
          <p className="mt-2 text-lg font-extrabold text-ink">Все зберігається локально</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Плейлисти, улюблені треки, історія та налаштування залишаються у цьому браузері навіть після
            перезавантаження.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-surface/70 p-2.5 text-center">
              <p className="text-lg font-extrabold tabular-nums text-ink">{localTracks.length}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">локальних</p>
            </div>
            <div className="rounded-xl bg-surface/70 p-2.5 text-center">
              <p className="text-lg font-extrabold tabular-nums text-ink">{historyEntries.length}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">в історії</p>
            </div>
            <div className="rounded-xl bg-surface/70 p-2.5 text-center">
              <p className="text-lg font-extrabold tabular-nums text-ink">{playlists.length}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">плейлистів</p>
            </div>
          </div>
          <Link
            to="/favorites"
            className="mt-4 flex items-center justify-between rounded-xl border border-line/50 bg-surface/50 px-3 py-2.5 text-xs font-semibold text-muted transition hover:border-rose-400/30 hover:text-ink"
          >
            <span className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5" />
              Улюблене та історія
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
