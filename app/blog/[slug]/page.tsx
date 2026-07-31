import type { Metadata } from "next";
import Image from "@/components/media/WatermarkedImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/data/blog-posts";
import { getLiveBlogPosts, getLiveTours } from "@/lib/live-content";
import { absoluteUrl, pageMetadata, siteName } from "@/lib/seo";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getLiveBlogPosts()).find((item) => item.slug === slug);
  if (!post) return {};
  return pageMetadata({ title: `${post.title} | Daily Red Sea`, description: post.metaDescription, path: `/blog/${post.slug}` });
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const [posts, tours] = await Promise.all([getLiveBlogPosts(), getLiveTours()]);
  const post = posts.find((item) => item.slug === slug);
  if (!post) notFound();

  const relatedTours = post.relatedTourSlugs.map((tourSlug) => tours.find((tour) => tour.slug === tourSlug)).filter(Boolean) as typeof tours;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
          { "@type": "ListItem", position: 3, name: post.title, item: absoluteUrl(`/blog/${post.slug}`) },
        ],
      },
      {
        "@type": "Article",
        headline: post.title,
        description: post.metaDescription,
        image: absoluteUrl(post.heroImage),
        datePublished: post.publishedAt,
        author: { "@type": "Organization", name: siteName },
        publisher: { "@type": "Organization", name: siteName },
      },
      {
        "@type": "FAQPage",
        mainEntity: post.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <main className="bg-slate-50 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <Link href="/">Home</Link>
          <span className="px-2">/</span>
          <Link href="/blog">Blog</Link>
        </nav>
        <p className="mt-6 text-sm text-slate-500">
          {new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">{post.title}</h1>
        <div className="relative mt-8 h-72 overflow-hidden rounded-[2rem]">
          <Image src={post.heroImage} alt={post.title} fill sizes="(max-width: 1024px) 100vw, 800px" className="object-cover" priority />
        </div>
        <p className="mt-8 text-lg leading-8 text-slate-700">{post.intro}</p>
        {post.sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="text-2xl font-black">{section.heading}</h2>
            {section.body.map((paragraph, index) => (
              <p key={index} className="mt-4 leading-8 text-slate-700">{paragraph}</p>
            ))}
          </section>
        ))}

        {relatedTours.length > 0 && (
          <section className="mt-12 rounded-3xl border border-cyan-200 bg-cyan-50 p-6">
            <h2 className="text-xl font-black text-cyan-950">Book the experience</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {relatedTours.map((tour) => (
                <Link key={tour.slug} href={`/tours/${tour.slug}`} className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="font-bold">{tour.title}</p>
                  <p className="mt-1 text-sm text-slate-600">From ${tour.price} per person</p>
                  <span className="mt-2 inline-block text-sm font-bold text-blue-700">View details →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <h2 className="text-2xl font-black">Frequently asked questions</h2>
          <div className="mt-6 space-y-5">
            {post.faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="font-bold">{faq.question}</p>
                <p className="mt-2 leading-7 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-4">
          <a href="https://wa.me/201030809150" className="rounded-full bg-green-600 px-7 py-4 font-bold text-white">Ask us on WhatsApp</a>
          <Link href="/blog" className="rounded-full border px-7 py-4 font-bold">More guides</Link>
        </div>
      </article>
    </main>
  );
}
