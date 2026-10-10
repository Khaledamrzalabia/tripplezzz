const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const src = 'public/mockup_full.png';
const outDir = 'public/mockup-assets';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Bounding boxes based on 405 x 1024
const crops = [
  // Collections Banners
  { name: 'banner-argentina.jpg', left: 16, top: 433, width: 182, height: 97 },
  { name: 'banner-portugal.jpg', left: 206, top: 433, width: 184, height: 97 },

  // Products
  { name: 'product-portugal-hoodie.jpg', left: 95, top: 280, width: 70, height: 68 },
  { name: 'product-stadium-jacket.jpg', left: 168, top: 280, width: 70, height: 68 },
  { name: 'product-black-tee.jpg', left: 242, top: 280, width: 70, height: 68 },
  { name: 'product-messi-back.jpg', left: 316, top: 280, width: 70, height: 68 },

  // Category Cards
  { name: 'cat-hoodies.jpg', left: 18, top: 536, width: 88, height: 42 },
  { name: 'cat-jackets.jpg', left: 110, top: 536, width: 88, height: 42 },
  { name: 'cat-tees.jpg', left: 206, top: 536, width: 88, height: 42 },
  { name: 'cat-tracksuits.jpg', left: 301, top: 536, width: 88, height: 42 },

  // Culture Seated Model
  { name: 'culture-seated-model.jpg', left: 205, top: 590, width: 185, height: 110 },

  // Craft & Detail Close-ups
  { name: 'craft-embroidery.jpg', left: 21, top: 712, width: 68, height: 64 },
  { name: 'craft-crest.jpg', left: 93, top: 712, width: 68, height: 64 },
  { name: 'craft-stripe.jpg', left: 164, top: 712, width: 68, height: 64 },

  // Community Lookbook Shots
  { name: 'community-1.jpg', left: 16, top: 811, width: 58, height: 58 },
  { name: 'community-2.jpg', left: 77, top: 811, width: 58, height: 58 },
  { name: 'community-3.jpg', left: 138, top: 811, width: 58, height: 58 },
  { name: 'community-4.jpg', left: 199, top: 811, width: 58, height: 58 },
  { name: 'community-5.jpg', left: 260, top: 811, width: 58, height: 58 },
];

async function run() {
  for (const c of crops) {
    try {
      await sharp(src)
        .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
        .resize(c.width * 3, c.height * 3, { kernel: 'lanczos3' })
        .toFile(path.join(outDir, c.name));
      console.log('Saved:', c.name);
    } catch (err) {
      console.error('Error cropping', c.name, err.message);
    }
  }
}

run();
