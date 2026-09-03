import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readSource = (relativePath: string) =>
  readFile(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), 'utf8');

test('information page shell uses an open, purpose-specific intro', async () => {
  const source = await readSource('src/components/Info/InfoPageShell.tsx');

  assert.match(source, /info-page-intro/);
  assert.match(source, /action\?: ReactNode/);
  assert.doesNotMatch(source, /route-kicker/);
  assert.doesNotMatch(source, /rounded-full border/);
  assert.doesNotMatch(source, /MapPinned/);
  assert.doesNotMatch(source, /border-t border-\[var\(--color-border-primary\)\]/);
  assert.match(source, /info-page-title/);
  assert.match(source, /info-page-description/);
  assert.match(source, /info-page-intro-grid-single/);
  assert.doesNotMatch(source, /<main/);
});

test('contact page avoids the generic surface-card treatment', async () => {
  const source = await readSource('src/app/contact/page.tsx');

  assert.match(source, /info-contact-card/);
  assert.match(source, /info-mail-action/);
  assert.doesNotMatch(source, /surface-card/);
  assert.doesNotMatch(source, /TriangleAlert/);
});

test('about page presents categories and principles as content, not tiles', async () => {
  const source = await readSource('src/app/about/page.tsx');

  assert.doesNotMatch(source, /CultureCategoryBadge/);
  assert.doesNotMatch(source, /rounded-lg bg-\[var\(--color-surface-chip\)\]/);
  assert.match(source, /info-route-list/);
  assert.doesNotMatch(source, /divide-y/);
  assert.match(source, /info-category-grid/);
  assert.match(source, /ABOUT_STEPS/);
});

test('contact topics stay as an open list instead of a stacked card treatment', async () => {
  const source = await readSource('src/app/contact/page.tsx');

  assert.match(source, /info-topic-list/);
  assert.doesNotMatch(source, /divide-y/);
  assert.doesNotMatch(source, /border-y/);
  assert.match(source, /info-contact-card/);
});
