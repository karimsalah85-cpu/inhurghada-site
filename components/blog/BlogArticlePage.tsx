import type { Metadata } from "next";
import Image from "@/components/media/WatermarkedImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/data/blog-posts";
import { getLiveBlogPosts, getLiveTours } from "@/lib/live-content";
import { localizeBlogPost } from "@/lib/blog-localization";
import { absoluteUrl, pageMetadata, siteName } from "@/lib/seo";
import { localePath } from "@/lib/i18n";

type BlogLocale = "en" | "de" | "ru" | "ar" | "pl" | "zh";

type PageProps = { params: Promise<{ slug: string }> };

const blogArticleCopy: Record<BlogLocale, {
  home: string; blog: string; bookExperience: string; viewDetails: string; from: string; perPerson: string;
  faqHeading: string; whatsapp: string; moreGuides: string; dateLocale: string;
}> = {
  en: {
    home: "Home", blog: "Blog", bookExperience: "Book the experience", viewDetails: "View details →",
    from: "From", perPerson: "per person", faqHeading: "Frequently asked questions", whatsapp: "Ask us on WhatsApp", moreGuides: "More guides", dateLocale: "en-US",
  },
  ar: {
    home: "الرئيسية", blog: "المدونة", bookExperience: "احجز التجربة", viewDetails: "عرض التفاصيل ←",
    from: "ابتداءً من", perPerson: "للشخص", faqHeading: "الأسئلة الشائعة", whatsapp: "تواصل معنا عبر واتساب", moreGuides: "المزيد من الأدلة", dateLocale: "ar-EG",
  },
  de: {
    home: "Startseite", blog: "Blog", bookExperience: "Erlebnis buchen", viewDetails: "Details ansehen →",
    from: "Ab", perPerson: "pro Person", faqHeading: "Häufig gestellte Fragen", whatsapp: "Frag uns auf WhatsApp", moreGuides: "Weitere Reiseführer", dateLocale: "de-DE",
  },
  ru: {
    home: "Главная", blog: "Блог", bookExperience: "Забронировать", viewDetails: "Подробнее →",
    from: "От", perPerson: "за человека", faqHeading: "Часто задаваемые вопросы", whatsapp: "Написать нам в WhatsApp", moreGuides: "Больше гидов", dateLocale: "ru-RU",
  },
  pl: {
    home: "Strona główna", blog: "Blog", bookExperience: "Zarezerwuj atrakcję", viewDetails: "Zobacz szczegóły →",
    from: "Od", perPerson: "za osobę", faqHeading: "Najczęściej zadawane pytania", whatsapp: "Napisz do nas na WhatsApp", moreGuides: "Więcej poradników", dateLocale: "pl-PL",
  },
  zh: {
    home: "首页", blog: "博客", bookExperience: "预订体验", viewDetails: "查看详情 →",
    from: "起价", perPerson: "每人", faqHeading: "常见问题", whatsapp: "通过 WhatsApp 联系我们", moreGuides: "更多指南", dateLocale: "zh-CN",
  },
};

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getLiveBlogPosts()).find((item) => item.slug === slug);
  if (!post) return {};
  return pageMetadata({ title: `${post.title} | Daily Red Sea`, description: post.metaDescription, path: `/blog/${post.slug}`, image: post.heroImage });
}

export async function LocalizedBlogArticle({ params, locale = "en" }: PageProps & { locale?: BlogLocale }) {
  const { slug } = await params;
  const copy = blogArticleCopy[locale];
  const [posts, tours] = await Promise.all([getLiveBlogPosts(), getLiveTours(locale)]);
  const rawPost = posts.find((item) => item.slug === slug);
  if (!rawPost) notFound();
  const post = localizeBlogPost(rawPost, locale);

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
          <Link href={localePath(locale)}>{copy.home}</Link>
          <span className="px-2">/</span>
          <Link href={localePath(locale, "/blog")}>{copy.blog}</Link>
        </nav>
        <p className="mt-6 text-sm text-slate-500">
          {new Date(post.publishedAt).toLocaleDateString(copy.dateLocale, { year: "numeric", month: "long", day: "numeric" })}
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
            <h2 className="text-xl font-black text-cyan-950">{copy.bookExperience}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {relatedTours.map((tour) => (
                <Link key={tour.slug} href={localePath(locale, `/tours/${tour.slug}`)} className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="font-bold">{tour.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{copy.from} {tour.originalPrice && Number(tour.originalPrice) > Number(tour.price) ? <span className="mr-1 line-through text-slate-400">${tour.originalPrice}</span> : null}${tour.price} {copy.perPerson}</p>
                  <span className="mt-2 inline-block text-sm font-bold text-blue-700">{copy.viewDetails}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <h2 className="text-2xl font-black">{copy.faqHeading}</h2>
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
          <a href="https://wa.me/201030809150" className="rounded-full bg-green-600 px-7 py-4 font-bold text-white">{copy.whatsapp}</a>
          <Link href={localePath(locale, "/blog")} className="rounded-full border px-7 py-4 font-bold">{copy.moreGuides}</Link>
        </div>
      </article>
    </main>
  );
}

export default function BlogArticlePage(props: PageProps) {
  return <LocalizedBlogArticle {...props} />;
}
