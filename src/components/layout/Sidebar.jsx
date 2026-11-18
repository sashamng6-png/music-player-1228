import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Cloud,
  CloudUpload,
  Globe2,
  Heart,
  History,
  Home,
  Library,
  ListMusic,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { cn } from '../../lib/utils';
import Logo from './Logo';
import CreatePlaylistModal from '../playlists/CreatePlaylistModal';

const NAV_ITEMS = [
  { to: '/', label: 'Головна', icon: Home, end: true },
  { to: '/community', label: 'Спільнота', icon: Globe2 },
  { to: '/library', label: 'Моя музика', icon: Library },
  { to: '/my-tracks', label: 'Мої треки', icon: CloudUpload },
  { to: '/playlists', label: 'Плейлисти', icon: ListMusic },
  { to: '/favorites', label: 'Улюблене', icon: Heart },
  { to: '/history', label: 'Історія', icon: History },
];

function SidebarContent({ onNavigate, onClose }) {
  const { playlists, favorites, pushToast } = useApp();
  const { configured, user, openAuth } = useAuth();
  const { myTracks } = useCommunity();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const handleUpload = () => {
    onNavigate?.();
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

  return (
    <>
      <div className="flex h-[72px] shrink-0 items-center justify-between px-5">
        <Logo />
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="icon-btn h-9 w-9 lg:hidden"
            aria-label="Закрити меню"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        <nav aria-label="Основна навігація" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                <span className="flex-1">{item.label}</span>
                {item.to === '/favorites' && favorites.length > 0 ? (
                  <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">
                    {favorites.length}
                  </span>
                ) : null}
                {item.to === '/playlists' && playlists.length > 0 ? (
                  <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[10px] font-bold text-muted">
                    {playlists.length}
                  </span>
                ) : null}
                {item.to === '/my-tracks' && myTracks.length > 0 ? (
                  <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                    {myTracks.length}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleUpload}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-xs font-extrabold text-[rgb(var(--accent-contrast))] shadow-glow transition hover:brightness-110 active:scale-[0.98]"
        >
          <CloudUpload className="h-4 w-4" />
          Завантажити трек
        </button>

        <div className="my-5 h-px bg-line/60" />

        <div className="flex items-center justify-between px-2.5">
          <h2 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted">
            Мої плейлисти
          </h2>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-elevated hover:text-ink active:scale-90"
            aria-label="Створити плейлист"
            title="Створити плейлист"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-2 space-y-0.5">
          {playlists.map((playlist) => (
            <NavLink
              key={playlist.id}
              to={`/playlists/${playlist.id}`}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-muted transition hover:bg-elevated hover:text-ink',
                  isActive && 'bg-elevated text-ink',
                )
              }
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-accent/25 to-accent2/25 text-accent2">
                <ListMusic className="h-3 w-3" />
              </span>
              <span className="min-w-0 flex-1 truncate">{playlist.name}</span>
              <span className="text-[9px] tabular-nums text-muted/60">
                {playlist.trackIds.length}
              </span>
            </NavLink>
          ))}
          {!playlists.length ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="w-full rounded-xl border border-dashed border-line/60 px-3 py-3 text-left text-[11px] leading-relaxed text-muted transition hover:border-accent/40 hover:text-ink"
            >
              Тут з’являться ваші плейлисти. Натисніть, щоб створити перший.
            </button>
          ) : null}
        </div>

        <Link
          to="/playlists"
          onClick={onNavigate}
          className="mt-3 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-muted transition hover:text-accent"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Усі плейлисти та збірки
        </Link>
      </div>

      <div className="shrink-0 border-t border-line/60 p-3">
        <div className="flex items-start gap-2.5 rounded-xl bg-elevated/60 p-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Cloud className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-bold text-ink">
              {configured ? 'Спільнота в Supabase' : 'Supabase не підключено'}
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
              {configured
                ? user
                  ? `Ви увійшли як ${user.email}. Треки — у хмарі, плейлисти — локально.`
                  : 'Слухайте музику спільноти. Для публікації увійдіть в акаунт.'
                : 'Додайте ключі у .env і виконайте supabase/schema.sql.'}
            </p>
            {configured && !user ? (
              <button
                type="button"
                onClick={() => openAuth('signin')}
                className="mt-1.5 text-[10px] font-bold text-accent hover:underline"
              >
                Увійти або зареєструватися
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <CreatePlaylistModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useApp();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      <aside className="fixed bottom-[var(--player-height)] left-0 top-0 z-40 hidden w-[264px] flex-col border-r border-line/50 bg-surface/45 backdrop-blur-xl lg:flex">
        <SidebarContent />
      </aside>

      <div
        className={cn(
          'fixed inset-0 z-[65] lg:hidden',
          sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!sidebarOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
            sidebarOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 flex w-[86vw] max-w-[320px] flex-col border-r border-line/60 bg-surface pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] shadow-2xl transition-transform duration-300 ease-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          aria-label="Мобільне меню"
        >
          <SidebarContent
            onNavigate={() => setSidebarOpen(false)}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>
      </div>
    </>
  );
}
