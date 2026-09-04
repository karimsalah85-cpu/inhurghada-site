import type { Metadata } from "next";
import { headers } from "next/headers";
import { Manrope, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";

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
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  const requestedLocale = (await headers()).get("x-daily-red-sea-locale") || "en";
  const documentLocale = ["en", "ar", "de", "ru", "pl", "zh"].includes(requestedLocale) ? requestedLocale : "en";

  return (

    <html
      lang={documentLocale}
      dir={documentLocale === "ar" ? "rtl" : "ltr"}
      className={`h-full antialiased ${manrope.variable} ${notoKufiArabic.variable}`}
    >

      <body>
        <SiteSettingsProvider initialLanguage={documentLocale as "en" | "ar" | "de" | "ru" | "pl" | "zh"}>
          <CartProvider>
            <FavouritesProvider>
              <OrganizationSchema />
              <AnalyticsProvider />
              <PublicSiteChrome />
              <a href="#main-content" className="skip-link">{publicInterfaceCopy[documentLocale as keyof typeof publicInterfaceCopy].skip}</a>
              <div id="main-content" tabIndex={-1}>{children}</div>
            </FavouritesProvider>
          </CartProvider>
        </SiteSettingsProvider>
      </body>


    </html>

  );

}
