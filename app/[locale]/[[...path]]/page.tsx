import type { Metadata } from "next";
import Image from "@/components/media/WatermarkedImage";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { tours as fallbackTours } from "@/data/tours";
import { blogPosts as fallbackBlogPosts } from "@/data/blog-posts";
import { getLiveTours, getLiveBlogPosts } from "@/lib/live-content";
import { dictionaries, isLocale, languageAlternates, localeOg, localePath, locales, type Locale } from "@/lib/i18n";
import {
  defaultSocialImage,
  localizedDefaultDescriptions,
  normalizeMetaDescription,
  normalizeMetaTitle,
  siteName,
  siteUrl,
} from "@/lib/seo";
import { categoryLabels, getTourCategory, tourCategories } from "@/lib/tour-categories";
import HomePage from "@/app/page";
import TransfersPage from "@/app/transfers/page";
import BookingPage from "@/app/booking/page";
import CheckoutPage from "@/app/checkout/page";
import BookingConfirmationPage from "@/app/booking/confirmation/page";
import { AboutPage } from "@/components/pages/AboutPage";
import { ContactPage } from "@/components/pages/ContactPage";
import { FaqPage } from "@/components/pages/FaqPage";
import { PrivacyPolicyPage } from "@/components/pages/PrivacyPolicyPage";
import TermsConditionsPage from "@/app/terms-conditions/page";
import TourPageShell from "@/components/tours/TourPageShell";
import TourCategoryPage from "@/app/hurghada/[category]/page";
import { localizeTour } from "@/lib/tour-localization";
import CartPage from "@/app/cart/page";
import { DestinationPage } from "@/components/pages/destinations/DestinationPage";
import BlogIndexPage from "@/app/blog/page";
import BlogArticlePage from "@/app/blog/[slug]/page";
import { ToursPage } from "@/components/pages/ToursPage";
import { destinations, getDestination, type DestinationSlug } from "@/lib/destinations";
import { destinationCopyByLocale } from "@/lib/destination-i18n";

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

function findPublicTour(liveTours: typeof fallbackTours, slug: string) {
  return liveTours.find((tour) => tour.slug === slug)
    || fallbackTours.find((tour) => tour.slug === slug && tour.listingStatus !== "unlisted");
}

function pageKind(path: string[]) {
  if (!path.length) return "home";
  if (path.length === 1 && path[0] === "tours") return "tours";
  if (path.length === 2 && path[0] === "tours") return "tour";
  if (path.length === 2 && path[0] === "hurghada" && getTourCategory(path[1])) return "category";
  if (path.length === 2 && path[0] === "destinations" && getDestination(path[1])) return "destination";
  if (path.length === 1 && path[0] === "blog") return "blog";
  if (path.length === 2 && path[0] === "blog") return "blog-post";
  return ["booking", "booking/confirmation", "checkout", "cart", "transfers", "privacy-policy", "terms-conditions", "about", "contact", "faq"].includes(path.join("/")) ? path.join("/") : null;
}

export async function generateStaticParams() {
  const paths = [[], ["tours"], ["blog"], ...destinations.map((destination) => ["destinations", destination.slug]), ["booking"], ["booking", "confirmation"], ["checkout"], ["cart"], ["transfers"], ["privacy-policy"], ["terms-conditions"], ["about"], ["contact"], ["faq"], ...tourCategories.map((category) => ["hurghada", category.slug]), ...fallbackTours.filter((tour) => tour.listingStatus !== "unlisted").map((tour) => ["tours", tour.slug]), ...fallbackBlogPosts.map((post) => ["blog", post.slug])];
  return locales.flatMap((locale) => paths.map((path) => ({ locale, path })));
}

export async function generateMetadata({ params }: LocalizedPageProps): Promise<Metadata> {
  const { locale: rawLocale, path = [] } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;
  const dictionary = dictionaries[locale];
  const kind = pageKind(path);
  if (!kind) notFound();
  const tours = await getLiveTours(locale);
  const sourceTour = kind === "tour"
    ? findPublicTour(tours, path[1])
    : undefined;
  const tour = sourceTour ? localizeTour(sourceTour, locale) : undefined;
  if (kind === "tour" && !tour) notFound();
  const blogPost = kind === "blog-post" ? (await getLiveBlogPosts()).find((post) => post.slug === path[1]) : undefined;
  if (kind === "blog-post" && !blogPost) notFound();
  const category = kind === "category" ? getTourCategory(path[1]) : undefined;
  const confirmationTitle = { en: "Booking confirmation", de: "Buchungsbestätigung", ru: "Подтверждение бронирования", ar: "تأكيد الحجز", pl: "Potwierdzenie rezerwacji", zh: "预订确认" }[locale];
  const titles: Record<string, string> = { home: dictionary.heroTitle, tours: dictionary.tours, blog: `${dictionary.tours} · Blog`, destination: `${getDestination(path[1])?.name || "Red Sea"} · ${dictionary.tours}`, booking: dictionary.bookingTitle, "booking/confirmation": confirmationTitle, checkout: dictionary.checkoutTitle, cart: dictionary.bookingTitle, transfers: dictionary.transfersTitle, "privacy-policy": dictionary.privacyTitle, "terms-conditions": dictionary.termsTitle, about: `${dictionary.about} Daily Red Sea`, contact: dictionary.contact, faq: `${dictionary.tours} FAQ` };
  const descriptions: Record<string, string> = { home: dictionary.siteDescription, tours: dictionary.siteDescription, blog: dictionary.siteDescription, destination: dictionary.siteDescription, booking: dictionary.bookingText, "booking/confirmation": dictionary.bookingText, checkout: dictionary.checkoutText, cart: dictionary.checkoutText, transfers: dictionary.transfersText, "privacy-policy": dictionary.privacyText, "terms-conditions": dictionary.termsText, about: dictionary.whyText, contact: dictionary.bookingText, faq: dictionary.siteDescription };
  const destinationCopy = kind === "destination" ? destinationCopyByLocale[path[1] as DestinationSlug]?.[locale] : undefined;
  const title = tour ? tour.seoTitle || tour.title : blogPost ? `${blogPost.title} | ${siteName}` : category ? `${categoryLabels[locale][category.slug]} · Hurghada` : destinationCopy?.title || titles[kind || "home"];
  const germanSeoDescriptions: Record<string, string> = {
    home: "Ausflüge Hurghada direkt beim lokalen Anbieter buchen: Hurghada Bootstour, Quad Tour Hurghada, Orange Bay Hurghada Tickets und Flughafentransfer Hurghada.",
    "orange-bay": "Orange Bay Hurghada Tickets für eine ganztägige Hurghada Bootstour mit Schnorcheln, Mittagessen, Inselaufenthalt und Hoteltransfer buchen.",
    "full-day-snorkeling": "Hurghada Bootstour zu den Korallenriffen mit zwei Schnorchelstopps, Mittagessen, Getränken und Hotelabholung.",
    "quad-safari-morning": "Quad Tour Hurghada am Morgen mit Wüstenfahrt, Bergpanorama, Beduinencamp, Tee und Hotelabholung.",
    "quad-safari-sunset": "Quad Tour Hurghada bei Sonnenuntergang mit Beduinencamp, Wüstenpanorama und Hotelabholung.",
    "hurghada-airport-transfer": "Flughafentransfer Hurghada im Privatfahrzeug zum klaren Festpreis – passend zur Personenzahl und mit Flugüberwachung.",
  };
  const description = tour
    ? locale === "en"
      ? tour.metaDescription || tour.description
      : locale === "de"
        ? germanSeoDescriptions[tour.slug] || tour.description
        : tour.metaDescription || tour.description
    : locale === "de" && kind === "home"
      ? germanSeoDescriptions.home
      : blogPost
        ? blogPost.metaDescription
        : category
          ? `${categoryLabels[locale][category.slug]}. ${dictionary.siteDescription}`
          : destinationCopy?.description || descriptions[kind || "home"];
  const pathname = `/${path.join("/")}`.replace(/\/$/, "");
  const canonical = localePath(locale, pathname);
  const normalizedTitle = normalizeMetaTitle(title, locale);
  const normalizedDescription = normalizeMetaDescription(description, localizedDefaultDescriptions[locale], locale);
  return {
    title: normalizedTitle,
    description: normalizedDescription,
    alternates: { canonical, languages: { ...languageAlternates(pathname), "x-default": localePath("en", pathname) } },
    robots: tour?.listingStatus === "paused"
      ? { index: false, follow: true }
      : kind === "booking" || kind === "booking/confirmation" || kind === "checkout" || kind === "cart"
        ? { index: false, follow: false }
        : { index: true, follow: true },
    openGraph: { title: normalizedTitle, description: normalizedDescription, url: `${siteUrl}${canonical}`, siteName, locale: localeOg[locale], type: "website", images: [{ url: tour?.image || blogPost?.heroImage || (destinationCopy ? getDestination(path[1])?.seo.ogImage : undefined) || defaultSocialImage, alt: tour?.imageAlt || destinationCopy?.imageAlt || normalizedTitle }] },
    twitter: { card: "summary_large_image", title: normalizedTitle, description: normalizedDescription, images: [tour?.image || blogPost?.heroImage || (destinationCopy ? getDestination(path[1])?.seo.ogImage : undefined) || defaultSocialImage] },
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
  const tours = await getLiveTours(locale);
  const direction = locale === "ar" ? "rtl" : "ltr";

  if (kind === "destination") return <DestinationPage locale={locale} params={Promise.resolve({ destination: path[1] })} />;
  if (kind === "tours") return <div dir={direction}><ToursPage locale={locale} /></div>;
  if (kind === "blog") return <div dir={direction}><BlogIndexPage locale={locale} /></div>;
  if (kind === "blog-post") return <div dir={direction}><BlogArticlePage params={Promise.resolve({ slug: path[1] })} locale={locale} /></div>;

  if (locale === "de") {
    if (kind === "home") return <HomePage />;
    if (kind === "tour") {
      const tour = findPublicTour(tours, path[1]);
      if (!tour) notFound();
      return <TourPageShell locale="de" tour={localizeTour(tour, "de")} />;
    }
    if (kind === "category") return <TourCategoryPage locale="de" params={Promise.resolve({ category: path[1] })} />;
    if (kind === "transfers") return <TransfersPage locale="de" />;
    if (kind === "booking") return <BookingPage />;
    if (kind === "booking/confirmation") return <BookingConfirmationPage />;
    if (kind === "checkout") return <CheckoutPage />;
    if (kind === "cart") return <CartPage />;
    if (kind === "about") return <AboutPage locale="de" />;
    if (kind === "contact") return <ContactPage locale="de" />;
    if (kind === "faq") return <FaqPage locale="de" />;
    if (kind === "privacy-policy") return <PrivacyPolicyPage locale="de" />;
    if (kind === "terms-conditions") return <TermsConditionsPage locale="de" />;
  }

  if (locale === "ru") {
    if (kind === "home") return <HomePage />;
    if (kind === "tour") {
      const tour = findPublicTour(tours, path[1]);
      if (!tour) notFound();
      return <TourPageShell locale="ru" tour={localizeTour(tour, "ru")} />;
    }
    if (kind === "category") return <TourCategoryPage locale="ru" params={Promise.resolve({ category: path[1] })} />;
    if (kind === "transfers") return <TransfersPage locale="ru" />;
    if (kind === "booking") return <BookingPage />;
    if (kind === "booking/confirmation") return <BookingConfirmationPage />;
    if (kind === "checkout") return <CheckoutPage />;
    if (kind === "cart") return <CartPage />;
    if (kind === "about") return <AboutPage locale="ru" />;
    if (kind === "contact") return <ContactPage locale="ru" />;
    if (kind === "faq") return <FaqPage locale="ru" />;
    if (kind === "privacy-policy") return <PrivacyPolicyPage locale="ru" />;
    if (kind === "terms-conditions") return <TermsConditionsPage locale="ru" />;
  }

  if (locale === "ar") {
    if (kind === "home") return <HomePage />;
    if (kind === "tour") {
      const tour = findPublicTour(tours, path[1]);
      if (!tour) notFound();
      return <TourPageShell locale="ar" tour={localizeTour(tour, "ar")} />;
    }
    if (kind === "category") return <TourCategoryPage locale="ar" params={Promise.resolve({ category: path[1] })} />;
    if (kind === "transfers") return <TransfersPage locale="ar" />;
    if (kind === "booking") return <BookingPage />;
    if (kind === "booking/confirmation") return <BookingConfirmationPage />;
    if (kind === "checkout") return <CheckoutPage />;
    if (kind === "cart") return <CartPage />;
    if (kind === "about") return <AboutPage locale="ar" />;
    if (kind === "contact") return <ContactPage locale="ar" />;
    if (kind === "faq") return <FaqPage locale="ar" />;
    if (kind === "privacy-policy") return <PrivacyPolicyPage locale="ar" />;
    if (kind === "terms-conditions") return <TermsConditionsPage locale="ar" />;
  }

  if (locale === "pl") {
    if (kind === "home") return <HomePage />;
    if (kind === "tour") {
      const tour = findPublicTour(tours, path[1]);
      if (!tour) notFound();
      return <TourPageShell locale="pl" tour={localizeTour(tour, "pl")} />;
    }
    if (kind === "category") return <TourCategoryPage locale="pl" params={Promise.resolve({ category: path[1] })} />;
    if (kind === "transfers") return <TransfersPage locale="pl" />;
    if (kind === "booking") return <BookingPage />;
    if (kind === "booking/confirmation") return <BookingConfirmationPage />;
    if (kind === "checkout") return <CheckoutPage />;
    if (kind === "cart") return <CartPage />;
    if (kind === "about") return <AboutPage locale="pl" />;
    if (kind === "contact") return <ContactPage locale="pl" />;
    if (kind === "faq") return <FaqPage locale="pl" />;
    if (kind === "privacy-policy") return <PrivacyPolicyPage locale="pl" />;
    if (kind === "terms-conditions") return <TermsConditionsPage locale="pl" />;
  }

  if (locale === "zh") {
    if (kind === "home") return <HomePage />;
    if (kind === "tour") {
      const tour = findPublicTour(tours, path[1]);
      if (!tour) notFound();
      return <TourPageShell locale="zh" tour={localizeTour(tour, "zh")} />;
    }
    if (kind === "category") return <TourCategoryPage locale="zh" params={Promise.resolve({ category: path[1] })} />;
    if (kind === "booking") return <BookingPage />;
    if (kind === "booking/confirmation") return <BookingConfirmationPage />;
    if (kind === "checkout") return <CheckoutPage />;
    if (kind === "cart") return <CartPage />;
    if (kind === "transfers") return <TransfersPage locale="zh" />;
    if (kind === "about") return <AboutPage locale="zh" />;
    if (kind === "contact") return <ContactPage locale="zh" />;
    if (kind === "faq") return <FaqPage locale="zh" />;
    if (kind === "privacy-policy") return <PrivacyPolicyPage locale="zh" />;
    if (kind === "terms-conditions") return <TermsConditionsPage locale="zh" />;
  }

  if (kind === "tour") {
    const tour = tours.find((item) => item.slug === path[1]);
    if (!tour) notFound();
    return <TourPageShell locale={locale} tour={localizeTour(tour, locale)} />;
  }

  if (kind === "booking/confirmation") return <BookingConfirmationPage />;
  if (kind === "cart") return <CartPage />;

  if (kind === "home") return <Shell locale={locale}><main dir={direction}><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto max-w-5xl"><p className="font-bold text-cyan-300">Daily Red Sea · Hurghada</p><h1 className="mt-4 max-w-4xl text-4xl font-black sm:text-6xl">{dictionary.heroTitle}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">{dictionary.heroDescription}</p><Link href={`${localePath(locale)}#tours`} className="mt-8 inline-block rounded-full bg-cyan-500 px-7 py-4 font-bold text-slate-950">{dictionary.bookNow}</Link></div></section><section className="bg-slate-50 px-6 py-16"><div className="mx-auto max-w-7xl"><h2 className="text-3xl font-black">{dictionary.tours}</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tourCategories.map((category) => <Link key={category.slug} href={localePath(locale, `/hurghada/${category.slug}`)} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-400"><h3 className="text-xl font-black">{categoryLabels[locale][category.slug]}</h3><p className="mt-3 leading-7 text-slate-600">{dictionary.siteDescription}</p><span className="mt-5 inline-block font-bold text-blue-700">{dictionary.tours} →</span></Link>)}</div></div></section><section id="tours" className="mx-auto max-w-7xl px-6 py-20"><h2 className="text-3xl font-black">{dictionary.popularTours}</h2><div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{tours.map((tour) => <Link key={tour.slug} href={localePath(locale, `/tours/${tour.slug}`)} className="overflow-hidden rounded-3xl border bg-white shadow-sm"><div className="relative h-48"><Image src={tour.image} alt={localizedTourTitle(locale, tour.slug, tour.title)} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></div><div className="p-6"><p className="text-sm font-semibold text-cyan-700">{tour.duration}</p><h3 className="mt-2 text-xl font-bold">{localizedTourTitle(locale, tour.slug, tour.title)}</h3><p className="mt-4 font-black text-blue-700">{dictionary.from} {tour.originalPrice && Number(tour.originalPrice) > Number(tour.price) ? <span className="mr-2 text-slate-400 line-through">${tour.originalPrice}</span> : null}${tour.price} · {dictionary.perPerson}</p></div></Link>)}</div></section><section className="bg-slate-50 px-6 py-20"><div className="mx-auto max-w-5xl"><h2 className="text-3xl font-black">{dictionary.whyTitle}</h2><p className="mt-5 text-lg text-slate-600">{dictionary.whyText}</p><div className="mt-8 grid gap-4 sm:grid-cols-3">{[dictionary.cash, dictionary.support, dictionary.local].map((item) => <div key={item} className="rounded-2xl bg-white p-5 font-bold">{item}</div>)}</div><div className="mt-8 flex flex-wrap gap-3"><Link href={localePath(locale, "/about")} className="rounded-full border px-6 py-3 font-bold">{dictionary.about}</Link><Link href={localePath(locale, "/contact")} className="rounded-full bg-blue-700 px-6 py-3 font-bold text-white">{dictionary.contact}</Link></div></div></section></main></Shell>;

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
  return <Shell locale={locale}><main dir={direction} className="mx-auto max-w-4xl px-6 py-24"><h1 className="text-4xl font-black">{content[0]}</h1><p className="mt-6 text-lg leading-9 text-slate-600">{content[1]}</p>{legal ? <p className="mt-8 rounded-2xl bg-amber-50 p-5 text-sm text-amber-950">{dictionary.legalNotice}</p> : null}<div className="mt-9 flex flex-wrap gap-4"><a href="https://wa.me/201030809150" className="rounded-full bg-green-600 px-7 py-4 font-bold text-white">{kind === "booking" || kind === "checkout" ? dictionary.bookingCta : dictionary.contact}</a><Link href={localePath(locale)} className="rounded-full border px-7 py-4 font-bold">{dictionary.backHome}</Link></div></main></Shell>;
}

function Shell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <div data-locale={locale} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-white pt-20 text-slate-950">{children}</div>;
}
