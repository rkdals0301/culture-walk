import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const imagesDir = path.join(publicDir, 'assets', 'images');
const faviconSource = await fs.readFile(path.join(publicDir, 'favicon.svg'), 'utf8');
const logoMarkDataUri = `data:image/png;base64,${(await fs.readFile(path.join(imagesDir, 'logo-mark.png'))).toString('base64')}`;
const faviconSvg = Buffer.from(faviconSource);
const logoMarkSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><image href="${logoMarkDataUri}" width="512" height="512" preserveAspectRatio="xMidYMid meet"/></svg>`
);

const pngForSize = size => sharp(faviconSvg, { density: 512 }).resize(size, size).png().toBuffer();
const [png16, png32, png48, png180, png192, png512] = await Promise.all([16, 32, 48, 180, 192, 512].map(pngForSize));
const logo128 = await sharp(logoMarkSvg, { density: 512 }).resize(128, 128).png().toBuffer();

await Promise.all([
  fs.writeFile(path.join(publicDir, 'favicon-16x16.png'), png16),
  fs.writeFile(path.join(publicDir, 'favicon-32x32.png'), png32),
  fs.writeFile(path.join(publicDir, 'favicon-48x48.png'), png48),
  fs.writeFile(path.join(publicDir, 'apple-touch-icon-180x180.png'), png180),
  fs.writeFile(path.join(publicDir, 'icon-192x192.png'), png192),
  fs.writeFile(path.join(publicDir, 'icon-512x512.png'), png512),
  fs.writeFile(path.join(imagesDir, 'logo-128.png'), logo128),
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

const ogImageSource = await fs.readFile(path.join(imagesDir, 'og-image-source.svg'), 'utf8');
const ogLogoDataUri = `data:image/png;base64,${(await fs.readFile(path.join(imagesDir, 'logo-128.png'))).toString('base64')}`;
const ogImageSvg = ogImageSource.replace('/assets/images/logo-128.png', ogLogoDataUri);

await sharp(Buffer.from(ogImageSvg), { density: 144 })
  .resize(1200, 630)
  .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
  .toFile(path.join(imagesDir, 'og-image.png'));

const searchThumbnailSource = await fs.readFile(path.join(imagesDir, 'search-thumbnail-source.svg'), 'utf8');
const searchThumbnailSvg = searchThumbnailSource.replace('/assets/images/logo-128.png', ogLogoDataUri);

await sharp(Buffer.from(searchThumbnailSvg), { density: 144 })
  .resize(1200, 1200)
  .png({ compressionLevel: 9 })
  .toFile(path.join(imagesDir, 'search-thumbnail.png'));

const fallbackSource = await fs.readFile(path.join(imagesDir, 'fallback-place.svg'), 'utf8');
await sharp(Buffer.from(fallbackSource.replace('/assets/images/logo-mark.png', logoMarkDataUri)))
  .resize(960, 1324)
  .webp({ quality: 85, effort: 6 })
  .toFile(path.join(imagesDir, 'fallback-place.webp'));

console.log('Generated favicon PNG/ICO, logo-128.png, OG images, and fallback-place.webp');
