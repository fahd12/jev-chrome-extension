import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

function crc32(buffer) {
  let crc = ~0;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function createPng(size, colorAt) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = colorAt(x, y, size);
      const offset = y * stride + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function inRoundedSquare(x, y, size, radius) {
  const max = size - 1;
  const ix = x < radius ? radius - x : x > max - radius ? x - (max - radius) : 0;
  const iy = y < radius ? radius - y : y > max - radius ? y - (max - radius) : 0;
  if (ix === 0 || iy === 0) {
    return true;
  }
  return ix * ix + iy * iy <= radius * radius;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = dx * dx + dy * dy;
  if (length === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / length));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function onCheck(x, y, size) {
  const thickness = Math.max(1.2, size * 0.08);
  const short = distToSegment(x, y, size * 0.26, size * 0.52, size * 0.44, size * 0.7);
  const long = distToSegment(x, y, size * 0.44, size * 0.7, size * 0.76, size * 0.32);
  return short < thickness || long < thickness;
}

function draw(x, y, size) {
  const radius = Math.max(3, Math.round(size * 0.18));
  if (!inRoundedSquare(x, y, size, radius)) {
    return [0, 0, 0, 0];
  }
  if (onCheck(x, y, size)) {
    return [240, 253, 250, 255];
  }
  return [15, 118, 110, 255];
}

mkdirSync(outDir, { recursive: true });
for (const size of [16, 48, 128]) {
  writeFileSync(join(outDir, `icon${size}.png`), createPng(size, draw));
}

console.log(`Wrote icons to ${outDir}`);
