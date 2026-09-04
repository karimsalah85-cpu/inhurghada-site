import type { Metadata } from "next";
import Link from "next/link";
import Image from "@/components/media/WatermarkedImage";
import { getLiveBlogPosts } from "@/lib/live-content";
import { localizeBlogPosts } from "@/lib/blog-localization";
import { pageMetadata } from "@/lib/seo";
import { localePath } from "@/lib/i18n";

export const metadata: Metadata = pageMetadata({
  title: "Hurghada Travel Guides & Tips | Daily Red Sea Blog",
  description: "Practical guides to Hurghada tours, snorkeling, diving, desert safaris and transfers - written by a local operator.",
  path: "/blog",
});

type BlogLocale = "en" | "de" | "ru" | "ar" | "pl" | "zh";

const blogIndexCopy: Record<BlogLocale, { eyebrow: string; heading: string; subtitle: string; readMore: string; dateLocale: string }> = {
  en: {
    eyebrow: "Daily Red Sea · Guides",
    heading: "Hurghada travel guides & tips",
    subtitle: "Straight answers on Hurghada tours, snorkeling, diving and desert safaris from a local team who runs these trips every day.",
    readMore: "Read more →",
    dateLocale: "en-US",
  },
  ar: {
    eyebrow: "Daily Red Sea · أدلة السفر",
    heading: "أدلة ونصائح السفر في الغردقة",
    subtitle: "إجابات واضحة عن رحلات الغردقة والسنوركلينج والغوص وسفاري الصحراء من فريق محلي يدير هذه الرحلات يوميًا.",
    readMore: "اقرأ المزيد ←",
    dateLocale: "ar-EG",
  },
  de: {
    eyebrow: "Daily Red Sea · Reiseführer",
    heading: "Hurghada Reiseführer & Tipps",
    subtitle: "Klare Antworten zu Ausflügen, Schnorcheln, Tauchen und Wüstensafaris in Hurghada von einem lokalen Team, das diese Touren täglich durchführt.",
    readMore: "Weiterlesen →",
    dateLocale: "de-DE",
  },
  ru: {
    eyebrow: "Daily Red Sea · Гиды",
    heading: "Гиды и советы по Хургаде",
    subtitle: "Понятные ответы об экскурсиях, сноркелинге, дайвинге и сафари в Хургаде от местной команды, которая проводит эти поездки каждый день.",
    readMore: "Читать далее →",
    dateLocale: "ru-RU",
  },
  pl: {
    eyebrow: "Daily Red Sea · Poradniki",
    heading: "Poradniki i wskazówki o Hurghadzie",
    subtitle: "Konkretne odpowiedzi o wycieczkach, snorkelingu, nurkowaniu i safari w Hurghadzie od lokalnego zespołu, który prowadzi te wyjazdy każdego dnia.",
    readMore: "Czytaj więcej →",
    dateLocale: "pl-PL",
  },
  zh: {
    eyebrow: "Daily Red Sea · 旅行指南",
    heading: "赫尔格达旅行指南与贴士",
    subtitle: "关于赫尔格达旅游、浮潜、潜水和沙漠探险的实用解答，来自每天带团的本地团队。",
    readMore: "阅读更多 →",
    dateLocale: "zh-CN",
  },
};

export async function LocalizedBlogIndex({ locale = "en" }: { locale?: BlogLocale }) {
  const copy = blogIndexCopy[locale];
  const blogPosts = localizeBlogPosts(await getLiveBlogPosts(), locale);
  const posts = [...blogPosts].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <p className="font-bold text-ocean-dark">{copy.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black sm:text-5xl">{copy.heading}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        {copy.subtitle}
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={localePath(locale, `/blog/${post.slug}`)}
            className="rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:border-ocean"
          >
            <div className="relative -mx-6 -mt-6 mb-5 h-52 overflow-hidden rounded-t-3xl bg-surface-muted">
              <Image src={post.heroImage} alt={post.title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
            </div>
            <p className="text-sm text-muted">{new Date(post.publishedAt).toLocaleDateString(copy.dateLocale, { year: "numeric", month: "long", day: "numeric" })}</p>
            <h2 className="mt-2 text-xl font-black">{post.title}</h2>
            <p className="mt-3 leading-7 text-muted">{post.metaDescription}</p>
            <span className="mt-4 inline-block font-bold text-ocean-dark">{copy.readMore}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default function BlogIndexPage() {
  return <LocalizedBlogIndex />;
}
