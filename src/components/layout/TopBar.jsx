import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CloudUpload,
  ListMusic,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Play,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../lib/utils';
import CoverArt from '../ui/CoverArt';

export default function TopBar() {
  const {
    playableTracks,
    searchQuery,
    setSearchQuery,
    setSidebarOpen,
    settings,
    updateSettings,
    setSettingsOpen,
    playTrack,
    pushToast,
  } = useApp();
  const { configured, user, profile, openAuth, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const popoverRef = useRef(null);
  const userMenuRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const matches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return playableTracks.filter(
      (track) =>
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        (track.album || '').toLowerCase().includes(query) ||
        (track.authorName || '').toLowerCase().includes(query),
    );
  }, [playableTracks, searchQuery]);

  const results = useMemo(() => matches.slice(0, 6), [matches]);

  const userName = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0];
  const initials = (userName || 'MF')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || '')
    .join('')
    .toUpperCase();

  useEffect(() => {
    const onPointerDown = (event) => {
      if (
        popoverRef.current?.contains(event.target) ||
        searchRef.current?.contains(event.target)
      ) {
        return;
      }
      setSearchOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const onPointerDown = (event) => {
      if (userMenuRef.current?.contains(event.target)) return;
      setUserMenuOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [user?.id]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    const hasCommunity = matches.some((track) => track.isCommunity);
    navigate(hasCommunity ? '/community' : '/library');
    searchRef.current?.querySelector('input')?.blur();
  };

  const openLibrary = () => {
    setSearchOpen(false);
    navigate('/community');
  };

  const handleUpload = () => {
    setUserMenuOpen(false);
    if (!configured) {
      pushToast(
        'Спочатку підключіть Supabase: додайте ключі у .env і виконайте supabase/schema.sql',
        'error',
      );
      return;
    }
    if (!user) {
      openAuth('signin');
      return;
    }
    navigate('/upload');
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    try {
      await signOut();
      pushToast('Ви вийшли з акаунта', 'info');
      navigate('/');
    } catch (error) {
      pushToast(error.message || 'Не вдалося вийти з акаунта', 'error');
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line/40 bg-[rgb(var(--bg))]/75 backdrop-blur-2xl">
      <div className="mx-auto flex h-[72px] max-w-[1500px] items-center gap-2 px-3 sm:gap-3 sm:px-5 lg:px-8">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="icon-btn h-10 w-10 lg:hidden"
          aria-label="Відкрити меню"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div ref={searchRef} className="relative min-w-0 flex-1 sm:max-w-md lg:max-w-lg">
          <form onSubmit={handleSubmit} role="search">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setSearchOpen(false);
                  event.currentTarget.blur();
                }
              }}
              placeholder="Треки, виконавці, спільнота..."
              aria-label="Пошук у музичній бібліотеці та спільноті"
              className="h-10 w-full rounded-full border border-line/70 bg-surface/60 pl-10 pr-20 text-sm text-ink placeholder:text-muted/80 transition-all duration-200 focus:border-accent/50 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/15 [&::-webkit-search-cancel-button]:hidden"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchOpen(false);
                    searchRef.current?.querySelector('input')?.focus();
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-elevated hover:text-ink"
                  aria-label="Очистити пошук"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="hidden rounded-md border border-line/70 px-1.5 py-0.5 text-[9px] font-semibold text-muted sm:block">
                  ↵
                </kbd>
              )}
            </div>
          </form>

          {searchOpen && searchQuery.trim() ? (
            <div
              ref={popoverRef}
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-line/70 bg-surface/95 shadow-2xl backdrop-blur-xl animate-fade-in"
            >
              <div className="flex items-center justify-between px-4 pb-1 pt-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">
                  Результати
                </p>
                <span className="text-[10px] text-muted">{results.length ? 'клік — відтворити' : ''}</span>
              </div>
              <div className="p-1.5">
                {results.length ? (
                  results.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => {
                        playTrack(track.id, results.map((item) => item.id));
                        setSearchOpen(false);
                      }}
                      className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-elevated"
                    >
                      <CoverArt
                        src={track.cover}
                        alt={track.album}
                        className="h-9 w-9"
                        rounded="rounded-md"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-ink">
                          {track.title}
                        </span>
                        <span className="block truncate text-[11px] text-muted">
                          {track.artist} · {track.isCommunity ? 'Спільнота' : track.album}
                        </span>
                      </span>
                      {track.isCommunity ? (
                        <span className="hidden shrink-0 rounded-md bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent sm:inline">
                          Спільнота
                        </span>
                      ) : null}
                      <span className="text-[10px] tabular-nums text-muted">
                        {formatTime(track.duration)}
                      </span>
                      <Play className="h-3.5 w-3.5 fill-current text-accent opacity-0 transition group-hover:opacity-100" />
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-7 text-center">
                    <p className="text-sm font-semibold text-ink">Нічого не знайдено</p>
                    <p className="mt-1 text-xs text-muted">
                      Спробуйте назву треку, виконавця або автора зі спільноти.
                    </p>
                  </div>
                )}
              </div>
              {results.length ? (
                <button
                  type="button"
                  onClick={openLibrary}
                  className="flex w-full items-center justify-between border-t border-line/60 px-4 py-2.5 text-xs font-bold text-accent transition hover:bg-elevated"
                >
                  Показати всі результати
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={() =>
              updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
            }
            className="icon-btn"
            aria-label={
              settings.theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'
            }
            title={settings.theme === 'dark' ? 'Світла тема' : 'Темна тема'}
          >
            {settings.theme === 'dark' ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="icon-btn"
            aria-label="Відкрити налаштування"
            title="Налаштування"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>

          <button
            type="button"
            onClick={handleUpload}
            className="icon-btn hidden sm:inline-flex"
            aria-label="Завантажити трек"
            title="Завантажити трек"
          >
            <CloudUpload className="h-[18px] w-[18px]" />
          </button>

          {user ? (
            <div ref={userMenuRef} className="relative ml-1">
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent to-accent2 text-[11px] font-extrabold text-[rgb(var(--accent-contrast))] shadow-glow ring-2 ring-transparent transition hover:ring-accent/40"
                aria-label="Меню акаунта"
                aria-expanded={userMenuOpen}
                title={userName || 'Акаунт Music Player 1228'}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials || 'MF'
                )}
              </button>

              {userMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-2xl border border-line/70 bg-surface/95 shadow-2xl backdrop-blur-xl animate-fade-in">
                  <div className="border-b border-line/60 px-4 py-3">
                    <p className="truncate text-[13px] font-bold text-ink">
                      {userName || 'Слухач Music Player 1228'}
                    </p>
                    <p className="truncate text-[11px] text-muted">{user.email}</p>
                    {isAdmin ? (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">
                        <ShieldCheck className="h-3 w-3" />
                        Модератор
                      </span>
                    ) : null}
                  </div>
                  <div className="p-1.5">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12px] font-semibold text-muted transition hover:bg-elevated hover:text-ink"
                    >
                      <UserRound className="h-4 w-4" />
                      Мій профіль
                    </Link>
                    <Link
                      to="/my-tracks"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12px] font-semibold text-muted transition hover:bg-elevated hover:text-ink"
                    >
                      <ListMusic className="h-4 w-4" />
                      Мої треки
                    </Link>
                    <button
                      type="button"
                      onClick={handleUpload}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12px] font-semibold text-muted transition hover:bg-elevated hover:text-ink"
                    >
                      <CloudUpload className="h-4 w-4" />
                      Завантажити трек
                    </button>
                  </div>
                  <div className="border-t border-line/60 p-1.5">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12px] font-semibold text-muted transition hover:bg-elevated hover:text-rose-400"
                    >
                      <LogOut className="h-4 w-4" />
                      Вийти
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuth('signin')}
              className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-elevated/70 px-3 text-xs font-bold text-ink transition hover:border-accent/40 hover:bg-elevated active:scale-[0.97]"
              aria-label="Увійти або зареєструватися"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Увійти</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
