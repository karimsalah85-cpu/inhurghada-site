import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tours } from "@/data/tours";
import { dictionaries, isLocale, languageAlternates, localeOg, localePath, locales, type Locale } from "@/lib/i18n";
import { defaultSocialImage, siteName, siteUrl } from "@/lib/seo";

type LocalizedPageProps = { params: Promise<{ locale: string; path?: string[] }> };

const tourTitles: Partial<Record<Locale, Record<string, string>>> = {
  ar: {
    "orange-bay": "رحلة أورانج باي البحرية والسنوركلينج", safari: "مغامرة سفاري الصحراء", "professional-underwater-photographer": "مصور محترف تحت الماء", "mahmya-island": "رحلة جزيرة المحمية", "full-day-snorkeling": "رحلة سنوركلينج ليوم كامل", "full-day-diving": "رحلة غوص ليوم كامل", "quad-safari-morning": "سفاري كواد صباحي", "quad-safari-sunset": "سفاري كواد وقت الغروب", "hurghada-airport-transfer": "توصيل خاص من مطار الغردقة", "senzo-transfer": "توصيل خاص من وإلى سنزو مول",
  },
  de: {
    "orange-bay": "Orange Bay Bootstour mit Schnorcheln", safari: "Wüstensafari-Abenteuer", "professional-underwater-photographer": "Professioneller Unterwasserfotograf", "mahmya-island": "Mahmya Island Bootstour", "full-day-snorkeling": "Ganztägige Schnorcheltour", "full-day-diving": "Ganztägige Tauchtour", "quad-safari-morning": "Quad-Safari am Morgen", "quad-safari-sunset": "Quad-Safari bei Sonnenuntergang", "hurghada-airport-transfer": "Privater Flughafentransfer Hurghada", "senzo-transfer": "Privater Transfer zur Senzo Mall",
  },
  ru: {
    "orange-bay": "Морская прогулка на Orange Bay со сноркелингом", safari: "Сафари в пустыне", "professional-underwater-photographer": "Профессиональный подводный фотограф", "mahmya-island": "Морская прогулка на остров Махмея", "full-day-snorkeling": "Сноркелинг на весь день", "full-day-diving": "Дайвинг на весь день", "quad-safari-morning": "Утреннее сафари на квадроциклах", "quad-safari-sunset": "Сафари на квадроциклах на закате", "hurghada-airport-transfer": "Частный трансфер из аэропорта Хургады", "senzo-transfer": "Частный трансфер в Senzo Mall",
  },
  pl: {
    "orange-bay": "Rejs na Orange Bay ze snorkelingiem", safari: "Pustynne safari", "professional-underwater-photographer": "Profesjonalny fotograf podwodny", "mahmya-island": "Rejs na wyspę Mahmya", "full-day-snorkeling": "Całodniowy snorkeling", "full-day-diving": "Całodniowe nurkowanie", "quad-safari-morning": "Poranne safari na quadach", "quad-safari-sunset": "Safari na quadach o zachodzie słońca", "hurghada-airport-transfer": "Prywatny transfer z lotniska w Hurghadzie", "senzo-transfer": "Prywatny transfer do Senzo Mall",
  },
  zh: {
    "orange-bay": "橙湾浮潜游船之旅", safari: "沙漠探险", "professional-underwater-photographer": "专业水下摄影师", "mahmya-island": "马赫米亚岛游船之旅", "full-day-snorkeling": "全天浮潜之旅", "full-day-diving": "全天深潜之旅", "quad-safari-morning": "清晨四轮摩托沙漠探险", "quad-safari-sunset": "日落四轮摩托沙漠探险", "hurghada-airport-transfer": "赫尔格达机场私人接送", "senzo-transfer": "Senzo Mall 私人接送",
  },
};

function localizedTourTitle(locale: Locale, slug: string, fallback: string) {
  return tourTitles[locale]?.[slug] || fallback;
}

function pageKind(path: string[]) {
  if (!path.length) return "home";
  if (path.length === 2 && path[0] === "tours") return "tour";
  return ["booking", "checkout", "transfers", "privacy-policy", "terms-conditions"].includes(path.join("/")) ? path.join("/") : null;
}

export async function generateStaticParams() {
  const paths = [[], ["booking"], ["checkout"], ["transfers"], ["privacy-policy"], ["terms-conditions"], ...tours.map((tour) => ["tours", tour.slug])];
  return locales.flatMap((locale) => paths.map((path) => ({ locale, path })));
}

export async function generateMetadata({ params }: LocalizedPageProps): Promise<Metadata> {
  const { locale: rawLocale, path = [] } = await params;
  if (!isLocale(rawLocale)) return {};
  const locale = rawLocale;
  const dictionary = dictionaries[locale];
  const kind = pageKind(path);
  const tour = kind === "tour" ? tours.find((item) => item.slug === path[1]) : undefined;
  const titles: Record<string, string> = { home: dictionary.heroTitle, booking: dictionary.bookingTitle, checkout: dictionary.checkoutTitle, transfers: dictionary.transfersTitle, "privacy-policy": dictionary.privacyTitle, "terms-conditions": dictionary.termsTitle };
  const descriptions: Record<string, string> = { home: dictionary.siteDescription, booking: dictionary.bookingText, checkout: dictionary.checkoutText, transfers: dictionary.transfersText, "privacy-policy": dictionary.privacyText, "terms-conditions": dictionary.termsText };
  const title = tour ? localizedTourTitle(locale, tour.slug, tour.title) : titles[kind || "home"];
  const description = tour ? `${title}. ${dictionary.siteDescription}` : descriptions[kind || "home"];
  const pathname = `/${path.join("/")}`.replace(/\/$/, "");
  const canonical = localePath(locale, pathname);
  return {
    title,
    description,
    alternates: { canonical, languages: { ...languageAlternates(pathname), "x-default": localePath("en", pathname) } },
    openGraph: { title, description, url: `${siteUrl}${canonical}`, siteName, locale: localeOg[locale], type: "website", images: [defaultSocialImage] },
  };
}

export default async function LocalizedPage({ params }: LocalizedPageProps) {
  const { locale: rawLocale, path = [] } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;
  const dictionary = dictionaries[locale];
  const kind = pageKind(path);
  if (!kind) notFound();
  const direction = locale === "ar" ? "rtl" : "ltr";

  if (kind === "tour") {
    const tour = tours.find((item) => item.slug === path[1]);
    if (!tour) notFound();
    const title = localizedTourTitle(locale, tour.slug, tour.title);
    return <Shell locale={locale}><article dir={direction} className="mx-auto max-w-4xl px-6 py-20"><p className="font-semibold text-cyan-700">{dictionary.tours}</p><h1 className="mt-3 text-4xl font-black">{title}</h1><p className="mt-6 text-lg leading-8 text-slate-600">{dictionary.siteDescription}</p><div className="mt-8 rounded-3xl bg-slate-50 p-6"><p className="text-sm text-slate-500">{dictionary.from}</p><p className="text-3xl font-black text-blue-700">${tour.price} <span className="text-base font-medium">{dictionary.perPerson}</span></p><p className="mt-4 text-slate-600">{tour.duration} · {tour.location}</p></div><Link href={localePath(locale, "/booking")} className="mt-8 inline-block rounded-full bg-blue-700 px-7 py-4 font-bold text-white">{dictionary.bookNow}</Link></article></Shell>;
  }

  if (kind === "home") return <Shell locale={locale}><main dir={direction}><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto max-w-5xl"><p className="font-bold text-cyan-300">Daily Red Sea · Hurghada</p><h1 className="mt-4 max-w-4xl text-4xl font-black sm:text-6xl">{dictionary.heroTitle}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">{dictionary.heroDescription}</p><Link href={localePath(locale, "/booking")} className="mt-8 inline-block rounded-full bg-cyan-500 px-7 py-4 font-bold text-slate-950">{dictionary.bookNow}</Link></div></section><section id="tours" className="mx-auto max-w-7xl px-6 py-20"><h2 className="text-3xl font-black">{dictionary.popularTours}</h2><div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{tours.map((tour) => <Link key={tour.slug} href={localePath(locale, `/tours/${tour.slug}`)} className="rounded-3xl border bg-white p-6 shadow-sm"><h3 className="text-xl font-bold">{localizedTourTitle(locale, tour.slug, tour.title)}</h3><p className="mt-4 font-black text-blue-700">{dictionary.from} ${tour.price} · {dictionary.perPerson}</p></Link>)}</div></section><section className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-5xl"><h2 className="text-3xl font-black">{dictionary.whyTitle}</h2><p className="mt-5 text-lg text-slate-600">{dictionary.whyText}</p><div className="mt-8 grid gap-4 sm:grid-cols-3">{[dictionary.cash, dictionary.support, dictionary.local].map((item) => <div key={item} className="rounded-2xl bg-white p-5 font-bold">{item}</div>)}</div></div></section></main></Shell>;

  const content = kind === "booking" ? [dictionary.bookingTitle, dictionary.bookingText] : kind === "checkout" ? [dictionary.checkoutTitle, dictionary.checkoutText] : kind === "transfers" ? [dictionary.transfersTitle, dictionary.transfersText] : kind === "privacy-policy" ? [dictionary.privacyTitle, dictionary.privacyText] : [dictionary.termsTitle, dictionary.termsText];
  const legal = kind === "privacy-policy" || kind === "terms-conditions";
  return <Shell locale={locale}><main dir={direction} className="mx-auto max-w-4xl px-6 py-24"><h1 className="text-4xl font-black">{content[0]}</h1><p className="mt-6 text-lg leading-9 text-slate-600">{content[1]}</p>{legal ? <p className="mt-8 rounded-2xl bg-amber-50 p-5 text-sm text-amber-950">{dictionary.legalNotice}</p> : null}<div className="mt-9 flex flex-wrap gap-4"><a href="https://wa.me/201004933150" className="rounded-full bg-green-600 px-7 py-4 font-bold text-white">{kind === "booking" || kind === "checkout" ? dictionary.bookingCta : dictionary.contact}</a><Link href={localePath(locale)} className="rounded-full border px-7 py-4 font-bold">{dictionary.backHome}</Link></div></main></Shell>;
}

function Shell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <div data-locale={locale} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-white pt-20 text-slate-950">{children}</div>;
}
