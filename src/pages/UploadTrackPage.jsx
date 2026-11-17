import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  CloudUpload,
  ListMusic,
  LogIn,
  Music4,
  Play,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import TrackForm from '../components/tracks/TrackForm';
import CoverArt from '../components/ui/CoverArt';
import SetupNotice from '../components/community/SetupNotice';

export default function UploadTrackPage() {
  const { playTrack, pushToast } = useApp();
  const { configured, user, openAuth } = useAuth();
  const { createTrack } = useCommunity();
  const navigate = useNavigate();
  const [published, setPublished] = useState(null);

  const handleSubmit = async (values, onProgress) => {
    const track = await createTrack(values, onProgress);
    setPublished(track);
    pushToast('Трек опубліковано в спільноті MusicFlow', 'success');
  };

  if (!configured) {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
            Публікація
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Завантажити трек
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
            Публікація
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Завантажити трек
          </h1>
          <p className="mt-1 text-sm text-muted">
            Щоб публікувати музику, увійдіть або створіть акаунт. Слухати спільноту можна без
            реєстрації.
          </p>
        </header>

        <div className="panel flex flex-col items-center px-6 py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/12 text-accent">
            <CloudUpload className="h-8 w-8" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">Потрібен акаунт</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Реєстрація безкоштовна: ваші треки з’являться у спільній бібліотеці, а ви зможете
            керувати ними в розділі «Мої треки».
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => openAuth('signup')}>
              <UserPlus className="h-4 w-4" />
              Зареєструватися
            </button>
            <button type="button" className="btn-secondary" onClick={() => openAuth('signin')}>
              <LogIn className="h-4 w-4" />
              Увійти
            </button>
            <Link to="/community" className="btn-ghost">
              Слухати спільноту
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (published) {
    return (
      <div className="space-y-5">
        <div className="panel relative overflow-hidden p-5 sm:p-7">
          <div
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <CoverArt
              src={published.cover}
              alt={published.title}
              className="h-28 w-28 cover-shadow sm:h-32 sm:w-32"
            />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Опубліковано
              </p>
              <h1 className="mt-1.5 truncate font-display text-2xl font-bold tracking-tight text-ink">
                {published.title}
              </h1>
              <p className="mt-0.5 truncate text-sm text-muted">
                {published.artist} · {published.genre}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Трек уже доступний усім відвідувачам сторінки «Спільнота».
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => playTrack(published.id, [published.id])}
                >
                  <Play className="h-4 w-4 fill-current" />
                  Слухати
                </button>
                <Link to="/my-tracks" className="btn-secondary">
                  <ListMusic className="h-4 w-4" />
                  Мої треки
                </Link>
                <Link to="/community" className="btn-ghost text-xs">
                  До спільноти
                </Link>
                <button
                  type="button"
                  className="btn-ghost text-xs"
                  onClick={() => setPublished(null)}
                >
                  Завантажити ще
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
            <Sparkles className="h-3 w-3" />
            Публікація
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Завантажити трек
          </h1>
          <p className="mt-1 text-sm text-muted">
            Файл потрапить у Supabase Storage, а трек — у спільну бібліотеку MusicFlow.
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost self-start text-xs sm:self-auto"
          onClick={() => navigate('/community')}
        >
          <Music4 className="h-3.5 w-3.5" />
          Спільнота
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="panel p-4 sm:p-6">
          <TrackForm mode="create" onSubmit={handleSubmit} submitLabel="Опублікувати трек" />
        </section>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-line/60 bg-surface/50 p-4">
            <h2 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-ink">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Що важливо знати
            </h2>
            <ul className="mt-2.5 space-y-2 text-[11px] leading-relaxed text-muted">
              <li>• Аудіо: MP3, WAV або OGG, до 25 МБ.</li>
              <li>• Обкладинка: JPG, PNG або WebP, до 5 МБ (необов’язково).</li>
              <li>• Публікуйте лише власну музику або файли з дозволом автора.</li>
              <li>• Редагувати й видаляти трек можете тільки ви.</li>
              <li>• Файли зберігаються у хмарі, а не в localStorage.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-line/60 bg-surface/50 p-4 text-[11px] leading-relaxed text-muted">
            <p className="font-bold text-ink">Ваш профіль</p>
            <p className="mt-1">
              Автором буде вказано нікнейм з профілю. Змінити його можна на сторінці{' '}
              <Link to="/profile" className="font-semibold text-accent hover:underline">
                Мій профіль
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
