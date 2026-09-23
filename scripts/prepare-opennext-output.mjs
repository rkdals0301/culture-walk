import { rm } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = path.resolve(process.cwd(), '.open-next');
const relative = path.relative(process.cwd(), outputDirectory);

if (relative.startsWith('..') || path.isAbsolute(relative)) {
  throw new Error('Refusing to remove an OpenNext output path outside the project.');
}

await rm(outputDirectory, { recursive: true, force: true });
console.log('[opennext] cleared generated .open-next output');
