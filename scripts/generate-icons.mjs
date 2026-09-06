// Regenerates the favicon / app-icon set from assets/brand-icon.svg.
// Run: node scripts/generate-icons.mjs
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const master = await readFile(path.join(root, "assets/brand-icon.svg"));

const NAVY = "#0A2D57";

async function png(size, { maskable = false } = {}) {
  if (!maskable) {
    return sharp(master, { density: 384 }).resize(size, size, { fit: "contain" }).png().toBuffer();
  }
  // Maskable: full-bleed navy, mark shrunk into the ~66% safe zone.
  const inner = Math.round(size * 0.66);
  const markPng = await sharp(master, { density: 384 }).resize(inner, inner).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: NAVY } })
    .composite([{ input: markPng, gravity: "centre" }])
    .png()
    .toBuffer();
}

// Minimal ICO container wrapping PNG frames (PNG-in-ICO; supported everywhere
// that matters, including Windows Vista+ and every current browser).
function buildIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(frames.length, 4);

  const entries = Buffer.alloc(16 * frames.length);
  let offset = 6 + entries.length;
  const body = [];
  frames.forEach((frame, index) => {
    const entry = entries.subarray(index * 16, index * 16 + 16);
    entry.writeUInt8(frame.size >= 256 ? 0 : frame.size, 0); // width
    entry.writeUInt8(frame.size >= 256 ? 0 : frame.size, 1); // height
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(frame.data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += frame.data.length;
    body.push(frame.data);
  });

  return Buffer.concat([header, entries, ...body]);
}

const targets = [
  { file: "public/favicon-16x16.png", buf: () => png(16) },
  { file: "public/favicon-32x32.png", buf: () => png(32) },
  { file: "public/apple-touch-icon.png", buf: () => png(180) },
  { file: "public/icon-192.png", buf: () => png(192) },
  { file: "public/icon-512.png", buf: () => png(512) },
  { file: "public/icon-512-maskable.png", buf: () => png(512, { maskable: true }) },
];

for (const target of targets) {
  await writeFile(path.join(root, target.file), await target.buf());
  console.log("wrote", target.file);
}

const ico = buildIco([
  { size: 16, data: await png(16) },
  { size: 32, data: await png(32) },
  { size: 48, data: await png(48) },
]);
await writeFile(path.join(root, "app/favicon.ico"), ico);
await writeFile(path.join(root, "public/favicon.ico"), ico);
console.log("wrote app/favicon.ico + public/favicon.ico");

// Keep the SVG icon on-brand too (served at /icon.svg for rel="icon").
await writeFile(path.join(root, "public/icon.svg"), master);
console.log("wrote public/icon.svg");
