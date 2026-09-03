type Listener = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let promptConsumed = false;
let initialized = false;

const listeners = new Set<Listener>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function initPwaInstallCapture() {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  initialized = true;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    promptConsumed = false;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    promptConsumed = false;
    notifyListeners();
  });
}

export function subscribePwaInstall(listener: Listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getDeferredInstallPrompt() {
  return deferredPrompt;
}

export function canPromptInstall() {
  return deferredPrompt !== null && !promptConsumed;
}

export function markInstallPromptConsumed() {
  promptConsumed = true;
  notifyListeners();
}

export function clearDeferredInstallPrompt() {
  deferredPrompt = null;
  promptConsumed = false;
  notifyListeners();
}
