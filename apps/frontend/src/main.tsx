import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { initPwaInstallCapture } from './lib/pwa-install-store';
import { initThemeSync } from './lib/theme-sync';
import './index.css';

initPwaInstallCapture();
initThemeSync();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
