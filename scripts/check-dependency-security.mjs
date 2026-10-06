import { spawnSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { evaluateDependencySecurity } from './dependency-security-policy.mjs';
import { findReviewedRuntimeDependencies } from './worker-dependency-security.mjs';

const main = async () => {
  const policy = JSON.parse(await readFile('security/dependency-audit-policy.json', 'utf8'));
  if (process.argv.includes('--worker')) {
    const packages = [...new Set(policy.exceptions.map(exception => exception.package))];
    const found = await findReviewedRuntimeDependencies('.open-next', packages);
    console.log(`[security] reviewed development dependencies in Worker=${found.length}`);
    for (const item of found) console.error(`[security] BLOCK ${item.package}: ${item.file}`);
    if (found.length) process.exitCode = 1;
    return;
  }
  const npmCli = process.env.npm_execpath || path.resolve(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  const audit = spawnSync(process.execPath, [npmCli, 'audit', '--json'], {
    encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024, timeout: 120_000,
  });
  if (audit.error || ![0, 1].includes(audit.status)) throw new Error('npm audit did not complete successfully.');
  const report = JSON.parse(audit.stdout);
  const lockfile = JSON.parse(await readFile('package-lock.json', 'utf8'));
  const evaluation = evaluateDependencySecurity(report, lockfile, policy);
  const outputDir = 'test-results/dependency-security';
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'report.json'), JSON.stringify({
    generatedAt: new Date().toISOString(), counts: report.metadata?.vulnerabilities, ...evaluation,
  }, null, 2) + '\n');
  console.log(`[security] blocked=${evaluation.blocked.length}, reviewed-development-exceptions=${evaluation.accepted.length}, informational=${evaluation.informational.length}`);
  for (const item of evaluation.blocked) console.error(`[security] BLOCK ${item.package} (${item.severity}): ${item.advisories.join(', ')}`);
  for (const item of evaluation.accepted) console.warn(`[security] REVIEWED ${item.package}: ${item.advisories.join(', ')}`);
  if (evaluation.blocked.length) process.exitCode = 1;
};

main().catch(error => { console.error(`[security] ${error.message}`); process.exitCode = 1; });
