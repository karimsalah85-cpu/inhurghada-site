import type { Metadata } from "next";
import { getImageProps } from "next/image";
import { Manrope, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";

// The homepage hero is the mobile LCP element and uses a manual <picture> for
// art direction, so getImageProps/priority can't auto-preload it. Emit the
// preload here, in the server-rendered <head>, scoped to the mobile source.
const { props: heroMobile } = getImageProps({
  alt: "",
  src: "/images/hero-egypt-red-sea-mobile.jpg",
  width: 941,
  height: 1672,
  quality: 62,
  sizes: "100vw",
});

import { SiteSettingsProvider } from "@/components/settings/SiteSettingsContext";
import OrganizationSchema from "@/components/seo/OrganizationSchema";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import { defaultDescription, defaultSocialImage, siteName, siteUrl } from "@/lib/seo";
import { languageAlternates, localePath } from "@/lib/i18n";
import CartProvider from "@/components/cart/CartProvider";
import FavouritesProvider from "@/components/favourites/FavouritesProvider";
import PublicSiteChrome from "@/components/layout/PublicSiteChrome";
import { publicInterfaceCopy } from "@/lib/public-interface-i18n";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-kufi-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Daily Red Sea | Red Sea Tours & Experiences",
  description: defaultDescription,
  keywords: [
    "Red Sea tours",
    "Jeddah tours",
    "Marsa Alam tours",
    "Orange Bay",
    "boat trips Hurghada",
    "private transfers",
    "desert safari",
    "Red Sea excursions",
  ],
  alternates: {
    canonical: "/",
    languages: { ...languageAlternates(), "x-default": localePath("en") },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    title: "Daily Red Sea | Red Sea Tours & Experiences",
    description: defaultDescription,
    url: siteUrl,
    siteName,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: defaultSocialImage,
        width: 1200,
        height: 630,
        alt: "Daily Red Sea tours in Hurghada, Marsa Alam and Jeddah",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Red Sea | Red Sea Tours & Experiences",
    description: defaultDescription,
    images: [defaultSocialImage],
  },
  // Icons are declared here explicitly and served from /public with stable,
  // query-string-free URLs. `/favicon.ico` is NOT an app/ file convention (that
  // appends a per-content ?hash); it is a plain public/ asset. The high-res
  // /icon-192.png is what Google prefers for the search-result favicon.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};



// No `headers()` / `cookies()` here on purpose: reading a request header would opt
// every page into dynamic SSR (Cache-Control: no-store, no CDN cache, no bf-cache).
// The document starts as en/ltr; the inline script below and SiteSettingsProvider
// (which reads the pathname on the client) set lang/dir before first paint for the
// localized routes.
const localeDirScript = `(function(){try{var s=location.pathname.split('/')[1];var rtl=s==='ar';var l=['ar','de','ru','pl','zh'].indexOf(s)>-1?s:'en';var e=document.documentElement;e.lang=l;e.dir=rtl?'rtl':'ltr';}catch(_){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    <html
      lang="en"
      dir="ltr"
      className={`h-full antialiased ${manrope.variable} ${notoKufiArabic.variable}`}
    >

      <head>
        <script dangerouslySetInnerHTML={{ __html: localeDirScript }} />
        <link
          rel="preload"
          as="image"
          fetchPriority="high"
          media="(max-width: 639px)"
          imageSrcSet={heroMobile.srcSet}
          imageSizes="100vw"
        />
      </head>

      <body>
        <SiteSettingsProvider>
          <CartProvider>
            <FavouritesProvider>
              <OrganizationSchema />
              <AnalyticsProvider />
              <PublicSiteChrome />
              <a href="#main-content" className="skip-link">{publicInterfaceCopy.en.skip}</a>
              <div id="main-content" tabIndex={-1}>{children}</div>
            </FavouritesProvider>
          </CartProvider>
        </SiteSettingsProvider>
      </body>


    </html>

  );

}
