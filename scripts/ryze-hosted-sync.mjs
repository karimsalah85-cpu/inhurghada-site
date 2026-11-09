import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
// Keep the legacy hosted blog as the migration source until every article lives on dailyredsea.com.
const sourceSite = (process.env.RYZE_HOSTED_URL || "https://dailyredsea.byryze.com").replace(/\/$/, "");
const outputFile = path.join(root, "data", "ryze-blog-posts.ts");
const imageDir = path.join(root, "public", "images", "ryze-blog");
const manualFile = path.join(root, "data", "blog-posts.ts");

function decodeHtml(value = "") {
  const entities = { quot: '"', apos: "'", amp: "&", lt: "<", gt: ">" };
  return String(value).replace(/&(quot|apos|amp|lt|gt|#x[0-9a-f]+|#\d+);/gi, (entity, code) => {
    if (!code.startsWith("#")) return entities[code.toLowerCase()];
    const point = /^#x/i.test(code) ? parseInt(code.slice(2), 16) : Number(code.slice(1));
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
      ? String.fromCodePoint(point)
      : "\ufffd";
  });
}

function textOnly(value = "") {
  return decodeHtml(String(value).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function attribute(html, pattern) {
  const match = html.match(pattern);
  return match ? decodeHtml(match[1]) : "";
}

function jsonLd(html) {
  const values = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      values.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {}
  }
  return values;
}

function inlineText(html) {
  const links = [];
  const text = textOnly(html.replace(/<a\b[^>]*\shref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, rawHref, label) => {
    const text = textOnly(label);
    try {
      const url = new URL(decodeHtml(rawHref), sourceSite);
      if (!["https:", "http:"].includes(url.protocol)) return text;
      const href = url.origin === new URL(sourceSite).origin
        ? `https://dailyredsea.com/blog${url.pathname === "/" ? "" : url.pathname}${url.search}${url.hash}`
        : url.href;
      // Protect URLs and already-decoded labels from the outer HTML cleanup.
      // Otherwise encoded angle brackets are stripped and entities decode twice.
      links.push(`[${text}](${href})`);
      return `DRSHOSTEDLINK${links.length - 1}END`;
    } catch { return text; }
  }));
  return text.replace(/DRSHOSTEDLINK(\d+)END/g, (token, index) => links[Number(index)] ?? token);
}

export function parseArticle(html) {
  const title = textOnly(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const metaDescription = attribute(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const heroUrl = attribute(html, /<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i);
  const schemas = jsonLd(html);
  const articleSchema = schemas.find((item) => item?.["@type"] === "Article") || {};
  const faqSchema = schemas.find((item) => item?.["@type"] === "FAQPage");
  const articleBody = html.match(/<article\b[^>]*class=["'][^"']*\bprose\b[^"']*["'][^>]*>([\s\S]*?)<\/article>/i)?.[1] || "";
  const sections = [];
  const introParts = [];
  let current = null;
  let skipSection = false;

  for (const match of articleBody.matchAll(/<(h2|h3|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const tag = match[1].toLowerCase();
    const text = tag === "h2" || tag === "h3" ? textOnly(match[2]) : inlineText(match[2]);
    if (!text) continue;
    if (tag === "h2" || tag === "h3") {
      if (tag === "h3" && skipSection) continue;
      skipSection = /^(faq|frequently asked questions)$/i.test(text);
      if (!skipSection) {
        current = { heading: text, body: [] };
        sections.push(current);
      } else current = null;
      continue;
    }
    if (skipSection) continue;
    if (!current) {
      if (tag === "p" && introParts.length < 2) introParts.push(text);
      continue;
    }
    current.body.push(tag === "li" ? `• ${text}` : text);
  }

  const faqs = (faqSchema?.mainEntity || []).map((item) => ({
    question: textOnly(item?.name || ""),
    answer: textOnly(item?.acceptedAnswer?.text || ""),
  })).filter((item) => item.question && item.answer);

  return {
    title,
    metaDescription,
    heroUrl,
    publishedAt: articleSchema.datePublished || articleSchema.dateModified || new Date().toISOString(),
    intro: introParts[0] || metaDescription || "Practical guidance from Daily Red Sea.",
    sections: sections.filter((section) => section.body.length),
    faqs,
  };
}

async function downloadImage(url, slug) {
  if (!url) return "/images/placeholders/island-trip.svg";
  await mkdir(imageDir, { recursive: true });
  const urlExt = path.extname(new URL(url).pathname).toLowerCase();
  const extension = [".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(urlExt) ? urlExt : ".jpg";
  const filename = `${slug}${extension}`;
  const destination = path.join(imageDir, filename);
  try {
    await access(destination);
  } catch {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Image download failed for ${slug}`);
    await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  }
  return `/images/ryze-blog/${filename}`;
}

async function main() {
  const manualSource = await readFile(manualFile, "utf8");
  const manualSlugs = new Set([...manualSource.matchAll(/\bslug:\s*["']([^"']+)["']/g)].map((match) => match[1]));
  const sitemapResponse = await fetch(`${sourceSite}/sitemap.xml`);
  if (!sitemapResponse.ok) throw new Error("Ryze hosted sitemap could not be read");
  const sitemap = await sitemapResponse.text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeHtml(match[1]));
  const posts = [];
  const failures = [];

  for (const url of urls) {
    const slug = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
    if (!slug || manualSlugs.has(slug)) continue;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Page returned ${response.status}`);
      const parsed = parseArticle(await response.text());
      if (!parsed.title || !parsed.sections.length) throw new Error("Article content was incomplete");
      posts.push({
        slug,
        title: parsed.title,
        metaDescription: parsed.metaDescription || parsed.intro.slice(0, 155),
        publishedAt: parsed.publishedAt,
        heroImage: await downloadImage(parsed.heroUrl, slug),
        relatedTourSlugs: [],
        intro: parsed.intro,
        sections: parsed.sections,
        faqs: parsed.faqs,
      });
      console.log(`Synced ${slug}`);
    } catch (error) {
      failures.push(`${slug}: ${error.message}`);
      console.warn(`Skipped ${slug}: ${error.message}`);
    }
  }

  // Never replace the live article set with a partial migration.
  if (failures.length) {
    throw new Error(`Hosted sync failed for ${failures.length} article(s): ${failures.join("; ")}`);
  }

  posts.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
  const source = `import type { BlogPost } from "./blog-posts";\n\n// Generated by scripts/ryze-hosted-sync.mjs. Do not edit by hand.\nexport const ryzeBlogPosts = ${JSON.stringify(posts, null, 2)} satisfies BlogPost[];\n`;
  await writeFile(outputFile, source);
  console.log(`Generated ${posts.length} hosted Ryze blog post(s).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
