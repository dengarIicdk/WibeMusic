// Generates the WibeMusic logo: PWA icons (PNG), icon.svg (also copied to site/ and desktop/ ICO).
// Node built-ins only: an analytic rasterizer + zlib PNG encoder.
// Logo: two teal blobs, a «W» in the left one, an «M» in the right one, a white «+» between them.
// Usage: node scripts/gen-icons.mjs  → public/icons/*.png, public/icons/icon.svg, site/icons/icon.svg, desktop/wibemusic.ico
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, 'web', 'public', 'icons');
mkdirSync(out, { recursive: true });

const BG = [11, 11, 11];
const GREEN = [45, 212, 191];
const WHITE = [255, 255, 255];

// --- PNG encoder ---------------------------------------------------------------------------------
const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- the logo, in its own 0..100 coordinates ------------------------------------------------------
const TEAL_BLOBS = [
  [27, 50, 19],
  [73, 50, 19],
];
const DARK_STROKES = [
  { pts: [[15, 40], [20.5, 60], [27, 44], [33.5, 60], [39, 40]], w: 3.6 }, // W
  { pts: [[61.5, 60], [61.5, 40], [73, 52], [84.5, 40], [84.5, 60]], w: 3.6 }, // M
];
const WHITE_STROKES = [
  { pts: [[44.5, 50], [55.5, 50]], w: 3.6 }, // +
  { pts: [[50, 44.5], [50, 55.5]], w: 3.6 },
];

function distSeg(x, y, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
}
function onStroke(x, y, { pts, w }) {
  for (let i = 0; i + 1 < pts.length; i++) {
    if (distSeg(x, y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]) <= w / 2) return true;
  }
  return false;
}
const inRoundRect = (x, y, x0, y0, x1, y1, r) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};
const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

/** The logo's colour at a point of the 0..100 square, or null. */
function logoAt(X, Y) {
  if (WHITE_STROKES.some((s) => onStroke(X, Y, s))) return WHITE;
  if (DARK_STROKES.some((s) => onStroke(X, Y, s))) return BG;
  if (TEAL_BLOBS.some(([cx, cy, r]) => inCircle(X, Y, cx, cy, r))) return GREEN;
  return null;
}

// Beamed double note for the notification badge (white on transparent).
const inEllipse = (x, y, cx, cy, rx, ry, rot) => {
  const c = Math.cos(rot), s = Math.sin(rot);
  const dx = x - cx, dy = y - cy;
  const u = dx * c + dy * s, v = -dx * s + dy * c;
  return (u / rx) ** 2 + (v / ry) ** 2 <= 1;
};
function inNote(x, y, k) {
  const X = (x - 0.5) / k + 0.5, Y = (y - 0.5) / k + 0.5;
  const head1 = inEllipse(X, Y, 0.385, 0.66, 0.085, 0.062, -0.45);
  const head2 = inEllipse(X, Y, 0.645, 0.6, 0.085, 0.062, -0.45);
  const stem1 = X >= 0.445 && X <= 0.48 && Y >= 0.33 && Y <= 0.65;
  const stem2 = X >= 0.705 && X <= 0.74 && Y >= 0.27 && Y <= 0.59;
  const t = (X - 0.445) / (0.74 - 0.445);
  const top = 0.33 + (0.27 - 0.33) * t;
  const beam = t >= 0 && t <= 1 && Y >= top && Y <= top + 0.085;
  return head1 || head2 || stem1 || stem2 || beam;
}

/** kind: 'any' (rounded square), 'maskable' (full bleed, logo in the safe zone), 'badge' (white note, transparent). */
function render(size, kind) {
  const SS = 4; // supersampling
  const scale = kind === 'maskable' ? 0.7 : 0.86;
  const buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          let col = null;
          if (kind === 'badge') {
            if (inNote(x, y, 1.25)) col = WHITE;
          } else {
            const bg = kind === 'maskable' ? true : inRoundRect(x, y, 0, 0, 1, 1, 0.22);
            if (bg) {
              col = BG;
              const X = (x * 100 - 50) / scale + 50;
              const Y = (y * 100 - 50) / scale + 50;
              col = logoAt(X, Y) ?? BG;
            }
          }
          if (col) {
            r += col[0];
            g += col[1];
            b += col[2];
            a += 255;
          }
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 4;
      const cov = a / 255;
      buf[i] = cov ? Math.round(r / cov) : 0;
      buf[i + 1] = cov ? Math.round(g / cov) : 0;
      buf[i + 2] = cov ? Math.round(b / cov) : 0;
      buf[i + 3] = Math.round(a / n);
    }
  }
  return png(size, buf);
}

/** An ICO file that holds PNG images (Windows Vista and later read them). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + dir.length;
  images.forEach(({ size, data }, i) => {
    const e = i * 16;
    dir[e] = size >= 256 ? 0 : size;
    dir[e + 1] = size >= 256 ? 0 : size;
    dir.writeUInt16LE(1, e + 4);
    dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(data.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...images.map((i) => i.data)]);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#0b0b0b"/>
  <g transform="translate(50 50) scale(.86) translate(-50 -50)">
    <circle cx="27" cy="50" r="19" fill="#2dd4bf"/>
    <circle cx="73" cy="50" r="19" fill="#2dd4bf"/>
    <polyline points="15,40 20.5,60 27,44 33.5,60 39,40" fill="none" stroke="#0b0b0b" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="61.5,60 61.5,40 73,52 84.5,40 84.5,60" fill="none" stroke="#0b0b0b" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M44.5 50H55.5M50 44.5V55.5" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round"/>
  </g>
</svg>
`;

const targets = [
  ['icon-192.png', 192, 'any'],
  ['icon-512.png', 512, 'any'],
  ['maskable-192.png', 192, 'maskable'],
  ['maskable-512.png', 512, 'maskable'],
  ['badge-96.png', 96, 'badge'],
  ['apple-touch-icon.png', 180, 'maskable'],
];
for (const [name, size, kind] of targets) {
  writeFileSync(join(out, name), render(size, kind));
  console.log('wrote', name);
}

writeFileSync(join(out, 'icon.svg'), svg);
writeFileSync(join(root, 'site', 'icons', 'icon.svg'), svg);
console.log('wrote icon.svg (web and site)');

const icoSizes = [256, 48, 32, 16];
writeFileSync(join(root, 'desktop', 'wibemusic.ico'), ico(icoSizes.map((size) => ({ size, data: render(size, 'any') }))));
console.log('wrote desktop/wibemusic.ico');
