import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { performance } from 'node:perf_hooks';

const DEFAULT_BASE_URL = 'https://culturewalk.gangmin.dev';
const DEFAULT_OUTPUT_DIR = 'test-results/production-smoke';
const REQUEST_TIMEOUT_MS = 15_000;
const KNOWN_DATA_SOURCES = new Set(['kv-read-model', 'kv-detail-cache', 'd1-read-through']);

const baseUrl = new URL(process.env.SMOKE_BASE_URL || DEFAULT_BASE_URL);
const outputDir = process.env.SMOKE_OUTPUT_DIR || DEFAULT_OUTPUT_DIR;
const requireHealthy = ['1', 'true', 'yes'].includes(String(process.env.SMOKE_REQUIRE_HEALTHY || '').toLowerCase());

const failures = [];
const warnings = [];
const checks = [];

const round = value => Math.round(value * 10) / 10;
const addFailure = message => failures.push(message);
const addWarning = message => warnings.push(message);

const parseJson = (body, label) => {
  try {
    return JSON.parse(body);
  } catch {
    addFailure(`${label}: JSON 응답을 파싱하지 못했습니다.`);
    return null;
  }
};

const readEdgeHeaders = response => {
  const cfRay = response.headers.get('cf-ray');
  return {
    cacheStatus: response.headers.get('cf-cache-status'),
    age: response.headers.get('age'),
    cfRay,
    colo: cfRay?.split('-').at(-1) || null,
    dataSource: response.headers.get('x-culture-data-source'),
    cacheControl: response.headers.get('cache-control'),
    contentType: response.headers.get('content-type'),
  };
};

const request = async (label, pathname, { expectedStatus = 200 } = {}) => {
  const url = new URL(pathname, baseUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'culture-walk-production-smoke/1.0',
      },
    });
    const headersAt = performance.now();
    const body = await response.text();
    const finishedAt = performance.now();
    const edge = readEdgeHeaders(response);
    const result = {
      label,
      url: url.toString(),
      status: response.status,
      ok: response.status === expectedStatus,
      ttfbMs: round(headersAt - startedAt),
      totalMs: round(finishedAt - startedAt),
      bytes: Buffer.byteLength(body),
      ...edge,
    };
    checks.push(result);

    if (!result.ok) {
      addFailure(`${label}: HTTP ${response.status} (expected ${expectedStatus})`);
    }

    return { response, body, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addFailure(`${label}: 요청 실패 - ${message}`);
    checks.push({
      label,
      url: url.toString(),
      status: null,
      ok: false,
      error: message,
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const validatePublicDataSource = (result, label) => {
  if (!result?.dataSource) {
    addWarning(`${label}: X-Culture-Data-Source 헤더가 없습니다.`);
    return;
  }
  if (!KNOWN_DATA_SOURCES.has(result.dataSource)) {
    addFailure(`${label}: 알 수 없는 data source '${result.dataSource}'`);
  }
};

const observeCacheWarmup = (attempts, label) => {
  const statuses = attempts.map(attempt => attempt?.result?.cacheStatus).filter(Boolean);
  if (statuses.length === 0) {
    addWarning(`${label}: CF-Cache-Status를 관측하지 못했습니다.`);
    return;
  }
  if (!statuses.includes('HIT')) {
    addWarning(`${label}: 반복 호출에서 HIT를 관측하지 못했습니다. (${statuses.join(' -> ')})`);
  }
};

const run = async () => {
  const health = await request('health', '/api/health');
  if (health) {
    const healthBody = parseJson(health.body, 'health');
    const cacheControl = health.result.cacheControl || '';
    if (!cacheControl.includes('no-store')) {
      addFailure(`health: Cache-Control이 no-store가 아닙니다. (${cacheControl || 'missing'})`);
    }
    if (health.result.cacheStatus && !['BYPASS', 'DYNAMIC'].includes(health.result.cacheStatus)) {
      addWarning(`health: 예상과 다른 CF-Cache-Status '${health.result.cacheStatus}'`);
    }
    if (healthBody) {
      if (healthBody.ok !== true) addFailure('health: ok=true가 아닙니다.');
      if (healthBody.readModel?.available !== true || !(healthBody.readModel?.itemCount > 0)) {
        addFailure('health: 사용 가능한 KV read model이 없습니다.');
      }
      if (requireHealthy && healthBody.status !== 'healthy') {
        addFailure(`health: scheduled smoke는 healthy가 필요하지만 '${healthBody.status}' 입니다. reason=${healthBody.reason || 'unknown'}`);
      } else if (healthBody.status !== 'healthy') {
        addWarning(`health: 현재 상태가 '${healthBody.status}' 입니다. reason=${healthBody.reason || 'unknown'}`);
      }
    }
  }

  const feedPath = '/api/cultures/feed?limit=5&category=all&region=all&free=0';
  const feedAttempts = [];
  for (let index = 1; index <= 3; index += 1) {
    feedAttempts.push(await request(`feed-${index}`, feedPath));
  }
  feedAttempts.forEach((attempt, index) => validatePublicDataSource(attempt?.result, `feed-${index + 1}`));
  observeCacheWarmup(feedAttempts, 'feed');

  const feedBody = feedAttempts[0] ? parseJson(feedAttempts[0].body, 'feed') : null;
  const selectedCulture = Array.isArray(feedBody?.items) ? feedBody.items[0] : null;
  if (!selectedCulture || !Number.isSafeInteger(Number(selectedCulture.id)) || !selectedCulture.title) {
    addFailure('feed: smoke에 사용할 활성 행사 항목을 찾지 못했습니다.');
  }

  if (selectedCulture) {
    const detailPath = `/api/cultures/${selectedCulture.id}`;
    const detailAttempts = [];
    for (let index = 1; index <= 2; index += 1) {
      detailAttempts.push(await request(`detail-${index}`, detailPath));
    }
    detailAttempts.forEach((attempt, index) => validatePublicDataSource(attempt?.result, `detail-${index + 1}`));
    observeCacheWarmup(detailAttempts, 'detail');

    const detailBody = detailAttempts[0] ? parseJson(detailAttempts[0].body, 'detail') : null;
    if (Number(detailBody?.id) !== Number(selectedCulture.id) || !detailBody?.title) {
      addFailure('detail: feed에서 고른 행사와 상세 응답이 일치하지 않습니다.');
    }

    await request('map-detail-page', `/map/${selectedCulture.id}`);
  }

  await request('map-page', '/map');
  const sitemap = await request('sitemap', '/sitemap.xml');
  if (sitemap && !sitemap.body.includes('<urlset')) {
    addFailure('sitemap: urlset XML을 찾지 못했습니다.');
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: baseUrl.toString(),
    requireHealthy,
    status: failures.length > 0 ? 'failed' : warnings.length > 0 ? 'warning' : 'healthy',
    failures,
    warnings,
    checks,
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const rows = checks
    .map(check => {
      const status = check.status ?? 'ERR';
      const cache = check.cacheStatus || '-';
      const source = check.dataSource || '-';
      const age = check.age || '-';
      const colo = check.colo || '-';
      const ttfb = check.ttfbMs ?? '-';
      const total = check.totalMs ?? '-';
      return `| ${check.label} | ${status} | ${cache} | ${source} | ${age} | ${colo} | ${ttfb} | ${total} |`;
    })
    .join('\n');

  const summary = [
    '# Culture Walk Production Smoke',
    '',
    `- Result: **${report.status.toUpperCase()}**`,
    `- Base URL: ${baseUrl.toString()}`,
    `- Generated: ${report.generatedAt}`,
    `- Require healthy: ${requireHealthy}`,
    '',
    '| Check | HTTP | CF Cache | Data source | Age | PoP | TTFB ms | Total ms |',
    '| --- | ---: | --- | --- | ---: | --- | ---: | ---: |',
    rows || '| no checks | - | - | - | - | - | - | - |',
    '',
    ...(warnings.length ? ['## Warnings', ...warnings.map(item => `- ${item}`), ''] : []),
    ...(failures.length ? ['## Failures', ...failures.map(item => `- ${item}`), ''] : []),
  ].join('\n');

  await writeFile(path.join(outputDir, 'summary.md'), `${summary}\n`, 'utf8');
  console.log(summary);

  if (failures.length > 0) process.exitCode = 1;
};

await run();
