import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryTourExplorer from "@/components/categories/CategoryTourExplorer";
import { getLiveTours } from "@/lib/live-content";
import { categoryLabels, getTourCategory, tourCategories } from "@/lib/tour-categories";
import { absoluteUrl, normalizeMetaDescription, normalizeMetaTitle, siteName } from "@/lib/seo";
import { languageAlternates, localePath } from "@/lib/i18n";
import { localizeTourArabic, localizeTourChinese, localizeTourGerman, localizeTourPolish, localizeTourRussian } from "@/lib/tour-localization";

type PageProps = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return tourCategories.map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = getTourCategory((await params).category);
  if (!category) return {};
  const path = `/hurghada/${category.slug}`;
  const title = normalizeMetaTitle(`${category.title} in Hurghada`);
  const description = normalizeMetaDescription(category.description);
  return {
    title,
    description,
    alternates: { canonical: path, languages: { ...languageAlternates(path), "x-default": localePath("en", path) } },
    openGraph: { title, description, url: absoluteUrl(path), siteName, type: "website" },
  };
}

export default async function TourCategoryPage({ params, locale = "en" }: PageProps & { locale?: "en" | "de" | "ru" | "ar" | "pl" | "zh" }) {
  const category = getTourCategory((await params).category);
  if (!category) notFound();
  const de = locale === "de";
  const ru = locale === "ru";
  const ar = locale === "ar";
  const pl = locale === "pl";
  const zh = locale === "zh";
  const tours = await getLiveTours();
  const categoryTours = tours.filter(category.matches).map((tour) => de ? localizeTourGerman(tour) : ru ? localizeTourRussian(tour) : ar ? localizeTourArabic(tour) : pl ? localizeTourPolish(tour) : zh ? localizeTourChinese(tour) : tour);
  const displayTitle = categoryLabels[locale][category.slug];
  const relatedDivingCopy = {
    en: { title: "Dive deeper into Hurghada", text: "Compare guided diving and snorkeling experiences, from first dives to full-day reef trips.", cta: "Explore diving & snorkeling" },
    de: { title: "Tauche tiefer in Hurghada ein", text: "Entdecke geführte Tauch- und Schnorchelausflüge – vom ersten Tauchgang bis zum ganztägigen Rifftrip.", cta: "Tauchen & Schnorcheln entdecken" },
    ru: { title: "Откройте подводный мир Хургады", text: "Сравните дайвинг и сноркелинг с гидом — от первого погружения до целого дня у рифов.", cta: "Смотреть дайвинг и сноркелинг" },
    ar: { title: "اكتشف عالم الغردقة تحت الماء", text: "قارن بين رحلات الغوص والسنوركلينج مع مرشدين، من التجربة الأولى إلى رحلات الشعاب ليوم كامل.", cta: "استكشف الغوص والسنوركلينج" },
    pl: { title: "Odkryj nurkowanie i snorkeling w Hurghadzie", text: "Porównaj wycieczki z przewodnikiem — od pierwszego nurkowania po całodniowe wyprawy na rafy.", cta: "Odkryj nurkowanie i snorkeling" },
    zh: { title: "探索赫尔格达的海底世界", text: "比较有导游的深潜和浮潜体验，从首次潜水到全天珊瑚礁行程。", cta: "探索深潜与浮潜" },
  }[locale] || { title: "Discover diving & snorkeling", text: "Compare guided diving and snorkeling experiences in Hurghada.", cta: "Explore diving & snorkeling" };
  const pageUrl = absoluteUrl(`/hurghada/${category.slug}`);
  const buyerGuide = locale === "en" ? ({
    "island-trips": {
      title: "Compare Hurghada island trips",
      intro: "Choose by travel style, not only by the island name. Every option below links to trips with current duration, inclusions and booking details.",
      options: [
        { title: "Relaxed beach day", text: "Choose Orange Bay or Mahmya when beach time, swimming and a full-day boat experience matter most." },
        { title: "Private and flexible", text: "Choose a private speedboat when you want a shorter journey, a smaller group and more control over timing." },
        { title: "Snorkeling focused", text: "Choose a reef or Dolphin House itinerary when time in the water matters more than an extended island stay." },
      ],
      questions: [
        { q: "Which Hurghada island trip is best for families?", a: "A full-day boat trip with hotel pickup, lunch, shaded seating and clearly stated child pricing is usually the easiest family option. Check each trip's age guidance before booking." },
        { q: "Are snorkeling equipment and hotel pickup included?", a: "Inclusions vary by trip. Each Daily Red Sea listing states whether equipment, lunch, drinks, island entry and pickup are included before you book." },
      ],
    },
    "diving-snorkeling": {
      title: "Choose the right Red Sea experience",
      intro: "Compare snorkeling and diving by experience level, time in the water and certification requirements.",
      options: [
        { title: "First-time snorkelers", text: "Start with a guided full-day snorkeling boat trip with equipment, lunch and multiple reef stops." },
        { title: "First-time divers", text: "Choose an introductory dive led by an instructor; no previous certification should be assumed unless the listing says otherwise." },
        { title: "Certified divers", text: "Choose a two-dive day and check the equipment, certification and recent-diving requirements shown on the tour page." },
      ],
      questions: [
        { q: "Can beginners snorkel in Hurghada?", a: "Yes. Guided trips provide a briefing and flotation equipment, but guests should always tell the crew their swimming confidence and follow sea-condition advice." },
        { q: "When is snorkeling best in Hurghada?", a: "Trips operate throughout the year. The captain selects suitable reef stops for the day's wind, visibility and sea conditions." },
      ],
    },
  } as Record<string, { title: string; intro: string; options: Array<{ title: string; text: string }>; questions: Array<{ q: string; a: string }> }>)[category.slug] : undefined;
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.title} in Hurghada`,
    url: pageUrl,
    numberOfItems: categoryTours.length,
    itemListElement: categoryTours.map((tour, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/tours/${tour.slug}`),
      name: tour.title,
    })),
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <section className="bg-slate-950 px-6 pb-20 pt-32 text-white sm:px-8">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-400"><Link href={localePath(locale)} className="hover:text-white">{de ? "Startseite" : ru ? "Главная" : ar ? "الرئيسية" : pl ? "Strona główna" : zh ? "首页" : "Home"}</Link><span className="px-2">/</span><span>{ru ? "Хургада" : ar ? "الغردقة" : zh ? "赫尔格达" : "Hurghada"}</span><span className="px-2">/</span><span className="text-white">{displayTitle}</span></nav>
          <p className="mt-10 font-semibold uppercase tracking-[0.28em] text-cyan-300">{ru ? "Экскурсии в Хургаде" : ar ? "رحلات الغردقة" : pl ? "Wycieczki w Hurghadzie" : zh ? "赫尔格达旅游项目" : category.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black sm:text-6xl">{zh ? `赫尔格达${displayTitle}` : <>{displayTitle} {de ? "in Hurghada" : ru ? "в Хургаде" : "in Hurghada"}</>}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{de ? "Entdecke passende Ausflüge Hurghada mit transparenten Preisen, klaren Leistungen und direkter Bestätigung." : ru ? "Выбирайте экскурсии в Хургаде с прозрачными ценами, понятным описанием услуг и прямым подтверждением." : ar ? "اختر رحلات الغردقة بأسعار واضحة وخدمات مفهومة وتأكيد مباشر." : pl ? "Wybierz wycieczki w Hurghadzie z jasnymi cenami, czytelnym zakresem usług i bezpośrednim potwierdzeniem." : zh ? "探索适合您的赫尔格达行程，价格透明、包含项目清晰，并可获得直接确认。" : category.description}</p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold"><span className="rounded-full bg-white/10 px-4 py-2">{de ? "Klare lokale Preise" : ru ? "Понятные местные цены" : ar ? "أسعار محلية واضحة" : pl ? "Jasne lokalne ceny" : zh ? "透明本地价格" : "Clear local prices"}</span><span className="rounded-full bg-white/10 px-4 py-2">{de ? "Bestätigung per WhatsApp" : ru ? "Подтверждение в WhatsApp" : ar ? "تأكيد عبر واتساب" : pl ? "Potwierdzenie przez WhatsApp" : zh ? "WhatsApp 确认" : "WhatsApp confirmation"}</span><span className="rounded-full bg-white/10 px-4 py-2">{de ? "Barzahlung bei Ankunft" : ru ? "Оплата наличными по прибытии" : ar ? "الدفع نقداً عند الوصول" : pl ? "Płatność gotówką na miejscu" : zh ? "抵达后现金付款" : "Cash on arrival"}</span></div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <CategoryTourExplorer tours={categoryTours} locale={locale} />
      </section>
      {buyerGuide ? <section className="border-t border-slate-200 bg-white px-6 py-16 sm:px-8"><div className="mx-auto max-w-6xl"><h2 className="text-3xl font-black text-slate-950">{buyerGuide.title}</h2><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{buyerGuide.intro}</p><div className="mt-8 grid gap-5 md:grid-cols-3">{buyerGuide.options.map((option) => <article key={option.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6"><h3 className="text-xl font-black text-slate-950">{option.title}</h3><p className="mt-3 leading-7 text-slate-600">{option.text}</p></article>)}</div><div className="mt-10 rounded-3xl border border-cyan-200 bg-cyan-50 p-7"><h2 className="text-2xl font-black text-slate-950">Planning questions</h2><div className="mt-4 divide-y divide-cyan-200">{buyerGuide.questions.map((item) => <details key={item.q} className="py-4"><summary className="cursor-pointer font-bold text-slate-950">{item.q}</summary><p className="mt-3 leading-7 text-slate-700">{item.a}</p></details>)}</div></div></div></section> : null}
      {category.slug !== "diving-snorkeling" ? <section className="border-t border-slate-200 bg-cyan-50 px-6 py-16 sm:px-8"><div className="mx-auto max-w-4xl rounded-3xl border border-cyan-200 bg-white p-8"><h2 className="text-3xl font-black text-slate-950">{relatedDivingCopy.title}</h2><p className="mt-4 max-w-2xl leading-8 text-slate-600">{relatedDivingCopy.text}</p><Link href={localePath(locale, "/hurghada/diving-snorkeling")} className="mt-6 inline-block rounded-full bg-cyan-700 px-6 py-3 font-bold text-white">{relatedDivingCopy.cta} →</Link></div></section> : null}
      <section className="border-t border-slate-200 bg-white px-6 py-16 sm:px-8"><div className="mx-auto max-w-4xl"><h2 className="text-3xl font-black text-slate-950">{de ? "Mit klaren Informationen buchen" : ru ? "Бронируйте с полной информацией" : ar ? "احجز مع معلومات واضحة" : pl ? "Rezerwuj z jasnymi informacjami" : zh ? "信息清晰，放心预订" : "Book with clear information"}</h2><p className="mt-4 leading-8 text-slate-600">{de ? "Jeder Ausflug zeigt Startpreis, Dauer, Abholung, enthaltene Leistungen und wichtige Hinweise vor der Buchung. Unser Team bestätigt die endgültigen Details direkt per WhatsApp." : ru ? "Перед бронированием вы увидите начальную цену, продолжительность, информацию о трансфере, включённые услуги и важные примечания. Наша местная команда подтвердит окончательные детали в WhatsApp." : ar ? "قبل الحجز ستظهر لك السعر المبدئي والمدة والاستلام والخدمات المشمولة والملاحظات المهمة. سيؤكد فريقنا التفاصيل النهائية عبر واتساب." : pl ? "Przed rezerwacją zobaczysz cenę wyjściową, czas trwania, informacje o odbiorze, zakres świadczeń i ważne uwagi. Nasz zespół potwierdzi szczegóły przez WhatsApp." : zh ? "每个项目都会在预订前展示起价、时长、接送信息、包含项目和重要提示。我们的本地团队会通过 WhatsApp 确认最终详情。" : "Every Daily Red Sea experience shows its starting price, duration, pickup information, inclusions, and practical notes before you submit a booking. Our local team confirms final pickup details directly on WhatsApp."}</p></div></section>
    </main>
  );
}
