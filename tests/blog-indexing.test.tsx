import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { blogPosts } from "@/data/blog-posts";
import { tours } from "@/data/tours";
import { blogPath, translatedBlogSlugs } from "@/lib/blog-languages";
import { blogLanguageAlternates } from "@/lib/blog-localization";
import { localeSwitchPath } from "@/lib/i18n";
import { relatedBlogPosts } from "@/lib/related-blog-posts";
import BlogInlineText from "@/components/blog/BlogInlineText";
import { parseMarkdown } from "../scripts/ryze-convert.mjs";
import { parseArticle } from "../scripts/ryze-hosted-sync.mjs";
import { generateMetadata } from "@/app/[locale]/[[...path]]/page";
import { generateMetadata as englishMetadata } from "@/components/blog/BlogArticlePage";
import sitemap from "@/app/sitemap";

vi.mock("@/lib/live-content", () => ({
  getLiveBlogPosts: vi.fn(async () => blogPosts),
  getLiveTours: vi.fn(async () => tours),
}));

const untranslated = "how-much-does-a-snorkeling-trip-cost-in-hurghada-in";

describe("blog crawl and canonical signals", () => {
  it("preserves publisher links through conversion and renders crawlable anchors", () => {
    const post = parseMarkdown("Read [this guide](https://dailyredsea.com/blog/reef_guide).\n\n## Plan\nSee [the trip](/tours/orange-bay).\n\n## FAQ\n### Where?\nRead [the guide](https://dailyredsea.com/blog/reef_guide).");
    const intro = renderToStaticMarkup(<BlogInlineText text={post.intro} />);
    expect(intro).toContain('href="/blog/reef_guide"');
    expect(intro).toContain("this guide</a>");
    expect(renderToStaticMarkup(<BlogInlineText text={post.sections[0].body[0]} />)).toContain('href="/tours/orange-bay"');
    expect(post.faqs[0].answer).toBe("Read the guide.");
  });

  it("escapes publisher HTML and rejects executable links", () => {
    const html = renderToStaticMarkup(<BlogInlineText text={'<script>alert(1)</script> [bad](javascript:alert) [source](https://example.com/source)'} />);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('href="https://example.com/source"');
  });

  it("keeps hosted-migration links on the migrated site and retains related guides", () => {
    const post = parseArticle('<h1>Reef guide</h1><article class="prose"><p>Read <a href="/another-guide">another guide</a>.</p><h2>Related guides</h2><p><a href="https://dailyredsea.com/blog/reef">Reef</a></p></article>');
    expect(post.intro).toContain("[another guide](https://dailyredsea.com/blog/another-guide)");
    expect(post.sections[0].body[0]).toContain("[Reef](https://dailyredsea.com/blog/reef)");
  });

  it("does not create new language-switch URLs for untranslated articles", () => {
    expect(localeSwitchPath(`/blog/${untranslated}`, "ar")).toBe(`/blog/${untranslated}`);
    expect(blogPath(translatedBlogSlugs[0], "ar")).toBe(`/ar/blog/${translatedBlogSlugs[0]}`);
    expect(blogLanguageAlternates(untranslated)).toEqual({ en: `/blog/${untranslated}`, "x-default": `/blog/${untranslated}` });
  });

  it("consolidates existing untranslated copies and localizes metadata for real translations", async () => {
    const fallback = await generateMetadata({ params: Promise.resolve({ locale: "ar", path: ["blog", untranslated] }) });
    expect(fallback.alternates?.canonical).toBe(`/blog/${untranslated}`);
    expect(fallback.alternates?.languages).not.toHaveProperty("ar");
    const translated = await generateMetadata({ params: Promise.resolve({ locale: "ar", path: ["blog", translatedBlogSlugs[0]] }) });
    const english = await englishMetadata({ params: Promise.resolve({ slug: translatedBlogSlugs[0] }) });
    expect(translated.alternates?.canonical).toBe(`/ar/blog/${translatedBlogSlugs[0]}`);
    expect(String(translated.title)).toContain("تأشيرة");
    expect(translated.alternates?.languages).toEqual(english.alternates?.languages);
  });

  it("lists only real translated articles in the sitemap with reciprocal alternates", async () => {
    const entries = await sitemap();
    expect(entries.some((entry) => entry.url.endsWith(`/ar/blog/${untranslated}`))).toBe(false);
    const translated = entries.find((entry) => entry.url === `https://dailyredsea.com/ar/blog/${translatedBlogSlugs[0]}`);
    expect(translated?.alternates?.languages).toMatchObject({ en: `https://dailyredsea.com/blog/${translatedBlogSlugs[0]}`, ar: translated?.url });
    expect(entries.some((entry) => entry.url === "https://dailyredsea.com/ar/blog")).toBe(true);
  });

  it("links readers to relevant published guides without cross-destination substitutions", () => {
    const post = blogPosts.find((post) => post.slug === untranslated)!;
    const related = relatedBlogPosts(post, blogPosts);
    expect(related).toHaveLength(3);
    expect(related.every((guide) => guide.slug !== post.slug && !guide.slug.includes("jeddah"))).toBe(true);
    expect(related.some((guide) => guide.slug.includes("snorkeling"))).toBe(true);
    expect(relatedBlogPosts(post, [post])).toEqual([]);
  });
});
