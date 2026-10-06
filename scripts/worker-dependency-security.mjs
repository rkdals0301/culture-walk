import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export const findReviewedRuntimeDependencies = async (root, packages) => {
  try { await access(path.join(root, 'worker.js')); }
  catch { throw new Error('Worker build is missing; runtime dependency review cannot proceed.'); }
  const found = [];
  const walk = async directory => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      const relative = path.relative(root, file).replaceAll('\\', '/');
      const packaged = packages.find(name => relative.endsWith(`node_modules/${name}`));
      if (packaged) { found.push({ package: packaged, file: relative }); continue; }
      if (entry.isDirectory()) await walk(file);
      else if (/\.[cm]?js$/.test(entry.name)) {
        const source = await readFile(file, 'utf8');
        for (const name of packages) {
          if (source.includes(`node_modules/${name}/`)) found.push({ package: name, file: relative });
        }
      }
    }
  };
  await walk(root);
  return found;
};
