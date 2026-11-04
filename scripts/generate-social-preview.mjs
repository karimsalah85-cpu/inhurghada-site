// Regenerate the default link-preview image: node scripts/generate-social-preview.mjs
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [template, photo, logo] = await Promise.all([
  readFile(path.join(root, "assets/social-preview.svg"), "utf8"),
  readFile(path.join(root, "public/images/owned/red-sea-reef-panorama.jpg")),
  readFile(path.join(root, "public/brand/dailyredsea-wordmark-white.svg")),
]);
const svg = template
  .replace("{{photo}}", `data:image/jpeg;base64,${photo.toString("base64")}`)
  .replace("{{logo}}", `data:image/svg+xml;base64,${logo.toString("base64")}`);
const output = path.join(root, "public/brand/dailyredsea-social-v2.jpg");
await sharp(Buffer.from(svg)).jpeg({ quality: 90, mozjpeg: true }).toFile(output);
console.log(`Wrote ${output} (1200×630)`);
