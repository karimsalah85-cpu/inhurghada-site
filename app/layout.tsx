import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

import WhatsAppButton from "@/components/layout/WhatsAppButton";
import Navbar from "@/components/layout/Navbar";
import { SiteSettingsProvider } from "@/components/settings/SiteSettingsContext";
import OrganizationSchema from "@/components/seo/OrganizationSchema";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import { defaultDescription, defaultSocialImage, siteName, siteUrl } from "@/lib/seo";
import { languageAlternates, localePath } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Daily Red Sea | Hurghada Tours, Transfers & Boat Trips",
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    "Hurghada tours",
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
    title: "Daily Red Sea | Hurghada Tours, Transfers & Boat Trips",
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
        alt: "Daily Red Sea tours and transfers in Hurghada",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Red Sea | Hurghada Tours, Transfers & Boat Trips",
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
      className="h-full antialiased"
    >

      <body>
        <SiteSettingsProvider>
          <OrganizationSchema />
          <AnalyticsProvider />
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <Navbar />
          <div id="main-content" tabIndex={-1}>{children}</div>
          <WhatsAppButton />
        </SiteSettingsProvider>
      </body>


    </html>

  );

}
