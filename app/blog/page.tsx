import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/data/blog-posts";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Hurghada Travel Guides & Tips | Daily Red Sea Blog",
  description: "Practical guides to Hurghada tours, snorkeling, diving, desert safaris and transfers - written by a local operator.",
  path: "/blog",
});

export default function BlogIndexPage() {
  const posts = [...blogPosts].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <p className="font-bold text-cyan-700">Daily Red Sea · Guides</p>
      <h1 className="mt-3 text-4xl font-black sm:text-5xl">Hurghada travel guides &amp; tips</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
        Straight answers on Hurghada tours, snorkeling, diving and desert safaris from a local team who runs these trips every day.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-400"
          >
            <p className="text-sm text-slate-500">{new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            <h2 className="mt-2 text-xl font-black">{post.title}</h2>
            <p className="mt-3 leading-7 text-slate-600">{post.metaDescription}</p>
            <span className="mt-4 inline-block font-bold text-blue-700">Read more →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
