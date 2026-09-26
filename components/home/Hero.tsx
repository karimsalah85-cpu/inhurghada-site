"use client";

import { getImageProps } from "next/image";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import HeroSearch from "@/components/home/HeroSearch";
import type { Tour } from "@/data/tours";

const heroImageCommon = {
  alt: "Red Sea experiences including desert, ancient Egyptian temples, boat trips, and scuba diving",
  sizes: "100vw",
};

const { props: { srcSet: desktopHeroSrcSet } } = getImageProps({
  ...heroImageCommon,
  src: "/images/hero-egypt-red-sea.jpg",
  width: 1672,
  height: 941,
  quality: 62,
  priority: true,
});

// `priority` drops loading="lazy" and sets fetchpriority="high" — the hero is
// the LCP element, so it must start downloading immediately, not after layout.
const { props: { srcSet: mobileHeroSrcSet, ...mobileHeroProps } } = getImageProps({
  ...heroImageCommon,
  src: "/images/hero-egypt-red-sea-mobile.jpg",
  width: 941,
  height: 1672,
  quality: 62,
  priority: true,
});

export default function Hero({ tours }: { tours: Tour[] }) {
  const { t } = useSiteSettings();

  return (
    <section className="relative">
      {/* React 19 hoists these to <head> so the LCP hero is discovered before the CSS/JS parse finishes. */}
      <link rel="preload" as="image" imageSrcSet={mobileHeroSrcSet} imageSizes="100vw" media="(max-width: 639px)" fetchPriority="high" />
      <link rel="preload" as="image" imageSrcSet={desktopHeroSrcSet} imageSizes="100vw" media="(min-width: 640px)" fetchPriority="high" />
      <div className="absolute inset-0 overflow-hidden">
        <picture className="absolute inset-0 block">
          <source media="(min-width: 640px)" srcSet={desktopHeroSrcSet} />
          <source media="(max-width: 639px)" srcSet={mobileHeroSrcSet} />
          <img {...mobileHeroProps} alt={heroImageCommon.alt} fetchPriority="high" loading="eager" className="h-full w-full object-cover" />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/65 to-ink/10 sm:via-ink/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-ink/20" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl items-start px-5 pb-8 pt-20 sm:px-8 sm:pb-14 sm:pt-32">
        <div className="w-full max-w-4xl text-white">
          <h1 className="max-w-4xl text-[1.75rem] font-black leading-[1.08] tracking-tight [text-wrap:balance] sm:text-5xl sm:leading-[1.04] lg:text-6xl">{t("heroTitle")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-surface-muted sm:mt-4 sm:text-lg sm:leading-8">{t("heroDescription")}</p>
          <HeroSearch tours={tours} className="mt-5 max-w-3xl sm:mt-8" />
        </div>
      </div>
    </section>
  );
}

