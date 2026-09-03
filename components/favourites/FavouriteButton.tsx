"use client";

import { Heart } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { useFavourites, type FavouriteItem } from "@/components/favourites/FavouritesProvider";

const labels = {
  en: { add: "Save this trip", remove: "Remove from saved trips" },
  ar: { add: "احفظ هذه الرحلة", remove: "إزالة من الرحلات المحفوظة" },
  de: { add: "Trip speichern", remove: "Aus gespeicherten Trips entfernen" },
  ru: { add: "Сохранить поездку", remove: "Удалить из сохранённых поездок" },
  pl: { add: "Zapisz wycieczkę", remove: "Usuń z zapisanych wycieczek" },
  zh: { add: "收藏此行程", remove: "从收藏中移除" },
} as const;

export default function FavouriteButton({ item, compact = false }: { item: FavouriteItem; compact?: boolean }) {
  const { language } = useSiteSettings();
  const { isFavourite, toggle } = useFavourites();
  const saved = isFavourite(item.slug);
  const copy = labels[language];
  const label = saved ? copy.remove : copy.add;

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(item);
      }}
      className={`${compact ? "p-3" : "gap-2 px-4 py-3"} inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white font-bold shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 ${saved ? "text-brand-orange-cta" : "text-slate-800"}`}
    >
      <Heart size={18} className={saved ? "fill-current" : ""} />
      {compact ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </button>
  );
}
