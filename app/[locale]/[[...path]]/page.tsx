import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { tours as fallbackTours } from "@/data/tours";
import { blogPosts as fallbackBlogPosts } from "@/data/blog-posts";
import { getLiveTours, getLiveBlogPosts } from "@/lib/live-content";
import { dictionaries, isLocale, languageAlternates, localeOg, localePath, locales } from "@/lib/i18n";
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
import DestinationCategoryPage from "@/components/categories/DestinationCategoryPage";
import { localizeTour } from "@/lib/tour-localization";
import CartPage from "@/app/cart/page";
import { DestinationPage } from "@/components/pages/destinations/DestinationPage";
import { LocalizedBlogIndex } from "@/components/blog/BlogIndexPage";
import { LocalizedBlogArticle } from "@/components/blog/BlogArticlePage";
import { ToursPage } from "@/components/pages/ToursPage";
import { destinations, getDestination, type DestinationSlug } from "@/lib/destinations";
import { destinationCopyByLocale } from "@/lib/destination-i18n";

type LocalizedPageProps = { params: Promise<{ locale: string; path?: string[] }> };

function findPublicTour(liveTours: typeof fallbackTours, slug: string) {
  return liveTours.find((tour) => tour.slug === slug)
    || fallbackTours.find((tour) => tour.slug === slug && tour.listingStatus !== "unlisted");
}

function pageKind(path: string[]) {
  if (!path.length) return "home";
  if (path.length === 1 && path[0] === "tours") return "tours";
  if (path.length === 2 && path[0] === "tours") return "tour";
  if (path.length === 2 && ["hurghada", "marsa-alam", "jeddah"].includes(path[0]) && getTourCategory(path[1])) return "category";
  if (path.length === 2 && path[0] === "destinations" && getDestination(path[1])) return "destination";
  if (path.length === 1 && path[0] === "blog") return "blog";
  if (path.length === 2 && path[0] === "blog") return "blog-post";
  return ["booking", "booking/confirmation", "checkout", "cart", "transfers", "privacy-policy", "terms-conditions", "about", "contact", "faq"].includes(path.join("/")) ? path.join("/") : null;
}

export async function generateStaticParams() {
  const destinationCategoryPaths = destinations.flatMap((destination) => tourCategories.filter((category) => category.slug !== "excursions" && fallbackTours.some((tour) => tour.destinationSlug === destination.slug && category.matches(tour))).map((category) => [destination.slug, category.slug]));
  const paths = [[], ["tours"], ["blog"], ...destinations.map((destination) => ["destinations", destination.slug]), ["booking"], ["booking", "confirmation"], ["checkout"], ["cart"], ["transfers"], ["privacy-policy"], ["terms-conditions"], ["about"], ["contact"], ["faq"], ...tourCategories.map((category) => ["hurghada", category.slug]), ...destinationCategoryPaths, ...fallbackTours.filter((tour) => tour.listingStatus !== "unlisted").map((tour) => ["tours", tour.slug]), ...fallbackBlogPosts.map((post) => ["blog", post.slug])];
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
  const categoryDestination = category ? getDestination(path[0]) : undefined;
  const categoryDestinationName = locale === "ar" && categoryDestination?.slug === "jeddah" ? "جدة" : categoryDestination?.name || "Hurghada";
  const title = tour ? tour.seoTitle || tour.title : blogPost ? `${blogPost.title} | ${siteName}` : category ? `${categoryLabels[locale][category.slug]} · ${categoryDestinationName} | ${siteName}` : destinationCopy?.title || titles[kind || "home"];
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
          ? locale === "ar" && path[0] === "jeddah"
            ? `${categoryLabels.ar[category.slug]} في جدة مع أسعار واضحة بالريال السعودي ومواعيد وتفاصيل تجمع ودعم مباشر للحجز.`
            : `Compare ${categoryLabels[locale][category.slug]} in ${categoryDestinationName} with clear prices, schedules, meeting details and local booking support.`
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
  const kind = pageKind(path);
  if (!kind) notFound();
  const tours = await getLiveTours(locale);
  const direction = locale === "ar" ? "rtl" : "ltr";

  if (kind === "destination") return <DestinationPage locale={locale} params={Promise.resolve({ destination: path[1] })} />;
  if (kind === "category" && path[0] !== "hurghada") return <DestinationCategoryPage locale={locale} destinationSlug={path[0]} categorySlug={path[1]} />;
  if (kind === "tours") return <div dir={direction}><ToursPage locale={locale} /></div>;
  if (kind === "blog") return <div dir={direction}><LocalizedBlogIndex locale={locale} /></div>;
  if (kind === "blog-post") return <div dir={direction}><LocalizedBlogArticle params={Promise.resolve({ slug: path[1] })} locale={locale} /></div>;

  // Every non-English locale renders the same component per page kind; only the
  // `locale` prop differs. Keep this dispatch data-free so a new page type is
  // added once, not once per language.
  if (kind === "home") return <HomePage />;

  if (kind === "tour") {
    const tour = findPublicTour(tours, path[1]);
    if (!tour) notFound();
    return <TourPageShell locale={locale} tour={localizeTour(tour, locale)} />;
  }

  if (kind === "category") return <TourCategoryPage locale={locale} params={Promise.resolve({ category: path[1] })} />;
  if (kind === "transfers") return <TransfersPage locale={locale} />;
  if (kind === "booking") return <BookingPage />;
  if (kind === "booking/confirmation") return <BookingConfirmationPage />;
  if (kind === "checkout") return <CheckoutPage />;
  if (kind === "cart") return <CartPage />;
  if (kind === "about") return <AboutPage locale={locale} />;
  if (kind === "contact") return <ContactPage locale={locale} />;
  if (kind === "faq") return <FaqPage locale={locale} />;
  if (kind === "privacy-policy") return <PrivacyPolicyPage locale={locale} />;
  if (kind === "terms-conditions") return <TermsConditionsPage locale={locale} />;

  notFound();
}
