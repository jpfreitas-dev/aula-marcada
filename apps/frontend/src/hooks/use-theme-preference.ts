import { useCallback, useSyncExternalStore } from 'react';

import {
  getEffectiveTheme,
  setThemePreference,
  subscribeThemePreference,
  type ThemePreference,
} from '@/lib/theme-preference-store';

function getThemeSnapshot(): ThemePreference {
  return getEffectiveTheme();
}

function getThemeServerSnapshot(): ThemePreference {
  return 'light';
}

export function useThemePreference() {
  const theme = useSyncExternalStore(
    subscribeThemePreference,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  const setTheme = useCallback((preference: ThemePreference) => {
    setThemePreference(preference);
  }, []);

  return { theme, setTheme };
}
