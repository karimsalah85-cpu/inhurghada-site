import type { BlogPost } from "@/data/blog-posts";
import type { Locale } from "@/lib/i18n";
import { hasBlogTranslation } from "@/lib/blog-languages";

const genericWords = new Set("a an the in on at to and or for of from with by how what why is are can you your do does it its be get go best guide complete tips trip trips tour tours day days hurghada egypt red sea travelers visitors ranked worth visiting year first time".split(" "));

function topics(slug: string) {
  return new Set(slug.split("-").filter((word) => word.length > 2 && !genericWords.has(word) && !/^\d+$/.test(word)));
}

function destination(slug: string) {
  return /jeddah|bayada/.test(slug) ? "jeddah" : /marsa-alam|abu-dabbab|sharm-el-luli/.test(slug) ? "marsa-alam" : "egypt";
}

export function relatedBlogPosts(post: BlogPost, posts: BlogPost[], locale: Locale = "en", limit = 3) {
  const keywords = topics(post.slug);
  return posts
    .filter((candidate) => candidate.slug !== post.slug && hasBlogTranslation(candidate.slug, locale) && destination(candidate.slug) === destination(post.slug))
    .map((candidate) => {
      const candidateTopics = topics(candidate.slug);
      const shared = [...keywords].filter((word) => candidateTopics.has(word)).length;
      return { candidate, score: shared / Math.sqrt(keywords.size * candidateTopics.size || 1) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.slug.localeCompare(b.candidate.slug))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
