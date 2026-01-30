#!/usr/bin/env node
/**
 * Generate simple PNG icons for Office Add-in
 * No external dependencies required - uses pure Node.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Simple PNG generation (single color square with rounded appearance)
function createPNG(size, color = { r: 0, g: 120, b: 212 }) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr.writeUInt8(8, 8);        // bit depth
  ihdr.writeUInt8(6, 9);        // color type (RGBA)
  ihdr.writeUInt8(0, 10);       // compression
  ihdr.writeUInt8(0, 11);       // filter
  ihdr.writeUInt8(0, 12);       // interlace

  // Generate image data (simple AI-like icon)
  const rawData = [];
  const center = size / 2;
  const radius = size * 0.4;
  const innerRadius = size * 0.2;

  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Create a circle with gradient
      if (dist < radius) {
        const alpha = dist < innerRadius ? 255 : Math.floor(255 * (1 - (dist - innerRadius) / (radius - innerRadius)));
        // Gradient effect
        const factor = 1 - (dist / radius) * 0.3;
        rawData.push(Math.floor(color.r * factor));
        rawData.push(Math.floor(color.g * factor));
        rawData.push(Math.floor(color.b * factor));
        rawData.push(alpha);
      } else {
        rawData.push(0, 0, 0, 0); // transparent
      }
    }
  }

  // Compress image data
  const compressed = zlib.deflateSync(Buffer.from(rawData), { level: 9 });

  // Create chunks
  function makeChunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);

    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData) >>> 0);

    return Buffer.concat([length, typeBuffer, data, crc]);
  }

  // CRC32 calculation
  function crc32(buffer) {
    let crc = 0xffffffff;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    for (let i = 0; i < buffer.length; i++) {
      crc = table[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
    }
    return crc ^ 0xffffffff;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Ensure assets directory exists
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Generate icons in different sizes
const sizes = [16, 32, 64, 80];
const color = { r: 0, g: 120, b: 212 }; // Microsoft blue

sizes.forEach(size => {
  const png = createPNG(size, color);
  const filename = path.join(assetsDir, `icon-${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Generated: ${filename}`);
});

console.log('Icons generated successfully!');
