import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.join(__dirname, '..', 'images');
const indexHtmlPath = path.join(__dirname, '..', 'index.html');

const files = fs.readdirSync(imagesDir).filter(name => /\.(jpe?g|png)$/i.test(name));

let totalOriginalSize = 0;
let totalFinalSize = 0;

for (const file of files) {
  const inputPath = path.join(imagesDir, file);
  const ext = path.extname(file);
  const baseName = path.basename(file, ext);
  const outputPath = path.join(imagesDir, `${baseName}.webp`);
  
  const originalSize = fs.statSync(inputPath).size;
  totalOriginalSize += originalSize;

  await sharp(inputPath)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(outputPath);
    
  const finalSize = fs.statSync(outputPath).size;
  totalFinalSize += finalSize;
  
  fs.unlinkSync(inputPath);
  
  console.log(`Optimized ${file}: ${Math.round(originalSize / 1024)}KB -> ${Math.round(finalSize / 1024)}KB`);
}

// Update index.html
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
indexHtml = indexHtml.replace(/\.jpg/g, '.webp');
indexHtml = indexHtml.replace(/\.jpeg/g, '.webp');
fs.writeFileSync(indexHtmlPath, indexHtml);

console.log(`\nAll done! Total size: ${Math.round(totalOriginalSize / 1024 / 1024)}MB -> ${Math.round(totalFinalSize / 1024 / 1024)}MB`);
