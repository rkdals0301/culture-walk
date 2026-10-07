import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const buildInputs = [
  'src', 'public', 'db', 'package.json', 'package-lock.json', 'tsconfig.json',
  'next.config.mjs', 'open-next.config.ts', 'worker.js', 'wrangler.jsonc',
  'tailwind.config.ts', 'postcss.config.js', 'scripts/check-opennext-platform.mjs',
  'scripts/prepare-opennext-output.mjs',
];
const relevantEnv = /^(?:NEXT_PUBLIC_|NEXT_|OPEN_NEXT_|KAKAO_MAP_APP_KEY$|SITE_URL$|APP_BASE_URL$|TOUR_API_|SYNC_TOKEN$|GOOGLE_SITE_VERIFICATION$|NAVER_SITE_VERIFICATION$|NODE_ENV$|NODE_OPTIONS$)/;

export const createE2EBuildFingerprint = async (root, env = process.env) => {
  const hash = createHash('sha256');
  const add = value => { hash.update(String(Buffer.byteLength(value))); hash.update(':'); hash.update(value); };
  add(JSON.stringify([process.version, process.platform, process.arch]));
  for (const name of Object.keys(env).filter(name => relevantEnv.test(name)).sort()) {
    add(name); add(String(env[name]));
  }
  const entries = [];
  const walkDirectory = async relative => {
    const children = (await readdir(path.join(root, relative), { withFileTypes: true }))
      .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const child of children) {
      const next = `${relative}/${child.name}`;
      if (child.isDirectory()) await walkDirectory(next);
      else if (child.isFile()) entries.push({ relative: next });
      else if (child.isSymbolicLink()) await walk(next);
    }
  };
  const walk = async relative => {
    let info;
    try { info = await stat(path.join(root, relative)); }
    catch (error) { if (error.code === 'ENOENT') { entries.push({ relative, missing: true }); return; } throw error; }
    if (info.isDirectory()) await walkDirectory(relative);
    else if (info.isFile()) entries.push({ relative });
  };
  const environmentFiles = (await readdir(root)).filter(name => /^\.env(?:\.|$)/.test(name) || name === '.dev.vars').sort();
  for (const input of [...buildInputs, ...environmentFiles]) await walk(input);
  // Bound file I/O, but feed the digest in the original deterministic order.
  for (let index = 0; index < entries.length; index += 16) {
    const batch = entries.slice(index, index + 16);
    const contents = await Promise.all(batch.map(entry => entry.missing ? null : readFile(path.join(root, entry.relative))));
    batch.forEach((entry, offset) => {
      if (entry.missing) add(`missing:${entry.relative}`);
      else { add(entry.relative); add(contents[offset]); }
    });
  }
  return hash.digest('hex');
};

export const canReuseE2EBuild = async (root, fingerprint) => {
  try {
    const output = path.join(root, '.open-next');
    const [worker, handler, assets, manifest] = await Promise.all([
      stat(path.join(output, 'worker.js')), stat(path.join(output, 'server-functions/default/handler.mjs')),
      stat(path.join(output, 'assets')),
      readFile(path.join(output, 'e2e-build-fingerprint.json'), 'utf8').then(JSON.parse),
    ]);
    return worker.isFile() && worker.size > 0 && handler.isFile() && handler.size > 0 &&
      assets.isDirectory() && manifest.fingerprint === fingerprint;
  } catch { return false; }
};
