const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generate() {
  const svgPath = path.join(__dirname, '../public/icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 1. pwa-192x192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, '../public/pwa-192x192.png'));

  // 2. pwa-512x512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, '../public/pwa-512x512.png'));

  // 3. apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, '../public/apple-touch-icon.png'));

  // 4. pwa-maskable-512x512.png (padded for Android maskable icon safe zone)
  const innerSize = Math.round(512 * 0.8); // 80% safe zone
  const paddedSvg = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
    }
  })
    .composite([{ input: paddedSvg, gravity: 'center' }])
    .png()
    .toFile(path.join(__dirname, '../public/pwa-maskable-512x512.png'));

  // 5. favicon.ico
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(__dirname, '../public/favicon.ico'));

  console.log('All PWA icons generated successfully!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
