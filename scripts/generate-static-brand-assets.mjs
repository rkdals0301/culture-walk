import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const imagesDir = path.join(publicDir, 'assets', 'images');
const faviconSvg = await fs.readFile(path.join(publicDir, 'favicon.svg'));

const pngForSize = size => sharp(faviconSvg, { density: 512 }).resize(size, size).png().toBuffer();
const [png16, png32, png48, png128, png180] = await Promise.all([16, 32, 48, 128, 180].map(pngForSize));

await Promise.all([
  fs.writeFile(path.join(publicDir, 'favicon-48x48.png'), png48),
  fs.writeFile(path.join(publicDir, 'apple-touch-icon-180x180.png'), png180),
  fs.writeFile(path.join(imagesDir, 'logo-128.png'), png128),
]);

const icoPngs = [
  { size: 16, data: png16 },
  { size: 32, data: png32 },
  { size: 48, data: png48 },
];
const headerSize = 6 + icoPngs.length * 16;
let offset = headerSize;
const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoPngs.length, 4);
icoPngs.forEach(({ size, data }, index) => {
  const entry = 6 + index * 16;
  header.writeUInt8(size === 256 ? 0 : size, entry);
  header.writeUInt8(size === 256 ? 0 : size, entry + 1);
  header.writeUInt8(0, entry + 2);
  header.writeUInt8(0, entry + 3);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(data.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += data.length;
});
await fs.writeFile(path.join(publicDir, 'favicon.ico'), Buffer.concat([header, ...icoPngs.map(item => item.data)]));

await sharp(path.join(imagesDir, 'og-image-source.svg'), { density: 144 })
  .resize(1200, 630)
  .png({ compressionLevel: 9 })
  .toFile(path.join(imagesDir, 'og-image.png'));

await sharp(path.join(imagesDir, 'search-thumbnail-source.svg'), { density: 144 })
  .resize(1200, 1200)
  .png({ compressionLevel: 9 })
  .toFile(path.join(imagesDir, 'search-thumbnail.png'));

console.log('Generated favicon PNG/ICO, logo-128.png, og-image.png, and search-thumbnail.png');
