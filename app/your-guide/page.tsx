import type { Metadata } from "next";
import { FreeGuideHub } from "@/components/pages/FreeGuides";
import { freeGuideUi } from "@/lib/free-guide-ui";
import { languageAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: `${freeGuideUi.en.metaTitle} | DailyRedSea`,
  description: freeGuideUi.en.metaDescription,
  alternates: { canonical: "/your-guide", languages: { ...languageAlternates("/your-guide"), "x-default": "/your-guide" } },
};
export default function YourGuideHubPage() {
  return <FreeGuideHub locale="en" />;
}
