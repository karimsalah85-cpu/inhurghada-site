import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryTourExplorer from "@/components/categories/CategoryTourExplorer";
import { getDestination } from "@/lib/destinations";
import { getLiveTours } from "@/lib/live-content";
import { localePath, type Locale } from "@/lib/i18n";
import { localizeTour } from "@/lib/tour-localization";
import { absoluteUrl } from "@/lib/seo";
import { categoryLabels, getTourCategory } from "@/lib/tour-categories";

const uiByLocale: Record<Locale, {
  home: string; experiences: string; compare: (category: string, destination: string) => string;
  clearPrices: string; localDetails: string; directSupport: string; guide: string; questions: string;
  allTours: (destination: string) => string;
}> = {
  en: { home: "Home", experiences: "experiences", compare: (category, destination) => `Compare ${category.toLowerCase()} in ${destination} with clear prices, schedules, meeting details and direct booking support.`, clearPrices: "Clear local prices", localDetails: "Local meeting details", directSupport: "Direct booking support", guide: "Choose the right experience", questions: "Planning questions", allTours: (destination) => `Explore all ${destination} tours` },
  ar: { home: "الرئيسية", experiences: "تجارب", compare: (category, destination) => `قارن ${category} في ${destination} مع أسعار ومواعيد وتفاصيل تجمع واضحة ودعم مباشر للحجز.`, clearPrices: "أسعار محلية واضحة", localDetails: "تفاصيل تجمع واضحة", directSupport: "دعم مباشر للحجز", guide: "اختر التجربة المناسبة", questions: "أسئلة التخطيط", allTours: (destination) => `استكشف كل رحلات ${destination}` },
  de: { home: "Startseite", experiences: "Erlebnisse", compare: (category, destination) => `Vergleiche ${category} in ${destination} mit klaren Preisen, Zeiten, Treffpunktdetails und direkter Buchungshilfe.`, clearPrices: "Klare lokale Preise", localDetails: "Klare Treffpunktdetails", directSupport: "Direkte Buchungshilfe", guide: "Das passende Erlebnis wählen", questions: "Fragen zur Planung", allTours: (destination) => `Alle Touren in ${destination}` },
  ru: { home: "Главная", experiences: "экскурсии", compare: (category) => `Сравните ${category} в Джидде: цены, расписание, место встречи и помощь с бронированием.`, clearPrices: "Понятные местные цены", localDetails: "Точное место встречи", directSupport: "Помощь с бронированием", guide: "Выберите подходящую поездку", questions: "Вопросы для планирования", allTours: () => "Все экскурсии в Джидде" },
  pl: { home: "Strona główna", experiences: "atrakcje", compare: (category, destination) => `Porównaj ${category} w ${destination}: ceny, harmonogram, miejsce spotkania i pomoc przy rezerwacji.`, clearPrices: "Jasne ceny lokalne", localDetails: "Szczegóły miejsca spotkania", directSupport: "Pomoc przy rezerwacji", guide: "Wybierz odpowiednią atrakcję", questions: "Pytania przed wyjazdem", allTours: (destination) => `Wszystkie atrakcje w ${destination}` },
  zh: { home: "首页", experiences: "个体验", compare: (category, destination) => `比较${destination}的${category}，查看价格、时间、集合地点和预订支持。`, clearPrices: "透明本地价格", localDetails: "明确集合地点", directSupport: "直接预订支持", guide: "选择适合您的体验", questions: "行前问题", allTours: (destination) => `查看${destination}全部行程` },
};

const jeddahGuides = {
  en: {
    "diving-snorkeling": { intro: "Choose by certification level and the kind of training or diving day you need.", options: [["First-time divers", "Choose the SSI Basic Diver experience for theory, confined-water skills and one supervised open-water dive."], ["Certified divers", "Choose the two-dive boat trip and check certification, equipment and recent-diving requirements before booking."], ["Before you reserve", "Compare duration, meeting point, equipment inclusions and flying-after-diving guidance on each tour page."]], faqs: [["Can I scuba dive in Jeddah without certification?", "Yes. The beginner experience is designed for first-time, non-certified participants and includes instructor supervision."], ["Which trip is for certified divers?", "The guided two-dive boat trip requires a recognized diving certification. Confirm equipment and documentation requirements before arrival."]] },
    "boat-cruises": { intro: "Compare Jeddah yacht cruises by sailing time, duration, onboard facilities and meeting point.", options: [["Sunset views", "Choose the Shorouk Sat golden-hour sailing for open-deck views across Obhur Bay."], ["Onboard comfort", "Review the air-conditioned salon, restroom, seating and refreshment details before booking."], ["Plan your arrival", "Check the assembly time, sailing time and exact marina meeting instructions on the product page."]], faqs: [["Where do Jeddah sunset cruises depart?", "The current Shorouk Sat listing departs in the Obhur Bay area. Follow the confirmed meeting instructions sent for your booking."], ["Is the Jeddah sunset cruise suitable for families?", "The listing includes adult, child and infant pricing. Review the current age bands and onboard guidance before booking."]] },
  },
  ar: {
    "diving-snorkeling": { intro: "اختر حسب مستوى الشهادة ونوع التدريب أو يوم الغوص الذي يناسبك.", options: [["للمبتدئين", "اختر تجربة SSI Basic Diver التي تشمل النظرية والتدريب في مياه محصورة وغطسة واحدة بإشراف مدرب."], ["للغواصين المعتمدين", "اختر رحلة القارب بغطستين وتحقق من متطلبات الشهادة والمعدات وآخر غوصة قبل الحجز."], ["قبل الحجز", "قارن المدة ونقطة التجمع والمعدات المشمولة وإرشادات السفر جواً بعد الغوص في صفحة كل رحلة."]], faqs: [["هل يمكنني تجربة الغوص في جدة بدون شهادة؟", "نعم. تجربة المبتدئين مخصصة لمن يغوص لأول مرة ولا يحمل شهادة، وتتم بإشراف مدرب."], ["ما الرحلة المناسبة للغواصين المعتمدين؟", "تتطلب رحلة القارب بغطستين شهادة غوص معترفاً بها. تأكد من متطلبات المعدات والوثائق قبل الوصول."]] },
    "boat-cruises": { intro: "قارن جولات اليخوت في جدة حسب وقت الإبحار والمدة ومرافق اليخت ونقطة التجمع.", options: [["مشاهدة الغروب", "اختر جولة شروق سات وقت الغروب للاستمتاع بإطلالات خليج أبحر من الأسطح المفتوحة."], ["الراحة على اليخت", "راجع تفاصيل الصالون المكيف ودورات المياه وأماكن الجلوس والمشروبات قبل الحجز."], ["خطط لوصولك", "تحقق من وقت التجمع وموعد الإبحار وتعليمات الوصول إلى المرسى في صفحة الرحلة."]], faqs: [["من أين تنطلق جولة الغروب في جدة؟", "تنطلق جولة شروق سات الحالية من منطقة خليج أبحر. اتبع تعليمات التجمع المؤكدة المرسلة مع حجزك."], ["هل جولة الغروب في جدة مناسبة للعائلات؟", "تعرض الرحلة أسعاراً للبالغين والأطفال والرضع. راجع الفئات العمرية وإرشادات الرحلة قبل الحجز."]] },
  },
} as const;

export default async function DestinationCategoryPage({ destinationSlug, categorySlug, locale = "en" }: { destinationSlug: string; categorySlug: string; locale?: Locale }) {
  const destination = getDestination(destinationSlug);
  const category = getTourCategory(categorySlug);
  if (!destination || destination.status !== "live" || !category) notFound();
  const tours = (await getLiveTours(locale)).filter((tour) => tour.destinationSlug === destination.slug && tour.listingStatus !== "paused" && tour.listingStatus !== "unlisted" && category.matches(tour)).map((tour) => localizeTour(tour, locale));
  if (!tours.length) notFound();
  const ui = uiByLocale[locale];
  const displayTitle = categoryLabels[locale][category.slug];
  const destinationName = locale === "ar" && destination.slug === "jeddah" ? "جدة" : destination.name;
  const path = `/${destination.slug}/${category.slug}`;
  const pageUrl = absoluteUrl(localePath(locale, path));
  const destinationPath = localePath(locale, `/destinations/${destination.slug}`);
  const guide = destination.slug === "jeddah" && (locale === "en" || locale === "ar") ? jeddahGuides[locale][category.slug as keyof typeof jeddahGuides[typeof locale]] : undefined;
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "BreadcrumbList", "@id": `${pageUrl}#breadcrumb`, itemListElement: [{ "@type": "ListItem", position: 1, name: ui.home, item: absoluteUrl(localePath(locale)) }, { "@type": "ListItem", position: 2, name: destinationName, item: absoluteUrl(destinationPath) }, { "@type": "ListItem", position: 3, name: displayTitle, item: pageUrl }] },
    { "@type": "ItemList", name: `${displayTitle} · ${destinationName}`, url: pageUrl, inLanguage: locale, numberOfItems: tours.length, itemListElement: tours.map((tour, index) => ({ "@type": "ListItem", position: index + 1, url: absoluteUrl(localePath(locale, `/tours/${tour.slug}`)), name: tour.title })) },
    ...(guide ? [{ "@type": "FAQPage", mainEntity: guide.faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }] : []),
  ] };
  return <main dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-surface-muted">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <section className="bg-ink px-6 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-6xl"><nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href={localePath(locale)}>{ui.home}</Link><span className="px-2">/</span><Link href={destinationPath}>{destinationName}</Link><span className="px-2">/</span><span className="text-white">{displayTitle}</span></nav><p className="mt-10 font-semibold uppercase tracking-[0.28em] text-ocean-soft">{destinationName} · {ui.experiences}</p><h1 className="mt-4 text-4xl font-black sm:text-6xl">{displayTitle} · {destinationName}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-line">{ui.compare(displayTitle, destinationName)}</p><div className="mt-8 flex flex-wrap gap-3 text-sm font-bold"><span className="rounded-full bg-white/10 px-4 py-2">{ui.clearPrices}</span><span className="rounded-full bg-white/10 px-4 py-2">{ui.localDetails}</span><span className="rounded-full bg-white/10 px-4 py-2">{ui.directSupport}</span></div></div></section>
    <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8"><CategoryTourExplorer tours={tours} locale={locale}/></section>
    {guide ? <section className="border-t border-line bg-white px-6 py-16 sm:px-8"><div className="mx-auto max-w-6xl"><h2 className="text-3xl font-black text-ink">{ui.guide}</h2><p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{guide.intro}</p><div className="mt-8 grid gap-5 md:grid-cols-3">{guide.options.map(([title, text]) => <article key={title} className="rounded-3xl border border-line bg-surface-muted p-6"><h3 className="text-xl font-black text-ink">{title}</h3><p className="mt-3 leading-7 text-muted">{text}</p></article>)}</div><div className="mt-10 rounded-3xl border border-ocean-soft bg-ocean-tint p-7"><h2 className="text-2xl font-black text-ink">{ui.questions}</h2><div className="mt-4 divide-y divide-ocean-soft">{guide.faqs.map(([question, answer]) => <details key={question} className="py-4"><summary className="cursor-pointer font-bold text-ink">{question}</summary><p className="mt-3 leading-7 text-ink">{answer}</p></details>)}</div></div></div></section> : null}
    <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8"><Link href={destinationPath} className="inline-flex rounded-full bg-ocean-dark px-6 py-3 font-bold text-white">{ui.allTours(destinationName)} →</Link></section>
  </main>;
}
