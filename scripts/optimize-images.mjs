import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const imagesDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'images');
const maxBytes = 600 * 1024;

async function optimizeImage(filePath) {
  const originalSize = fs.statSync(filePath).size;
  if (originalSize <= maxBytes) {
    return { file: path.basename(filePath), originalSize, finalSize: originalSize, skipped: true };
  }

  let maxWidth = 2000;
  let result = null;

  while (maxWidth >= 700 && !result) {
    for (let quality = 92; quality >= 55; quality -= 3) {
      const buffer = await sharp(filePath)
        .rotate()
        .resize({ width: maxWidth, withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();

      if (buffer.length <= maxBytes) {
        fs.writeFileSync(filePath, buffer);
        result = { file: path.basename(filePath), originalSize, finalSize: buffer.length, quality, maxWidth };
        break;
      }
    }
    maxWidth -= 150;
  }

  if (!result) {
    const buffer = await sharp(filePath)
      .rotate()
      .resize({ width: 700, withoutEnlargement: true })
      .jpeg({ quality: 55, mozjpeg: true })
      .toBuffer();
    fs.writeFileSync(filePath, buffer);
    result = {
      file: path.basename(filePath),
      originalSize,
      finalSize: buffer.length,
      quality: 55,
      maxWidth: 700,
      forced: true,
    };
  }

  return result;
}

const files = fs.readdirSync(imagesDir)
  .filter((name) => /\.jpe?g$/i.test(name))
  .map((name) => path.join(imagesDir, name))
  .sort();

const results = [];
for (const file of files) {
  results.push(await optimizeImage(file));
}

const over = results.filter((r) => r.finalSize > maxBytes);
const changed = results.filter((r) => !r.skipped);

console.log(`Optimized ${changed.length}/${results.length} images`);
for (const r of changed) {
  console.log(
    `${r.file}: ${Math.round(r.originalSize / 1024)}KB -> ${Math.round(r.finalSize / 1024)}KB (q${r.quality}, ${r.maxWidth}px)`
  );
}
if (over.length) {
  console.error('Still over 600KB:', over.map((r) => r.file));
  process.exit(1);
}
