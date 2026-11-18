import { CloudUpload, Globe2, Home, Library, Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';

const TABS = [
  { to: '/', label: 'Головна', icon: Home, end: true },
  { to: '/community', label: 'Спільнота', icon: Globe2 },
  { to: '/library', label: 'Бібліотека', icon: Library },
  { to: '/my-tracks', label: 'Мої треки', icon: CloudUpload },
];

function Tab({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold leading-none transition-colors duration-200',
          isActive ? 'text-accent' : 'text-muted active:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className="h-[21px] w-[21px]"
            strokeWidth={isActive ? 2.4 : 2}
            aria-hidden="true"
          />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

/* Нижні вкладки для телефонів і планшетів — як у звичайному мобільному застосунку. */
export default function MobileTabBar() {
  const { setSidebarOpen } = useApp();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[52] lg:hidden"
      aria-label="Нижня навігація"
    >
      <div className="border-t border-line/60 bg-[rgb(var(--bg))]/92 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-10px_30px_-22px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
        <div className="mx-auto grid h-14 max-w-lg grid-cols-5 gap-0.5 px-1.5">
          {TABS.map((tab) => (
            <Tab key={tab.to} {...tab} />
          ))}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold leading-none text-muted transition-colors duration-200 active:text-ink"
            aria-label="Відкрити меню: плейлисти, улюблене, історія"
          >
            <Menu className="h-[21px] w-[21px]" strokeWidth={2} aria-hidden="true" />
            <span className="truncate">Ще</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
