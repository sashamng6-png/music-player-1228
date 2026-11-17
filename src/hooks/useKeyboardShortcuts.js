import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { isEditableTarget } from '../lib/utils';

/**
 * Some browsers and automation tools report an empty `event.code`.
 * Fall back to the logical key so shortcuts keep working everywhere.
 */
function normalizeShortcut(event) {
  if (event.code) return event.code;
  const key = event.key || '';
  if (key === ' ' || key === 'Spacebar') return 'Space';
  if (key.startsWith('Arrow')) return key;
  if (key.length === 1) return `Key${key.toUpperCase()}`;
  return key;
}

/**
 * Global shortcuts: Space, ←/→, ↑/↓, M, F, R, S, Esc.
 * Disabled whenever the user is typing or a form control has focus.
 */
export default function useKeyboardShortcuts() {
  const {
    togglePlay,
    next,
    prev,
    volume,
    setVolume,
    toggleMute,
    currentTrack,
    toggleFavorite,
    cycleRepeat,
    toggleShuffle,
    nowPlayingOpen,
    setNowPlayingOpen,
    settingsOpen,
    addTarget,
    sidebarOpen,
  } = useApp();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      if (settingsOpen || addTarget || sidebarOpen) return;

      const target = event.target instanceof Element ? event.target : null;
      const interactive = target?.closest('button, a, [role="button"], [role="switch"]');
      const shortcut = normalizeShortcut(event);

      switch (shortcut) {
        case 'Space':
          if (interactive) return;
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          event.preventDefault();
          next();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          prev();
          break;
        case 'ArrowUp':
          event.preventDefault();
          setVolume(volume + 0.05);
          break;
        case 'ArrowDown':
          event.preventDefault();
          setVolume(volume - 0.05);
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyF':
          if (currentTrack) toggleFavorite(currentTrack.id);
          break;
        case 'KeyR':
          cycleRepeat();
          break;
        case 'KeyS':
          toggleShuffle();
          break;
        case 'Escape':
          if (nowPlayingOpen) setNowPlayingOpen(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    addTarget,
    currentTrack,
    cycleRepeat,
    next,
    nowPlayingOpen,
    prev,
    setNowPlayingOpen,
    setVolume,
    settingsOpen,
    sidebarOpen,
    toggleFavorite,
    toggleMute,
    togglePlay,
    toggleShuffle,
    volume,
  ]);
}
