"use client";

import MobileTourCarousel from "@/components/home/MobileTourCarousel";
import TourCard from "@/components/cards/TourCard";
import { useFavourites } from "@/components/favourites/FavouritesProvider";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { localePath } from "@/lib/i18n";

const copyByLocale = {
  en: { eyebrow: "Saved on this device", title: "Continue planning your trip", open: "Review saved trips", clear: "Clear" },
  ar: { eyebrow: "محفوظة على هذا الجهاز", title: "تابع التخطيط لرحلتك", open: "مراجعة الرحلات المحفوظة", clear: "مسح" },
  de: { eyebrow: "Auf diesem Gerät gespeichert", title: "Plane deine Reise weiter", open: "Gespeicherte Trips ansehen", clear: "Löschen" },
  ru: { eyebrow: "Сохранено на этом устройстве", title: "Продолжите планировать поездку", open: "Посмотреть сохранённые поездки", clear: "Очистить" },
  pl: { eyebrow: "Zapisane na tym urządzeniu", title: "Kontynuuj planowanie podróży", open: "Przejrzyj zapisane wycieczki", clear: "Wyczyść" },
  zh: { eyebrow: "已保存到此设备", title: "继续规划你的行程", open: "查看收藏的行程", clear: "清除" },
} as const;

export default function ContinuePlanningRail() {
  const { items, openPanel, clear } = useFavourites();
  const { language } = useSiteSettings();
  const copy = copyByLocale[language];

  // Only trips saved with the full card snapshot can render here; older saves
  // still work in the panel and rejoin the rail once reopened.
  const renderable = items.filter((item) => item.title && item.image && item.duration && item.rating);
  if (renderable.length === 0) return null;

  return (
    <section aria-labelledby="continue-planning-title" className="bg-white pt-16 sm:pt-20">
      <div className="mx-auto max-w-7xl px-8">
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-brand-orange-cta">{copy.eyebrow}</p>
            <h2 id="continue-planning-title" className="mt-2 text-3xl font-black text-ink sm:text-4xl">{copy.title}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={openPanel} className="font-bold text-ocean-dark hover:text-primary">{copy.open} →</button>
            <button type="button" onClick={clear} className="text-sm font-semibold text-muted hover:text-ink">{copy.clear}</button>
          </div>
        </div>
        <MobileTourCarousel label={copy.title}>
          {renderable.map((item) => (
            <TourCard
              key={item.slug}
              image={item.image}
              title={item.title}
              rating={item.rating ?? "0"}
              price={item.price}
              originalPrice={item.originalPrice}
              link={localePath(language, `/tours/${item.slug}`)}
              location={item.location}
              duration={item.duration ?? ""}
              description={item.description ?? ""}
              badge={item.badge}
              reviews={item.reviews}
              category={item.category}
              availableTime={item.availableTime}
              priceUnit={item.priceUnit}
              bookingMode={item.bookingMode}
              entrancePrice={item.entrancePrice}
              currency={item.currency}
              tourSlug={item.slug}
              destination={item.destination}
            />
          ))}
        </MobileTourCarousel>
      </div>
    </section>
  );
}
