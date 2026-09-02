import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import assert from 'node:assert/strict';
import test from 'node:test';

const stylesPath = fileURLToPath(new URL('../src/styles/globals.scss', import.meta.url));
const mapViewPath = fileURLToPath(new URL('../src/components/Map/MapView.tsx', import.meta.url));

const readToken = (source: string, token: string) => {
  const value = source.match(new RegExp(`${token}:\\s*(#[0-9a-f]{6});`, 'i'))?.[1];
  assert.ok(value, `Expected ${token} to use a six-digit hex color`);
  return value;
};

const relativeLuminance = (hex: string) => {
  const channels = [0, 2, 4].map(index => parseInt(hex.slice(index + 1, index + 3), 16) / 255);
  const linearChannels = channels.map(channel =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );

  return linearChannels.reduce((total, channel, index) => total + [0.2126, 0.7152, 0.0722][index] * channel, 0);
};

const contrastRatio = (foreground: string, background: string) => {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
};

test('disabled text remains readable against disabled surfaces in both themes', async () => {
  const source = await readFile(stylesPath, 'utf8');
  const lightTheme = source.slice(source.indexOf(':root {'), source.indexOf('\n  .dark {'));
  const darkTheme = source.slice(source.indexOf('.dark {'));

  assert.ok(
    contrastRatio(
      readToken(lightTheme, '--color-text-disabled'),
      readToken(lightTheme, '--color-interactive-disabled')
    ) >= 4.5
  );
  assert.ok(
    contrastRatio(
      readToken(darkTheme, '--color-text-disabled'),
      readToken(darkTheme, '--color-interactive-disabled')
    ) >= 4.5
  );
});

test('dark mode tones down only the map canvas', async () => {
  const [styles, mapView] = await Promise.all([readFile(stylesPath, 'utf8'), readFile(mapViewPath, 'utf8')]);

  assert.match(mapView, /className='map-canvas size-full'/);
  assert.match(styles, /\.dark \.map-canvas\s*\{[\s\S]*?filter:\s*brightness\(0\.82\) saturate\(0\.88\);/);
});
