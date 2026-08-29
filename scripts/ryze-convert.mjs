import { mkdir, readFile, readdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const inputDir = path.join(root, "blog", "data");
const outputFile = path.join(root, "data", "ryze-blog-posts.ts");
const imageDir = path.join(root, "public", "images", "ryze-blog");
const manualFile = path.join(root, "data", "blog-posts.ts");

function cleanInline(value = "") {
  return String(value)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMarkdown(markdown = "") {
  const lines = String(markdown).replace(/\r/g, "").split("\n");
  const introParts = [];
  const sections = [];
  const faqs = [];
  let current = null;
  let faqMode = false;
  let pendingQuestion = null;

  const flushQuestion = () => {
    if (pendingQuestion?.question && pendingQuestion.answer.length) {
      faqs.push({ question: pendingQuestion.question, answer: pendingQuestion.answer.join(" ") });
    }
    pendingQuestion = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^#\s+/.test(line)) continue;

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flushQuestion();
      const heading = cleanInline(h2[1]);
      faqMode = /frequently asked|common questions|^faq/i.test(heading);
      current = faqMode ? null : { heading, body: [] };
      if (current) sections.push(current);
      continue;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      if (faqMode) {
        flushQuestion();
        pendingQuestion = { question: cleanInline(h3[1]), answer: [] };
      } else {
        current = { heading: cleanInline(h3[1]), body: [] };
        sections.push(current);
      }
      continue;
    }

    const boldQuestion = line.match(/^\*\*(.+?\?)\*\*\s*(.*)$/);
    if (faqMode && boldQuestion) {
      flushQuestion();
      pendingQuestion = { question: cleanInline(boldQuestion[1]), answer: [] };
      const answer = cleanInline(boldQuestion[2]);
      if (answer) pendingQuestion.answer.push(answer);
      continue;
    }

    const text = cleanInline(line.replace(/^[-*+]\s+/, "• ").replace(/^\d+[.)]\s+/, ""));
    if (!text) continue;
    if (faqMode && pendingQuestion) pendingQuestion.answer.push(text);
    else if (current) current.body.push(text);
    else introParts.push(text);
  }
  flushQuestion();

  const intro = introParts.join(" ") || sections[0]?.body.shift() || "Practical guidance from Daily Red Sea.";
  return {
    intro,
    sections: sections.filter((section) => section.heading && section.body.length),
    faqs,
  };
}

function safeSlug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

async function downloadImage(article) {
  const url = article?.image?.url;
  if (!url) return "/images/placeholders/island-trip.svg";
  const slug = safeSlug(article.slug);
  await mkdir(imageDir, { recursive: true });
  const urlExt = path.extname(new URL(url).pathname).toLowerCase();
  const extension = [".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(urlExt) ? urlExt : ".jpg";
  const filename = `${slug}${extension}`;
  const destination = path.join(imageDir, filename);
  try {
    await access(destination);
  } catch {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not download image for ${slug}`);
    await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  }
  return `/images/ryze-blog/${filename}`;
}

async function readGeneratedPosts() {
  try {
    const source = await readFile(outputFile, "utf8");
    const match = source.match(/export const ryzeBlogPosts = ([\s\S]*?) satisfies BlogPost\[\];/);
    return match ? JSON.parse(match[1]) : [];
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function main() {
  const manualSource = await readFile(manualFile, "utf8");
  const manualSlugs = new Set([...manualSource.matchAll(/\bslug:\s*["']([^"']+)["']/g)].map((match) => match[1]));
  let files = [];
  try {
    files = (await readdir(inputDir)).filter((file) => file.endsWith(".json")).sort();
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  // Preserve the migrated archive, then merge newly published JSON by slug.
  // This guarantees that publishing one article cannot remove older posts.
  const postsBySlug = new Map((await readGeneratedPosts()).map((post) => [post.slug, post]));
  for (const file of files) {
    const article = JSON.parse(await readFile(path.join(inputDir, file), "utf8"));
    if (article.status !== "published" || !article.slug || manualSlugs.has(article.slug)) continue;
    const parsed = parseMarkdown(article.body_markdown || "");
    postsBySlug.set(article.slug, {
      slug: article.slug,
      title: article.title,
      metaDescription: article.meta_description || article.excerpt || parsed.intro.slice(0, 155),
      publishedAt: article.published_at || article.updated_at || new Date().toISOString(),
      heroImage: await downloadImage(article),
      relatedTourSlugs: [],
      intro: parsed.intro,
      sections: parsed.sections,
      faqs: parsed.faqs,
    });
  }

  const posts = [...postsBySlug.values()].sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
  const source = `import type { BlogPost } from "./blog-posts";\n\n// Generated by the Ryze publishing workflow. Do not edit by hand.\nexport const ryzeBlogPosts = ${JSON.stringify(posts, null, 2)} satisfies BlogPost[];\n`;
  await writeFile(outputFile, source);
  console.log(`Generated ${posts.length} merged Ryze blog post(s).`);
}

await main();
