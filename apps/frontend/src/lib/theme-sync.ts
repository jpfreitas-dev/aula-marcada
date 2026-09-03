const THEME_COLORS = {
  light: {
    themeColor: '#4c1d95',
    appleStatusBarStyle: 'default',
  },
  dark: {
    themeColor: '#2e1065',
    appleStatusBarStyle: 'black-translucent',
  },
} as const;

function getColorScheme(): keyof typeof THEME_COLORS {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function setMetaContent(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }

  meta.content = content;
}

function applyThemeSync() {
  const scheme = getColorScheme();
  const { themeColor, appleStatusBarStyle } = THEME_COLORS[scheme];

  document.documentElement.style.colorScheme = scheme;
  setMetaContent('theme-color', themeColor);
  setMetaContent('apple-mobile-web-app-status-bar-style', appleStatusBarStyle);
}

export function initThemeSync() {
  if (typeof window === 'undefined') {
    return;
  }

  applyThemeSync();

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', applyThemeSync);
}
