import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_MAX_APP_CHUNK_BYTES = 64 * 1024;
const DEFAULT_MAX_APP_TOTAL_BYTES = 160 * 1024;
const DEFAULT_MAX_EMITTED_CHUNK_BYTES = 256 * 1024;
const DEFAULT_MAX_EMITTED_TOTAL_BYTES = 1_536 * 1024;

const readPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const walkJsFiles = async directory => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkJsFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
};

export const inspectClientBundle = async ({
  root = path.join(process.cwd(), '.open-next', 'assets', '_next', 'static', 'chunks', 'app'),
  maxChunkBytes = readPositiveInt(process.env.BUNDLE_MAX_APP_CHUNK_BYTES, DEFAULT_MAX_APP_CHUNK_BYTES),
  maxTotalBytes = readPositiveInt(process.env.BUNDLE_MAX_APP_TOTAL_BYTES, DEFAULT_MAX_APP_TOTAL_BYTES),
  maxEmittedChunkBytes = readPositiveInt(
    process.env.BUNDLE_MAX_EMITTED_CHUNK_BYTES,
    DEFAULT_MAX_EMITTED_CHUNK_BYTES
  ),
  maxEmittedTotalBytes = readPositiveInt(
    process.env.BUNDLE_MAX_EMITTED_TOTAL_BYTES,
    DEFAULT_MAX_EMITTED_TOTAL_BYTES
  ),
} = {}) => {
  const files = await walkJsFiles(root);
  if (files.length === 0) throw new Error('No app JavaScript chunks found under ' + root);

  const emittedRoot = path.dirname(root);
  const emittedFiles = await walkJsFiles(emittedRoot);
  const [chunks, emittedChunks] = await Promise.all([
    Promise.all(files.map(async file => ({ file, bytes: (await stat(file)).size }))),
    Promise.all(emittedFiles.map(async file => ({ file, bytes: (await stat(file)).size }))),
  ]);
  const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.bytes, 0);
  const largest = chunks.reduce((current, chunk) => (chunk.bytes > current.bytes ? chunk : current));
  const emittedTotalBytes = emittedChunks.reduce((sum, chunk) => sum + chunk.bytes, 0);
  const largestEmitted = emittedChunks.reduce((current, chunk) => (chunk.bytes > current.bytes ? chunk : current), {
    file: null,
    bytes: 0,
  });

  return {
    chunks,
    totalBytes,
    largest,
    emittedChunks,
    emittedTotalBytes,
    largestEmitted,
    maxChunkBytes,
    maxTotalBytes,
    maxEmittedChunkBytes,
    maxEmittedTotalBytes,
    ok:
      largest.bytes <= maxChunkBytes &&
      totalBytes <= maxTotalBytes &&
      largestEmitted.bytes <= maxEmittedChunkBytes &&
      emittedTotalBytes <= maxEmittedTotalBytes,
  };
};

const formatKb = bytes => (bytes / 1024).toFixed(1);

const main = async () => {
  const result = await inspectClientBundle();
  console.log(
    '[bundle-budget] app total=' +
      formatKb(result.totalBytes) +
      'KB/' +
      formatKb(result.maxTotalBytes) +
      'KB largest=' +
      formatKb(result.largest.bytes) +
      'KB/' +
      formatKb(result.maxChunkBytes) +
      'KB (' +
      path.relative(process.cwd(), result.largest.file) +
      ')'
  );
  console.log(
    '[bundle-budget] all emitted total=' +
      formatKb(result.emittedTotalBytes) +
      'KB/' +
      formatKb(result.maxEmittedTotalBytes) +
      'KB largest=' +
      formatKb(result.largestEmitted.bytes) +
      'KB/' +
      formatKb(result.maxEmittedChunkBytes) +
      'KB' +
      (result.largestEmitted.file ? ' (' + path.relative(process.cwd(), result.largestEmitted.file) + ')' : '')
  );

  if (!result.ok) {
    throw new Error('Client app JavaScript bundle budget exceeded.');
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
