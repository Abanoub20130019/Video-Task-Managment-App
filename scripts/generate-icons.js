const fs = require('fs');
const path = require('path');

// Create a simple PNG data URL for different sizes
function createSimplePNG(size) {
  // This creates a simple colored square PNG as a data URL
  // In a real scenario, you'd use a proper image conversion library
  const canvas = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${size/8}" fill="#6366f1"/>
    <text x="${size/2}" y="${size/2 + size/16}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size/8}" font-weight="bold">VT</text>
  </svg>`;
  
  return canvas;
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate SVG files for each size (as PNG placeholders)
sizes.forEach(size => {
  const svgContent = createSimplePNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png.svg`), svgContent);
  console.log(`Generated icon-${size}x${size}.png.svg`);
});

console.log('Icon generation complete!');