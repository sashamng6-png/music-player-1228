import { useCallback, useEffect, useState } from 'react';

function detectStandalone() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)').matches ||
      window.matchMedia?.('(display-mode: window-controls-overlay)').matches ||
      window.navigator.standalone === true,
  );
}

/* Встановлення PWA: браузер сам вирішує, коли показати beforeinstallprompt.
   Хук ловить цю подію, щоб кнопка «Встановити застосунок» у налаштуваннях
   викликала рідний діалог, а не інструкцію «пошукайте в меню». */
export default function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(detectStandalone);

  useEffect(() => {
    const handlePrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    const displayMode = window.matchMedia?.('(display-mode: standalone)');
    const handleDisplayMode = (event) => {
      if (event.matches) setInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    displayMode?.addEventListener?.('change', handleDisplayMode);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      displayMode?.removeEventListener?.('change', handleDisplayMode);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!promptEvent) return false;
    try {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      return choice?.outcome === 'accepted';
    } catch {
      return false;
    } finally {
      setPromptEvent(null);
    }
  }, [promptEvent]);

  return { canInstall: Boolean(promptEvent), installed, promptInstall };
}
