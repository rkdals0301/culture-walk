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
  assert.match(source, /text-\[2rem\] font-semibold/);
  assert.match(source, /xl:grid-cols-\[minmax\(0,1fr\)_minmax\(16rem,0\.6fr\)\]/);
  assert.doesNotMatch(source, /lg:grid-cols-\[minmax\(0,1fr\)_minmax\(16rem,0\.6fr\)\]/);
  assert.match(source, /lg:text-\[3\.5rem\][\s\S]*xl:text-\[4rem\]/);
  assert.doesNotMatch(source, /<main/);
});

test('contact page avoids the generic surface-card treatment', async () => {
  const source = await readSource('src/app/contact/page.tsx');

  assert.match(source, /contact-method/);
  assert.doesNotMatch(source, /surface-card/);
  assert.doesNotMatch(source, /TriangleAlert/);
});

test('about page presents categories and principles as content, not tiles', async () => {
  const source = await readSource('src/app/about/page.tsx');

  assert.doesNotMatch(source, /CultureCategoryBadge/);
  assert.doesNotMatch(source, /rounded-lg bg-\[var\(--color-surface-chip\)\]/);
  assert.match(source, /info-route-list/);
  assert.doesNotMatch(source, /divide-y/);
  assert.match(source, />01<|>01<\/p>/);
});

test('contact topics stay as an open list instead of a stacked card treatment', async () => {
  const source = await readSource('src/app/contact/page.tsx');

  assert.match(source, /contact-topics-list/);
  assert.doesNotMatch(source, /divide-y/);
  assert.doesNotMatch(source, /border-y/);
  assert.match(source, /contact-method[^']*self-start/);
});
