import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { tours } from "@/data/tours";
import { dictionaries, isLocale, languageAlternates, localeOg, localePath, locales, type Locale } from "@/lib/i18n";
import { absoluteUrl, defaultSocialImage, siteName, siteUrl } from "@/lib/seo";
import { categoryLabels, getTourCategory, tourCategories } from "@/lib/tour-categories";
import HomePage from "@/app/page";
import TransfersPage from "@/app/transfers/page";
import BookingPage from "@/app/booking/page";
import CheckoutPage from "@/app/checkout/page";
import AboutPage from "@/app/about/page";
import ContactPage from "@/app/contact/page";
import FaqPage from "@/app/faq/page";
import PrivacyPolicyPage from "@/app/privacy-policy/page";
import TermsConditionsPage from "@/app/terms-conditions/page";
import TourPageShell from "@/components/tours/TourPageShell";
import TourCategoryPage from "@/app/hurghada/[category]/page";

type LocalizedPageProps = { params: Promise<{ locale: string; path?: string[] }> };

const tourTitles: Partial<Record<Locale, Record<string, string>>> = {
  ar: {
    "orange-bay": "رحلة أورانج باي البحرية والسنوركلينج", safari: "مغامرة سفاري الصحراء", "professional-underwater-photographer": "مصور محترف تحت الماء", "mahmya-island": "رحلة جزيرة المحمية", "full-day-snorkeling": "رحلة سنوركلينج ليوم كامل", "full-day-diving": "رحلة غوص ليوم كامل", "quad-safari-morning": "سفاري كواد صباحي", "quad-safari-sunset": "سفاري كواد وقت الغروب", "hurghada-airport-transfer": "توصيل خاص من مطار الغردقة", "senzo-transfer": "توصيل خاص من وإلى سنزو مول", "luxor-private-day-trip": "رحلة خاصة إلى الأقصر من الغردقة",
  },
  de: {
    "orange-bay": "Orange Bay Bootstour mit Schnorcheln", safari: "Wüstensafari-Abenteuer", "professional-underwater-photographer": "Professioneller Unterwasserfotograf", "mahmya-island": "Mahmya Island Bootstour", "full-day-snorkeling": "Ganztägige Schnorcheltour", "full-day-diving": "Ganztägige Tauchtour", "quad-safari-morning": "Quad-Safari am Morgen", "quad-safari-sunset": "Quad-Safari bei Sonnenuntergang", "hurghada-airport-transfer": "Privater Flughafentransfer Hurghada", "senzo-transfer": "Privater Transfer zur Senzo Mall", "luxor-private-day-trip": "Privater Tagesausflug nach Luxor ab Hurghada",
  },
  ru: {
    "orange-bay": "Морская прогулка на Orange Bay со сноркелингом", safari: "Сафари в пустыне", "professional-underwater-photographer": "Профессиональный подводный фотограф", "mahmya-island": "Морская прогулка на остров Махмея", "full-day-snorkeling": "Сноркелинг на весь день", "full-day-diving": "Дайвинг на весь день", "quad-safari-morning": "Утреннее сафари на квадроциклах", "quad-safari-sunset": "Сафари на квадроциклах на закате", "hurghada-airport-transfer": "Частный трансфер из аэропорта Хургады", "senzo-transfer": "Частный трансфер в Senzo Mall", "luxor-private-day-trip": "Индивидуальная поездка в Луксор из Хургады",
  },
  pl: {
    "orange-bay": "Rejs na Orange Bay ze snorkelingiem", safari: "Pustynne safari", "professional-underwater-photographer": "Profesjonalny fotograf podwodny", "mahmya-island": "Rejs na wyspę Mahmya", "full-day-snorkeling": "Całodniowy snorkeling", "full-day-diving": "Całodniowe nurkowanie", "quad-safari-morning": "Poranne safari na quadach", "quad-safari-sunset": "Safari na quadach o zachodzie słońca", "hurghada-airport-transfer": "Prywatny transfer z lotniska w Hurghadzie", "senzo-transfer": "Prywatny transfer do Senzo Mall", "luxor-private-day-trip": "Prywatna wycieczka do Luksoru z Hurghady",
  },
  zh: {
    "orange-bay": "橙湾浮潜游船之旅", safari: "沙漠探险", "professional-underwater-photographer": "专业水下摄影师", "mahmya-island": "马赫米亚岛游船之旅", "full-day-snorkeling": "全天浮潜之旅", "full-day-diving": "全天深潜之旅", "quad-safari-morning": "清晨四轮摩托沙漠探险", "quad-safari-sunset": "日落四轮摩托沙漠探险", "hurghada-airport-transfer": "赫尔格达机场私人接送", "senzo-transfer": "Senzo Mall 私人接送", "luxor-private-day-trip": "从赫尔格达出发的卢克索私人一日游",
  },
};

function localizedTourTitle(locale: Locale, slug: string, fallback: string) {
  return tourTitles[locale]?.[slug] || fallback;
}

function pageKind(path: string[]) {
  if (!path.length) return "home";
  if (path.length === 2 && path[0] === "tours") return "tour";
  if (path.length === 2 && path[0] === "hurghada" && getTourCategory(path[1])) return "category";
  return ["booking", "checkout", "transfers", "privacy-policy", "terms-conditions", "about", "contact", "faq"].includes(path.join("/")) ? path.join("/") : null;
}

export async function generateStaticParams() {
  const paths = [[], ["booking"], ["checkout"], ["transfers"], ["privacy-policy"], ["terms-conditions"], ["about"], ["contact"], ["faq"], ...tourCategories.map((category) => ["hurghada", category.slug]), ...tours.map((tour) => ["tours", tour.slug])];
  return locales.flatMap((locale) => paths.map((path) => ({ locale, path })));
}

export async function generateMetadata({ params }: LocalizedPageProps): Promise<Metadata> {
  const { locale: rawLocale, path = [] } = await params;
  if (!isLocale(rawLocale)) return {};
  const locale = rawLocale;
  const dictionary = dictionaries[locale];
  const kind = pageKind(path);
  const tour = kind === "tour" ? tours.find((item) => item.slug === path[1]) : undefined;
  const category = kind === "category" ? getTourCategory(path[1]) : undefined;
  const titles: Record<string, string> = { home: dictionary.heroTitle, booking: dictionary.bookingTitle, checkout: dictionary.checkoutTitle, transfers: dictionary.transfersTitle, "privacy-policy": dictionary.privacyTitle, "terms-conditions": dictionary.termsTitle, about: `${dictionary.about} Daily Red Sea`, contact: dictionary.contact, faq: `${dictionary.tours} FAQ` };
  const descriptions: Record<string, string> = { home: dictionary.siteDescription, booking: dictionary.bookingText, checkout: dictionary.checkoutText, transfers: dictionary.transfersText, "privacy-policy": dictionary.privacyText, "terms-conditions": dictionary.termsText, about: dictionary.whyText, contact: dictionary.bookingText, faq: dictionary.siteDescription };
  const title = tour ? localizedTourTitle(locale, tour.slug, tour.title) : category ? `${categoryLabels[locale][category.slug]} · Hurghada` : titles[kind || "home"];
  const description = tour ? `${title}. ${dictionary.siteDescription}` : category ? `${categoryLabels[locale][category.slug]}. ${dictionary.siteDescription}` : descriptions[kind || "home"];
  const pathname = `/${path.join("/")}`.replace(/\/$/, "");
  const canonical = localePath(locale, pathname);
  return {
    title,
    description,
    alternates: { canonical, languages: { ...languageAlternates(pathname), "x-default": localePath("en", pathname) } },
    robots: kind === "booking" || kind === "checkout" ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { title, description, url: `${siteUrl}${canonical}`, siteName, locale: localeOg[locale], type: "website", images: [defaultSocialImage] },
  };
}

export default async function LocalizedPage({ params }: LocalizedPageProps) {
  const { locale: rawLocale, path = [] } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;
  if (locale === "en") redirect(path.length ? `/${path.join("/")}` : "/");
  const dictionary = dictionaries[locale];
  const kind = pageKind(path);
  if (!kind) notFound();
  const direction = locale === "ar" ? "rtl" : "ltr";

  if (locale === "de") {
    if (kind === "home") return <HomePage />;
    if (kind === "tour") {
      const tour = tours.find((item) => item.slug === path[1]);
      if (!tour) notFound();
      return <TourPageShell locale="de" tour={{ ...tour, title: localizedTourTitle(locale, tour.slug, tour.title) }} />;
    }
    if (kind === "category") return <TourCategoryPage locale="de" params={Promise.resolve({ category: path[1] })} />;
    if (kind === "transfers") return <TransfersPage locale="de" />;
    if (kind === "booking") return <BookingPage />;
    if (kind === "checkout") return <CheckoutPage />;
    if (kind === "about") return <AboutPage locale="de" />;
    if (kind === "contact") return <ContactPage locale="de" />;
    if (kind === "faq") return <FaqPage locale="de" />;
    if (kind === "privacy-policy") return <PrivacyPolicyPage locale="de" />;
    if (kind === "terms-conditions") return <TermsConditionsPage locale="de" />;
  }

  if (kind === "tour") {
    const tour = tours.find((item) => item.slug === path[1]);
    if (!tour) notFound();
    const title = localizedTourTitle(locale, tour.slug, tour.title);
    const tourUrl = absoluteUrl(localePath(locale, `/tours/${tour.slug}`));
    const schema = { "@context": "https://schema.org", "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: dictionary.home, item: absoluteUrl(localePath(locale)) }, { "@type": "ListItem", position: 2, name: dictionary.tours, item: absoluteUrl(localePath(locale, "/#tours")) }, { "@type": "ListItem", position: 3, name: title, item: tourUrl }] },
      { "@type": "TouristTrip", name: title, description: dictionary.siteDescription, image: absoluteUrl(tour.image), url: tourUrl, inLanguage: locale, touristType: tour.category || dictionary.tours, offers: { "@type": "Offer", price: tour.price, priceCurrency: "USD", availability: "https://schema.org/InStock", url: tourUrl }, provider: { "@id": `${absoluteUrl()}#organization` } },
    ] };
    return <Shell locale={locale}><main dir={direction} className="bg-slate-50 pb-20"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><article className="mx-auto max-w-5xl px-6 py-16"><nav aria-label="Breadcrumb" className="text-sm text-slate-500"><Link href={localePath(locale)}>{dictionary.home}</Link><span className="px-2">/</span><span>{dictionary.tours}</span></nav><p className="mt-8 font-semibold text-cyan-700">{dictionary.tours} · Hurghada</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">{title}</h1><div className="relative mt-8 h-80 overflow-hidden rounded-[2rem]"><Image src={tour.image} alt={title} fill sizes="(max-width: 1024px) 100vw, 900px" className="object-cover" priority /></div><p className="mt-8 text-lg leading-8 text-slate-600">{dictionary.siteDescription}</p><div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">{dictionary.from}</p><p className="mt-2 text-3xl font-black text-blue-700">${tour.price}</p><p className="text-sm text-slate-500">{dictionary.perPerson}</p></div><div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">{dictionary.tours}</p><p className="mt-2 font-black">{tour.duration}</p></div><div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">Hurghada</p><p className="mt-2 font-black">{tour.category || dictionary.tours}</p></div></div><div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6"><h2 className="text-xl font-black text-emerald-950">{dictionary.cash}</h2><p className="mt-2 text-emerald-900">{dictionary.bookingText}</p></div><Link href={`/tours/${tour.slug}`} className="mt-8 inline-block rounded-full bg-blue-700 px-7 py-4 font-bold text-white">{dictionary.bookNow}</Link></article></main></Shell>;
  }

  if (kind === "home") return <Shell locale={locale}><main dir={direction}><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto max-w-5xl"><p className="font-bold text-cyan-300">Daily Red Sea · Hurghada</p><h1 className="mt-4 max-w-4xl text-4xl font-black sm:text-6xl">{dictionary.heroTitle}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">{dictionary.heroDescription}</p><Link href={`${localePath(locale)}#tours`} className="mt-8 inline-block rounded-full bg-cyan-500 px-7 py-4 font-bold text-slate-950">{dictionary.bookNow}</Link></div></section><section className="bg-slate-50 px-6 py-16"><div className="mx-auto max-w-7xl"><h2 className="text-3xl font-black">{dictionary.tours}</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tourCategories.map((category) => <Link key={category.slug} href={localePath(locale, `/hurghada/${category.slug}`)} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-400"><h3 className="text-xl font-black">{categoryLabels[locale][category.slug]}</h3><p className="mt-3 leading-7 text-slate-600">{dictionary.siteDescription}</p><span className="mt-5 inline-block font-bold text-blue-700">{dictionary.tours} →</span></Link>)}</div></div></section><section id="tours" className="mx-auto max-w-7xl px-6 py-20"><h2 className="text-3xl font-black">{dictionary.popularTours}</h2><div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{tours.map((tour) => <Link key={tour.slug} href={localePath(locale, `/tours/${tour.slug}`)} className="overflow-hidden rounded-3xl border bg-white shadow-sm"><div className="relative h-48"><Image src={tour.image} alt={localizedTourTitle(locale, tour.slug, tour.title)} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></div><div className="p-6"><p className="text-sm font-semibold text-cyan-700">{tour.duration}</p><h3 className="mt-2 text-xl font-bold">{localizedTourTitle(locale, tour.slug, tour.title)}</h3><p className="mt-4 font-black text-blue-700">{dictionary.from} ${tour.price} · {dictionary.perPerson}</p></div></Link>)}</div></section><section className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-5xl"><h2 className="text-3xl font-black">{dictionary.whyTitle}</h2><p className="mt-5 text-lg text-slate-600">{dictionary.whyText}</p><div className="mt-8 grid gap-4 sm:grid-cols-3">{[dictionary.cash, dictionary.support, dictionary.local].map((item) => <div key={item} className="rounded-2xl bg-white p-5 font-bold">{item}</div>)}</div><div className="mt-8 flex flex-wrap gap-3"><Link href={localePath(locale, "/about")} className="rounded-full border px-6 py-3 font-bold">{dictionary.about}</Link><Link href={localePath(locale, "/contact")} className="rounded-full bg-blue-700 px-6 py-3 font-bold text-white">{dictionary.contact}</Link></div></div></section></main></Shell>;

  if (kind === "category") {
    const category = getTourCategory(path[1]);
    if (!category) notFound();
    const categoryTours = tours.filter(category.matches);
    return <Shell locale={locale}><main dir={direction} className="bg-slate-50 pb-20"><section className="bg-slate-950 px-6 py-20 text-white"><div className="mx-auto max-w-5xl"><p className="font-bold text-cyan-300">Daily Red Sea · Hurghada</p><h1 className="mt-4 text-4xl font-black sm:text-6xl">{categoryLabels[locale][category.slug]}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{dictionary.siteDescription}</p></div></section><section className="mx-auto max-w-7xl px-6 py-16"><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{categoryTours.map((tour) => <Link key={tour.slug} href={localePath(locale, `/tours/${tour.slug}`)} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="relative h-52"><Image src={tour.image} alt={localizedTourTitle(locale, tour.slug, tour.title)} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></div><div className="p-6"><p className="text-sm text-slate-500">{tour.duration}</p><h2 className="mt-2 text-xl font-black">{localizedTourTitle(locale, tour.slug, tour.title)}</h2><p className="mt-4 font-black text-blue-700">{dictionary.from} ${tour.price} · {dictionary.perPerson}</p><span className="mt-5 inline-block font-bold text-cyan-700">{dictionary.bookNow} →</span></div></Link>)}</div></section></main></Shell>;
  }

  const content =
    kind === "booking" ? [dictionary.bookingTitle, dictionary.bookingText]
      : kind === "checkout" ? [dictionary.checkoutTitle, dictionary.checkoutText]
        : kind === "transfers" ? [dictionary.transfersTitle, dictionary.transfersText]
          : kind === "privacy-policy" ? [dictionary.privacyTitle, dictionary.privacyText]
            : kind === "terms-conditions" ? [dictionary.termsTitle, dictionary.termsText]
              : kind === "about" ? [`${dictionary.about} Daily Red Sea`, dictionary.whyText]
                : kind === "contact" ? [dictionary.contact, dictionary.bookingText]
                  : [`${dictionary.tours} FAQ`, dictionary.siteDescription];
  const legal = kind === "privacy-policy" || kind === "terms-conditions";
  return <Shell locale={locale}><main dir={direction} className="mx-auto max-w-4xl px-6 py-24"><h1 className="text-4xl font-black">{content[0]}</h1><p className="mt-6 text-lg leading-9 text-slate-600">{content[1]}</p>{legal ? <p className="mt-8 rounded-2xl bg-amber-50 p-5 text-sm text-amber-950">{dictionary.legalNotice}</p> : null}<div className="mt-9 flex flex-wrap gap-4"><a href="https://wa.me/201004933150" className="rounded-full bg-green-600 px-7 py-4 font-bold text-white">{kind === "booking" || kind === "checkout" ? dictionary.bookingCta : dictionary.contact}</a><Link href={localePath(locale)} className="rounded-full border px-7 py-4 font-bold">{dictionary.backHome}</Link></div></main></Shell>;
}

function Shell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <div data-locale={locale} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-white pt-20 text-slate-950">{children}</div>;
}
