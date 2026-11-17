import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  User,
  UserPlus,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { friendlyAuthError } from '../../lib/supabase';

const initialState = { email: '', password: '', confirm: '', username: '' };

export default function AuthModal() {
  const {
    configured,
    authOpen,
    authMode,
    setAuthMode,
    closeAuth,
    signIn,
    signUp,
  } = useAuth();

  const [form, setForm] = useState(initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!authOpen) return;
    setForm(initialState);
    setError(null);
    setNotice(null);
    setShowPassword(false);
    setSubmitting(false);
  }, [authOpen, authMode]);

  const update = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const switchMode = (mode) => {
    setAuthMode(mode);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || !configured) return;
    setError(null);
    setNotice(null);

    const email = form.email.trim();
    if (!email || !form.password) {
      setError('Заповніть email і пароль.');
      return;
    }
    if (authMode === 'signup') {
      const username = form.username.trim();
      if (username.length < 2) {
        setError('Нікнейм має містити щонайменше 2 символи.');
        return;
      }
      if (form.password.length < 6) {
        setError('Пароль має містити щонайменше 6 символів.');
        return;
      }
      if (form.password !== form.confirm) {
        setError('Паролі не збігаються.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (authMode === 'signin') {
        await signIn(email, form.password);
      } else {
        const result = await signUp({
          email,
          password: form.password,
          username: form.username,
        });
        if (result?.needsConfirmation) {
          setNotice(
            `Ми надіслали лист на ${email}. Підтвердіть адресу — і зможете публікувати музику.`,
          );
          setForm((prev) => ({ ...prev, password: '', confirm: '' }));
        }
      }
    } catch (submitError) {
      setError(friendlyAuthError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const isSignup = authMode === 'signup';

  return (
    <Modal
      open={authOpen}
      onClose={closeAuth}
      title={isSignup ? 'Створити акаунт' : 'Увійти в MusicFlow'}
      description={
        isSignup
          ? 'Публікуйте власні треки, керуйте ними та долучайтесь до спільноти.'
          : 'Увійдіть, щоб завантажувати музику та керувати своїми треками.'
      }
      icon={<Cloud className="h-5 w-5" />}
      size="md"
    >
      <div className="space-y-4">
        {!configured ? (
          <div className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div className="min-w-0 text-xs leading-relaxed text-ink/90">
              <p className="font-bold text-ink">Supabase ще не підключено</p>
              <p className="mt-1 text-muted">
                Додайте у файл <code className="rounded bg-elevated px-1">.env</code> змінні{' '}
                <code className="rounded bg-elevated px-1">VITE_SUPABASE_URL</code> та{' '}
                <code className="rounded bg-elevated px-1">VITE_SUPABASE_ANON_KEY</code>, потім
                перезапустіть збірку. Ключі доступні в Supabase Dashboard → Project Settings →
                API.
              </p>
              <a
                href="https://supabase.com/dashboard/project/kjwwsretcsgwvgtjgqah/settings/api"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex font-bold text-accent hover:underline"
              >
                Відкрити налаштування Supabase
              </a>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line/70 bg-elevated/50 p-1">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition ${
              !isSignup ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-ink'
            }`}
            aria-pressed={!isSignup}
          >
            <LogIn className="h-3.5 w-3.5" />
            Вхід
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition ${
              isSignup ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-ink'
            }`}
            aria-pressed={isSignup}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Реєстрація
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignup ? (
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
                Нікнейм
              </span>
              <span className="relative block">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={form.username}
                  onChange={update('username')}
                  placeholder="Як вас показувати в спільноті"
                  autoComplete="nickname"
                  maxLength={30}
                  className="field h-11 pl-10"
                  required
                />
              </span>
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
              Email
            </span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                autoComplete="email"
                className="field h-11 pl-10"
                required
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
              Пароль
            </span>
            <span className="relative block">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder={isSignup ? 'Мінімум 6 символів' : 'Ваш пароль'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                className="field h-11 pl-10 pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-elevated hover:text-ink"
                aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>

          {isSignup ? (
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
                Повторіть пароль
              </span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={update('confirm')}
                  placeholder="Ще раз"
                  autoComplete="new-password"
                  className="field h-11 pl-10"
                  required
                />
              </span>
            </label>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-rose-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          {notice ? (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-emerald-300"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {notice}
            </div>
          ) : null}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={submitting || !configured}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSignup ? (
              <UserPlus className="h-4 w-4" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {submitting
              ? 'Зачекайте...'
              : isSignup
                ? 'Зареєструватися'
                : 'Увійти'}
          </button>
        </form>

        <p className="text-center text-[10px] leading-relaxed text-muted">
          Гості можуть слухати та шукати музику спільноти без входу. Акаунт потрібен лише для
          публікації.
        </p>
      </div>
    </Modal>
  );
}
