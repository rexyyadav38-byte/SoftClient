// Pure Node.js PNG generator with zlib
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  table[i] = c;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function generatePng(width, height, isMaskable = false) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = width / 2;
  const safeRadius = maxRadius * (isMaskable ? 0.72 : 0.88);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep dark navy / slate background
      let r = 12;
      let g = 14;
      let b = 20;
      let a = 255;

      // Outer squircle or circular glow
      if (dist < safeRadius) {
        // Gradient towards center
        const t = 1 - dist / safeRadius;
        r = Math.min(255, Math.floor(14 + t * 25));
        g = Math.min(255, Math.floor(18 + t * 45));
        b = Math.min(255, Math.floor(28 + t * 85));

        // Diagonal diamond sword blade & glow
        // Rotate point 45 degrees
        const rotX = (dx + dy) * 0.7071;
        const rotY = (-dx + dy) * 0.7071;

        // Sword blade: elongated along rotY
        const bladeHalfW = width * 0.04;
        const bladeLen = width * 0.28;
        if (Math.abs(rotX) < bladeHalfW && Math.abs(rotY) < bladeLen) {
          // Cyan diamond blade
          r = 56;
          g = 189;
          b = 248;
          // Core bright shine
          if (Math.abs(rotX) < bladeHalfW * 0.3) {
            r = 224;
            g = 242;
            b = 254;
          }
        }

        // Crossguard
        if (Math.abs(rotX) < bladeHalfW * 2.8 && rotY > bladeLen && rotY < bladeLen + width * 0.05) {
          r = 6;
          g = 182;
          b = 212;
        }

        // Handle
        if (Math.abs(rotX) < bladeHalfW * 0.6 && rotY >= bladeLen + width * 0.05 && rotY < bladeLen + width * 0.15) {
          r = 120;
          g = 53;
          b = 15;
        }

        // Pommel
        if (Math.abs(rotX) < bladeHalfW * 1.2 && rotY >= bladeLen + width * 0.15 && rotY < bladeLen + width * 0.18) {
          r = 6;
          g = 182;
          b = 212;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write 192x192, 512x512 standard, 512x512 maskable, apple-touch-icon (180x180), and favicon
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePng(32, 32, false));

console.log('Successfully generated all PWA icon assets in /public!');
