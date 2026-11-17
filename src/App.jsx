import { useEffect } from 'react';
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { CommunityProvider } from './context/CommunityContext';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import PlayerBar from './components/player/PlayerBar';
import NowPlayingPanel from './components/player/NowPlayingPanel';
import SettingsModal from './components/settings/SettingsModal';
import AddToPlaylistModal from './components/playlists/AddToPlaylistModal';
import AuthModal from './components/auth/AuthModal';
import Toasts from './components/ui/Toasts';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistPage from './pages/PlaylistPage';
import FavoritesPage from './pages/FavoritesPage';
import HistoryPage from './pages/HistoryPage';
import CommunityPage from './pages/CommunityPage';
import UploadTrackPage from './pages/UploadTrackPage';
import MyTracksPage from './pages/MyTracksPage';
import ProfilePage from './pages/ProfilePage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function AppShell() {
  useKeyboardShortcuts();
  const { pathname } = useLocation();

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[130] -translate-y-20 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-[rgb(var(--accent-contrast))] transition focus:translate-y-0"
      >
        Перейти до вмісту
      </a>

      <Sidebar />

      <div className="relative z-10 min-h-screen lg:pl-[264px]">
        <TopBar />
        <main id="main-content" className="app-main mx-auto w-full max-w-[1500px] px-3 pt-5 sm:px-5 sm:pt-6 lg:px-8">
          <div key={pathname} className="animate-fade-in">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/upload" element={<UploadTrackPage />} />
              <Route path="/my-tracks" element={<MyTracksPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/u/:userId" element={<ProfilePage />} />
              <Route path="/playlists" element={<PlaylistsPage />} />
              <Route path="/playlists/:playlistId" element={<PlaylistPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      <PlayerBar />
      <NowPlayingPanel />
      <SettingsModal />
      <AddToPlaylistModal />
      <AuthModal />
      <Toasts />
      <ScrollToTop />
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppProvider>
          <CommunityProvider>
            <AppShell />
          </CommunityProvider>
        </AppProvider>
      </AuthProvider>
    </HashRouter>
  );
}
