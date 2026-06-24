const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'assets', 'images', 'logo.svg');
const outDir = path.resolve(__dirname, '..', 'assets', 'expo.icon');

if (!fs.existsSync(src)) {
  console.error('Source SVG not found:', src);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const sizes = [1024, 512, 192, 144, 96, 72, 48];

Promise.all(
  sizes.map((s) =>
    sharp(src)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(outDir, `icon-${s}.png`))
  )
)
  .then(() => {
    // adaptive icon foreground
    return sharp(src)
      .resize(432, 432, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(outDir, 'foreground.png'));
  })
  .then(() => {
    // adaptive icon background (solid primary color)
    return sharp({
      create: {
        width: 1080,
        height: 1080,
        channels: 4,
        background: '#006c49',
      },
    })
      .png()
      .toFile(path.join(outDir, 'background.png'));
  })
  .then(() => {
    console.log('Icons generated in', outDir);
  })
  .catch((err) => {
    console.error('Failed to generate icons:', err);
    process.exit(1);
  });
