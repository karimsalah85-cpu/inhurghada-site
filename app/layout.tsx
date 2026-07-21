import type { Metadata } from "next";
import "./globals.css";

import WhatsAppButton from "@/components/layout/WhatsAppButton";
import Navbar from "@/components/layout/Navbar";
import { SiteSettingsProvider } from "@/components/settings/SiteSettingsContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://dailyredsea.com"),
  title: {
    default: "Daily Red Sea | Hurghada Tours, Transfers & Boat Trips",
    template: "%s | Daily Red Sea",
  },
  description:
    "Book private Hurghada tours, diving trips, transfers, Orange Bay cruises and desert adventures with trusted local support.",
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
  openGraph: {
    title: "Daily Red Sea | Hurghada Tours, Transfers & Boat Trips",
    description:
      "Book private Hurghada tours, diving trips, transfers, Orange Bay cruises and desert adventures with trusted local support.",
    url: "https://dailyredsea.com",
    siteName: "Daily Red Sea",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Daily Red Sea tours and transfers in Hurghada",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Red Sea | Hurghada Tours, Transfers & Boat Trips",
    description:
      "Book private Hurghada tours, diving trips, transfers, Orange Bay cruises and desert adventures with trusted local support.",
    images: ["/og-image.svg"],
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
          <Navbar />
          {children}
          <WhatsAppButton />
        </SiteSettingsProvider>
      </body>


    </html>

  );

}
