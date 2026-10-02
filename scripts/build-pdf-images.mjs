// Builds the print-sized photos embedded in generated PDFs (assets/pdf-images).
// The site's originals in public/images/owned are 0.5–7 MB each; a PDF hero is
// only 595pt wide, so embedding the original made every emailed PDF megabytes
// larger than it needs to be. Run after adding a photo to lib/pdf/hero-image.ts:
//   node scripts/build-pdf-images.mjs
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "public/images/owned");
const target = path.join(root, "assets/pdf-images");
const heroModule = await readFile(path.join(root, "lib/pdf/hero-image.ts"), "utf8");
const photos = [...new Set([...heroModule.matchAll(/"([\w-]+\.jpe?g)"/g)].map((match) => match[1]))].filter((file) => file !== "footer-strip.jpg");

await mkdir(target, { recursive: true });
for (const file of photos) {
  // 1600px across an A4 page is ~190dpi: sharp in print, a fraction of the bytes.
  // Heroes are drawn as a wide centred band, so anything taller than 16:9 is
  // trimmed top and bottom first — rows the PDF would have cropped away anyway.
  const { width = 1600, height = 900 } = await sharp(path.join(source, file)).rotate().metadata();
  const outputWidth = Math.min(1600, width);
  const outputHeight = Math.min(Math.round(outputWidth * height / width), Math.round(outputWidth * 9 / 16));
  const info = await sharp(path.join(source, file)).rotate().resize({ width: outputWidth, height: outputHeight, fit: "cover", position: "centre" }).jpeg({ quality: 80, progressive: false }).toFile(path.join(target, file));
  console.log(`${file}  ${Math.round(info.size / 1024)} KB`);
}
// The thin photo band at the foot of text pages: the page's 595.28 x 54pt strip, cropped from the diver photo.
const strip = await sharp(path.join(source, "red-sea-diver-reef.jpg")).rotate().resize({ width: 1600, height: 145, fit: "cover", position: "centre" }).jpeg({ quality: 78, progressive: false }).toFile(path.join(target, "footer-strip.jpg"));
console.log(`footer-strip.jpg  ${Math.round(strip.size / 1024)} KB`);
