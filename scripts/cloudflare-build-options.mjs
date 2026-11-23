import { createHash } from 'node:crypto';

export const BUILD_IMAGE = 'node:22-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392';

export const selectBuildBackend = (platform, requested = 'auto', dockerAvailable = false) => {
  if (!['auto', 'native', 'docker'].includes(requested)) throw new Error(`Unknown build backend: ${requested}`);
  if (requested === 'docker' && !dockerAvailable) throw new Error('Docker with a Linux engine is required for this build.');
  if (requested === 'docker') return 'docker';
  return platform === 'win32' && requested === 'auto' && dockerAvailable ? 'docker' : 'native';
};

export const createBuildVolumeName = root =>
  `culture-walk-build-${createHash('sha256').update(root).digest('hex').slice(0, 16)}`;

export const createDependencySignature = (packageJson, lockfile, runtime = [process.version, process.arch]) => {
  const pkg = JSON.parse(packageJson);
  const lifecycle = Object.fromEntries(['preinstall', 'install', 'postinstall', 'prepare']
    .filter(name => pkg.scripts?.[name]).map(name => [name, pkg.scripts[name]]));
  return createHash('sha256').update(JSON.stringify([
    pkg.dependencies, pkg.devDependencies, pkg.optionalDependencies, pkg.overrides,
    pkg.engines, pkg.packageManager, lifecycle, runtime,
  ])).update(lockfile).digest('hex');
};

export const validateBuildSourcePath = value => {
  const relative = value.replaceAll('\\', '/');
  const segments = relative.split('/');
  if (!relative || relative.startsWith('/') || /^[a-z]:/i.test(relative) || segments.includes('..') ||
      segments.includes('.') || segments.includes('') ||
      ['.git', 'node_modules', '.next', '.open-next', '.wrangler', 'test-results'].includes(segments[0])) {
    throw new Error(`Invalid build source path: ${value}`);
  }
  return relative;
};
