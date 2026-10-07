import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('production smoke checks the home document and stops warming after its first cache hit', async () => {
  const paths: string[] = [];
  const culture = { id: 42, title: '테스트 축제' };
  const server = createServer((request, response) => {
    const pathname = new URL(request.url!, 'http://localhost').pathname;
    paths.push(pathname);
    response.setHeader('cf-cache-status', 'HIT');
    response.setHeader('x-culture-data-source', 'kv-read-model');
    response.setHeader('cache-control', pathname === '/api/health' ? 'no-store' : 'public, max-age=60');
    response.setHeader('content-type', pathname.startsWith('/api/') ? 'application/json' : 'text/html');
    response.end(pathname === '/api/health'
      ? JSON.stringify({ ok: true, status: 'healthy', readModel: { available: true, itemCount: 1 } })
      : pathname === '/api/cultures/feed'
        ? JSON.stringify({ items: [culture] })
        : pathname === '/api/cultures/42'
          ? JSON.stringify(culture)
          : pathname === '/sitemap.xml' ? '<urlset></urlset>' : '<html><body>문화산책</body></html>');
  });
  const base = path.resolve('test-results/smoke-route-fixtures');
  await mkdir(base, { recursive: true });
  const output = await mkdtemp(path.join(base, 'run-'));
  try {
    await new Promise<void>(resolve => { server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const outcome = await new Promise<{ code: number | null; log: string }>((resolve, reject) => {
      const child = spawn(process.execPath, ['scripts/production-smoke.mjs'], {
        windowsHide: true,
        env: { ...process.env, SMOKE_BASE_URL: `http://127.0.0.1:${address.port}`,
          SMOKE_OUTPUT_DIR: output, SMOKE_REQUIRE_HEALTHY: 'true',
          SMOKE_MAX_REQUEST_TTFB_MS: '', SMOKE_MAX_EDGE_HIT_TTFB_MS: '', SMOKE_MAX_READ_MODEL_BYTES: '' },
        timeout: 20_000,
      });
      let log = '';
      child.stdout.on('data', data => { log += data; });
      child.stderr.on('data', data => { log += data; });
      child.on('error', reject);
      child.on('close', code => { resolve({ code, log }); });
    });
    assert.equal(outcome.code, 0, outcome.log);
    assert.equal(paths.filter(value => value === '/').length, 1);
    const report = JSON.parse(await readFile(path.join(output, 'report.json'), 'utf8'));
    assert.equal(report.status, 'healthy');
    assert.equal(report.checks.filter((check: { label: string }) => check.label.startsWith('home-page')).length, 1);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => { server.close(() => resolve()); });
    const relative = path.relative(base, output);
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
    await rm(output, { recursive: true, force: true });
  }
});
