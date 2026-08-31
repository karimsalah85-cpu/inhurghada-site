// Copies the browser runtime assets for tesseract.js and pdf.js out of
// node_modules and into public/vendor so the admin invoice reader can load them
// same-origin (the site CSP forbids third-party script/worker/wasm hosts).
//
// The language trained-data files under public/vendor/tesseract/lang are
// committed to the repo; everything this script writes is reproducible from
// node_modules and is git-ignored.
import { cp, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "vendor");

const copies = [
  ["node_modules/tesseract.js/dist/worker.min.js", "tesseract/worker.min.js"],
  ["node_modules/tesseract.js-core", "tesseract/core"],
  ["node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "pdf/pdf.worker.min.mjs"],
];

for (const [from, to] of copies) {
  const source = join(root, from);
  const target = join(out, to);
  try {
    await access(source);
  } catch {
    console.error(`vendor-ocr-assets: missing ${from} — run npm install first.`);
    process.exit(1);
  }
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target, { recursive: true });
  console.log(`vendor-ocr-assets: ${from} -> public/vendor/${to}`);
}
