import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.join(process.cwd(), 'public/icons/icon.svg');
const iconsDir = path.join(process.cwd(), 'public/icons');

const svg = fs.readFileSync(svgPath, 'utf-8');

async function generateIcons() {
  const sizes = [
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const { name, size } of sizes) {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, name));
    console.log(`✅ Generated ${name} (${size}x${size})`);
  }

  console.log('\n✅ All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
