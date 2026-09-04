"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Calendar, ChevronDown, MapPin, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { getImageProps } from "next/image";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import ImageWatermark from "@/components/media/ImageWatermark";
import { localePath } from "@/lib/i18n";

const heroImageCommon = {
  alt: "Red Sea experiences including desert, ancient Egyptian temples, boat trips, and scuba diving",
  sizes: "100vw",
};

const { props: { srcSet: desktopHeroSrcSet } } = getImageProps({
  ...heroImageCommon,
  src: "/images/hero-egypt-red-sea.jpg",
  width: 1672,
  height: 941,
  quality: 78,
});

const { props: { srcSet: mobileHeroSrcSet, ...mobileHeroProps } } = getImageProps({
  ...heroImageCommon,
  src: "/images/hero-egypt-red-sea-mobile.jpg",
  width: 941,
  height: 1672,
  quality: 78,
});

export default function Hero() {
  const router = useRouter();
  const { t, language } = useSiteSettings();
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("1");
  const [greetingKey, setGreetingKey] = useState<"goodMorning" | "goodAfternoon" | "goodEvening" | null>(null);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      setGreetingKey(hour < 12 ? "goodMorning" : hour < 18 ? "goodAfternoon" : "goodEvening");
    };
    updateGreeting();
    const intervalId = window.setInterval(updateGreeting, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  function searchTours() {
    const selectedDestination = destination.toLowerCase().trim();
    if (!selectedDestination) {
      alert(t("destination"));
      return;
    }

    const params = new URLSearchParams({ destination: selectedDestination });
    if (date) params.set("date", date);
    if (guests) params.set("guests", guests);
    router.push(`${localePath(language, "/tours")}?${params.toString()}`);
  }

  const planner = (
    <div className="grid gap-2.5 md:grid-cols-[1.25fr_1fr_.7fr_auto] md:items-stretch">
      <PlannerField icon={MapPin} label={t("destination")}>
        <select value={destination} onChange={(event) => setDestination(event.target.value)} aria-label={t("destination")} className="w-full bg-transparent text-sm font-semibold text-ink outline-none">
          <option value="">{t("searchPlaceholder")}</option>
          <option value="hurghada">Hurghada</option>
          <option value="marsa-alam">Marsa Alam</option>
          <option value="jeddah">Jeddah</option>
        </select>
      </PlannerField>
      <PlannerField icon={Calendar} label={t("travelDate")}>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-ink outline-none" />
      </PlannerField>
      <PlannerField icon={Users} label={t("guests")}>
        <input type="number" min="1" value={guests} onChange={(event) => setGuests(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-ink outline-none" />
      </PlannerField>
      <button type="button" onClick={searchTours} className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cta to-cta-dark px-6 font-bold text-white shadow-lg shadow-cta-dark/20 transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:ring-4 focus-visible:ring-cta-soft">
        {t("searchTours")} <ArrowRight size={19} />
      </button>
    </div>
  );

  return (
    <section className="relative min-h-[720px] overflow-hidden sm:min-h-[700px]">
      <picture className="absolute inset-0 block">
        <source media="(min-width: 640px)" srcSet={desktopHeroSrcSet} />
        <source media="(max-width: 639px)" srcSet={mobileHeroSrcSet} />
        <img {...mobileHeroProps} alt={heroImageCommon.alt} fetchPriority="high" className="h-full w-full object-cover" />
      </picture>
      <ImageWatermark prominent />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/65 to-ink/10 sm:via-ink/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-ink/20" />

      <div className="relative z-10 mx-auto flex min-h-[720px] max-w-7xl items-center px-5 pb-24 pt-32 sm:min-h-[700px] sm:px-8 sm:pb-28 sm:pt-36">
        <div className="w-full max-w-5xl text-white">
          <p className={`mb-4 text-sm font-bold transition-opacity sm:text-base ${greetingKey ? "opacity-100" : "opacity-0"}`} aria-live="polite">
            {greetingKey ? `${t(greetingKey)} 👋` : "\u00a0"}
          </p>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-ocean-soft sm:text-sm">{t("discoverHurghada")}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">{t("heroTitle")}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-surface-muted sm:text-lg sm:leading-8">{t("heroDescription")}</p>

          <div className="mt-8 hidden rounded-[1.75rem] border border-white/25 bg-white/95 p-3 shadow-[0_25px_80px_-20px_rgba(2,6,23,0.65)] backdrop-blur md:block">
            {planner}
          </div>

          <details className="group mt-8 rounded-3xl border border-white/25 bg-white/95 p-3 text-ink shadow-2xl backdrop-blur md:hidden" open>
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl px-3 py-2 font-black">
              <span>{language === "ar" ? "خطط لرحلتك" : language === "de" ? "Reise planen" : language === "ru" ? "Спланировать поездку" : language === "pl" ? "Zaplanuj podróż" : language === "zh" ? "规划行程" : "Plan your day"}</span>
              <ChevronDown className="transition group-open:rotate-180" size={20} />
            </summary>
            <div className="mt-2">{planner}</div>
          </details>
        </div>
      </div>
    </section>
  );
}

function PlannerField({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface-muted px-4 transition focus-within:border-ocean focus-within:bg-white">
      <Icon className="shrink-0 text-ocean-dark" size={20} />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{label}</span>
        <span className="mt-1 block">{children}</span>
      </span>
    </label>
  );
}
