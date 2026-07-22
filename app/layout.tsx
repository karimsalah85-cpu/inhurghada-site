import type { Metadata } from "next";
import "./globals.css";

import WhatsAppButton from "@/components/layout/WhatsAppButton";
import Navbar from "@/components/layout/Navbar";
import { SiteSettingsProvider } from "@/components/settings/SiteSettingsContext";
import OrganizationSchema from "@/components/seo/OrganizationSchema";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import { defaultDescription, defaultSocialImage, siteName, siteUrl } from "@/lib/seo";

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



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (

    <html
      lang="en"
      className="h-full antialiased"
    >

      <body>
        <SiteSettingsProvider>
          <OrganizationSchema />
          <AnalyticsProvider />
          <Navbar />
          {children}
          <WhatsAppButton />
        </SiteSettingsProvider>
      </body>


    </html>

  );

}
