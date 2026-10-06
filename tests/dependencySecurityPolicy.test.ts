import assert from 'node:assert/strict';
import test from 'node:test';

const modulePath = new URL('../scripts/dependency-security-policy.mjs', import.meta.url).href;
const securityModule = import(modulePath).catch(() => ({}));
const advisoryUrl = 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm';
const policy = {
  minimumSeverity: 'moderate',
  exceptions: [{
    advisory: advisoryUrl,
    package: 'braces',
    version: '3.0.3',
    scope: 'development',
    reviewed: '2026-10-06',
    expires: '2026-11-06',
    reason: 'No fixed release; trusted build globs only, absent from the deployed Worker.',
  }],
};
const advisory = (name: string, severity = 'high', url = advisoryUrl) => ({ name, severity, url, title: `${name} advisory` });
const report = (vulnerabilities: Record<string, unknown>) => ({ vulnerabilities, metadata: { vulnerabilities: {} } });
const vulnerability = (name: string, via: unknown[], severity = 'high') => ({
  name, via, severity, nodes: [`node_modules/${name}`],
});
const lock = { packages: {
  'node_modules/braces': { version: '3.0.3', dev: true },
  'node_modules/tailwindcss': { version: '3.4.19', dev: true },
  'node_modules/next': { version: '16.3.3' },
} };
const evaluate = async (audit: unknown, options: {
  date?: string;
  lockfile?: { packages: Record<string, { version: string; dev?: boolean }> };
} = {}) => {
  const security = await securityModule;
  assert.equal(typeof security.evaluateDependencySecurity, 'function', 'dependency security policy evaluator must exist');
  return security.evaluateDependencySecurity(audit, options.lockfile ?? lock, policy, { date: options.date ?? '2026-10-06' });
};

test('a production Critical advisory blocks deployment', async () => {
  const result = await evaluate(report({ next: vulnerability('next', [advisory('next', 'critical', 'https://github.com/advisories/NEW-NEXT')], 'critical') }));
  assert.deepEqual(result.blocked.map((item: { package: string }) => item.package), ['next']);
});

test('the reviewed development-only advisory includes transitive parent warnings', async () => {
  const result = await evaluate(report({
    braces: vulnerability('braces', [advisory('braces')]),
    tailwindcss: vulnerability('tailwindcss', ['braces']),
  }));
  assert.equal(result.blocked.length, 0);
  assert.deepEqual(result.accepted.map((item: { package: string }) => item.package).sort(), ['braces', 'tailwindcss']);
});

test('a development exception cannot exempt a production dependency', async () => {
  const productionLock = { packages: { ...lock.packages, 'node_modules/braces': { version: '3.0.3' } } };
  const result = await evaluate(report({ braces: vulnerability('braces', [advisory('braces')]) }), { lockfile: productionLock });
  assert.equal(result.blocked.length, 1);
});

test('a different advisory or dependency version is never covered by an old exception', async () => {
  const result = await evaluate(report({ braces: vulnerability('braces', [advisory('braces', 'high', 'https://github.com/advisories/NEW-BRACES')]) }));
  assert.equal(result.blocked.length, 1);
  const changedLock = { packages: { 'node_modules/braces': { version: '3.0.2', dev: true } } };
  assert.equal((await evaluate(report({ braces: vulnerability('braces', [advisory('braces')]) }), { lockfile: changedLock })).blocked.length, 1);
});

test('exceptions stop applying on their expiry date', async () => {
  assert.equal((await evaluate(report({ braces: vulnerability('braces', [advisory('braces')]) }), { date: '2026-11-06' })).blocked.length, 1);
});

test('malformed reports and unresolved advisory chains fail closed', async () => {
  await assert.rejects(() => evaluate({ error: { code: 'REGISTRY_ERROR' } }), /audit|registry|report/i);
  assert.equal((await evaluate(report({ tailwindcss: vulnerability('tailwindcss', ['missing-package']) }))).blocked.length, 1);
});

test('moderate advisories are blocked and low advisories remain visible', async () => {
  const result = await evaluate(report({
    next: vulnerability('next', [advisory('next', 'moderate', 'https://github.com/advisories/NEW-MODERATE')], 'moderate'),
    braces: vulnerability('braces', [advisory('braces', 'low', 'https://github.com/advisories/NEW-LOW')], 'low'),
  }));
  assert.equal(result.blocked.length, 1);
  assert.equal(result.informational.length, 1);
});

test('an invalid calendar date cannot make an exception permanent', async () => {
  const security = await securityModule;
  assert.equal(typeof security.evaluateDependencySecurity, 'function');
  const invalidPolicy = { ...policy, exceptions: [{ ...policy.exceptions[0], expires: '2026-99-06' }] };
  const result = security.evaluateDependencySecurity(report({ braces: vulnerability('braces', [advisory('braces')]) }), lock, invalidPolicy, { date: '2026-10-06' });
  assert.equal(result.blocked.length, 1);
});

test('a severity escalation requires a new review even for the same advisory', async () => {
  const result = await evaluate(report({ braces: vulnerability('braces', [advisory('braces', 'critical')], 'critical') }));
  assert.equal(result.blocked.length, 1);
});
