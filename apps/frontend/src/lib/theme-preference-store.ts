const STORAGE_KEY = 'theme-preference';

export type ThemePreference = 'light' | 'dark';

type Listener = () => void;

const listeners = new Set<Listener>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function readStoredPreference(): ThemePreference | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return null;
}

function getSystemTheme(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyThemeToDocument() {
  const preference = readStoredPreference();

  if (preference) {
    document.documentElement.dataset.theme = preference;
    return;
  }

  delete document.documentElement.dataset.theme;
}

export function getThemePreference(): ThemePreference | null {
  return readStoredPreference();
}

export function getEffectiveTheme(): ThemePreference {
  return readStoredPreference() ?? getSystemTheme();
}

export function setThemePreference(preference: ThemePreference) {
  localStorage.setItem(STORAGE_KEY, preference);
  applyThemeToDocument();
  notifyListeners();
}

export function subscribeThemePreference(listener: Listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function initThemePreference() {
  if (typeof window === 'undefined') {
    return;
  }

  applyThemeToDocument();

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (getThemePreference() === null) {
      notifyListeners();
    }
  });
}
