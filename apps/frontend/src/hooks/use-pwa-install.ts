import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import {
  canPromptInstall,
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  markInstallPromptConsumed,
  subscribePwaInstall,
} from '@/lib/pwa-install-store';

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean(window.navigator.standalone)
  );
}

function isIosSafari(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

  return isIos && isSafari;
}

function getInstallSnapshot() {
  return canPromptInstall();
}

function getInstallServerSnapshot() {
  return false;
}

export function usePwaInstall() {
  const canInstall = useSyncExternalStore(
    subscribePwaInstall,
    getInstallSnapshot,
    getInstallServerSnapshot,
  );
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode);
  const [isIos] = useState(isIosSafari);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      setIsInstalled(isStandaloneMode());
    };

    window.addEventListener('appinstalled', handleDisplayModeChange);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('appinstalled', handleDisplayModeChange);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const installEvent = getDeferredInstallPrompt();

    if (!installEvent || !canPromptInstall()) {
      return false;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    markInstallPromptConsumed();

    if (choice.outcome === 'accepted') {
      clearDeferredInstallPrompt();
      setIsInstalled(true);
      return true;
    }

    return false;
  }, []);

  return {
    canInstall: canInstall && !isInstalled,
    isInstalled,
    isIos,
    promptInstall,
  };
}
