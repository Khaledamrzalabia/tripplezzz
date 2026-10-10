const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (/\.(png|jpg|jpeg)$/i.test(entry.name)) {
      const ext = path.extname(entry.name);
      const base = path.basename(entry.name, ext);
      const webpPath = path.join(dir, `${base}.webp`);

      const stats = fs.statSync(fullPath);
      // Only convert files larger than 50KB or specific target files
      try {
        console.log(`Optimizing: ${path.relative(PUBLIC_DIR, fullPath)} (${(stats.size / 1024).toFixed(1)} KB)...`);
        
        // If it's a huge PNG/JPG, generate high-quality webp
        await sharp(fullPath)
          .webp({ quality: 85, effort: 4 })
          .toFile(webpPath);

        const newStats = fs.statSync(webpPath);
        console.log(`  -> Generated ${path.relative(PUBLIC_DIR, webpPath)}: ${(newStats.size / 1024).toFixed(1)} KB (Saved ${(((stats.size - newStats.size) / stats.size) * 100).toFixed(1)}%)`);
      } catch (err) {
        console.error(`Error optimizing ${fullPath}:`, err);
      }
    }
  }
}

async function main() {
  console.log('Starting image optimization across public directory...');
  await processDirectory(PUBLIC_DIR);
  console.log('Done optimizing images!');
}

main();
