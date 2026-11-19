import type { Metadata } from "next";
import FairPriceIndex, { fairPricesPath } from "@/components/fair-prices/FairPriceIndex";
import { fairPriceCopy } from "@/lib/fair-prices-i18n";
import { languageAlternates } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

// Refresh hourly so live tour prices and the 1 January 2027 visa change appear without a redeploy.
export const revalidate = 3600;

const base = pageMetadata({ title: fairPriceCopy.en.metaTitle, description: fairPriceCopy.en.metaDescription, path: fairPricesPath });

export const metadata: Metadata = {
  ...base,
  alternates: { canonical: fairPricesPath, languages: { ...languageAlternates(fairPricesPath), "x-default": fairPricesPath } },
};

export default function FairPriceIndexPage() {
  return <FairPriceIndex locale="en" />;
}
