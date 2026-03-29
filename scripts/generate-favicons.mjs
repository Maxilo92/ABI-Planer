import sharp from 'sharp';
import fs from 'fs';

const sizes = [32, 180];
const input = 'public/logo.svg';

sizes.forEach(async (size) => {
  const output = `public/favicon-${size}x${size}.png`;
  await sharp(input)
    .resize(size, size)
    .png()
    .toFile(output);
  console.log(`Created ${output}`);
});
