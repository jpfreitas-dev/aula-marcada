/* global Buffer, console */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

const themeColor = '#4c1d95';
const backgroundColor = '#fef7ff';

function buildSvg(size, maskable = false) {
  const padding = maskable ? Math.round(size * 0.1) : Math.round(size * 0.12);
  const innerSize = size - padding * 2;
  const radius = maskable
    ? Math.round(size * 0.2)
    : Math.round(innerSize * 0.22);
  const fontSize = Math.round(size * 0.28);

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${backgroundColor}" />
  <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" rx="${radius}" fill="${themeColor}" />
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700">AM</text>
</svg>`);
}

async function writePng(name, size, maskable = false) {
  const output = path.join(publicDir, name);
  await sharp(buildSvg(size, maskable)).png().toFile(output);
}

await mkdir(publicDir, { recursive: true });
await writeFile(path.join(publicDir, 'favicon.svg'), buildSvg(64), 'utf8');
await writePng('favicon.png', 32);
await writePng('apple-touch-icon.png', 180);
await writePng('pwa-192.png', 192);
await writePng('pwa-512.png', 512);
await writePng('pwa-512-maskable.png', 512, true);

console.log('PWA icons generated in apps/frontend/public');
