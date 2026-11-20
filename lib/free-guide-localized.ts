import type { Locale } from "@/lib/i18n";
import { getFreeGuide, type FreeGuide } from "@/lib/free-guides";
import { eastGuideTranslations, type GuideTranslation } from "@/lib/free-guide-translations-east";
import { germanRussianGuideTranslations } from "@/lib/free-guide-translations-de-ru";
import { polishItalianGuideTranslations } from "@/lib/free-guide-translations-pl-it";

const translated: Partial<Record<Locale, Record<string, GuideTranslation>>> = {
  ...eastGuideTranslations,
  ...germanRussianGuideTranslations,
  ...polishItalianGuideTranslations,
};

export function getLocalizedFreeGuide(slug: string, locale: Locale): FreeGuide | undefined {
  const guide = getFreeGuide(slug);
  if (!guide) return undefined;
  if (locale === "en") return guide;
  const copy = translated[locale]?.[slug];
  if (!copy || copy.places.length !== guide.freePlaces.length || copy.essentials.length !== guide.essentials.length || copy.dayPlan.length !== guide.dayPlan.length) {
    // Never display partially translated guide content.
    return undefined;
  }
  return {
    ...guide,
    areaHint: copy.areaHint,
    essentials: copy.essentials,
    dayPlan: copy.dayPlan,
    freePlaces: guide.freePlaces.map((place, i) => ({
      ...place,
      title: copy.places[i][0],
      detail: copy.places[i][1],
      note: copy.places[i][2],
    })),
  };
}
