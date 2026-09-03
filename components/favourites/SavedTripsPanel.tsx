"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import { useFavourites } from "@/components/favourites/FavouritesProvider";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { localePath } from "@/lib/i18n";

const copyByLocale = {
  en: { title: "Saved trips", device: "Saved on this device", empty: "No saved trips yet. Tap the heart on any trip to keep it here.", clear: "Clear all", close: "Close saved trips", remove: "Remove", from: "From" },
  ar: { title: "الرحلات المحفوظة", device: "محفوظة على هذا الجهاز", empty: "لا توجد رحلات محفوظة بعد. اضغط على القلب في أي رحلة لحفظها هنا.", clear: "مسح الكل", close: "إغلاق الرحلات المحفوظة", remove: "إزالة", from: "ابتداءً من" },
  de: { title: "Gespeicherte Trips", device: "Auf diesem Gerät gespeichert", empty: "Noch keine gespeicherten Trips. Tippe bei einem Trip auf das Herz, um ihn hier zu behalten.", clear: "Alle löschen", close: "Gespeicherte Trips schließen", remove: "Entfernen", from: "Ab" },
  ru: { title: "Сохранённые поездки", device: "Сохранено на этом устройстве", empty: "Сохранённых поездок пока нет. Нажмите на сердечко у любой поездки, чтобы сохранить её здесь.", clear: "Очистить всё", close: "Закрыть сохранённые поездки", remove: "Удалить", from: "От" },
  pl: { title: "Zapisane wycieczki", device: "Zapisane na tym urządzeniu", empty: "Nie masz jeszcze zapisanych wycieczek. Kliknij serce przy dowolnej wycieczce, aby ją tu zachować.", clear: "Wyczyść wszystko", close: "Zamknij zapisane wycieczki", remove: "Usuń", from: "Od" },
  zh: { title: "收藏的行程", device: "已保存到此设备", empty: "还没有收藏的行程。点击任意行程上的爱心即可收藏到这里。", clear: "全部清除", close: "关闭收藏的行程", remove: "移除", from: "起价" },
} as const;

export default function SavedTripsPanel() {
  const { items, panelOpen, closePanel, remove, clear } = useFavourites();
  const { language, formatPrice } = useSiteSettings();
  const copy = copyByLocale[language];

  useEffect(() => {
    if (!panelOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [panelOpen]);

  if (!panelOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={copy.title}>
      <button type="button" aria-label={copy.close} onClick={closePanel} className="absolute inset-0 h-full w-full bg-slate-950/40 backdrop-blur-sm" />
      <div className="absolute end-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Heart size={20} className="fill-brand-orange-cta text-brand-orange-cta" />
            {copy.title}
            {items.length ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-sm font-bold text-slate-700">{items.length}</span> : null}
          </h2>
          <button type="button" onClick={closePanel} aria-label={copy.close} className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
            <X size={22} />
          </button>
        </div>
        <p className="border-b border-slate-100 bg-slate-50 px-5 py-2 text-xs font-medium text-slate-500">{copy.device}</p>

        {items.length === 0 ? (
          <p className="px-5 py-12 text-center text-slate-500">{copy.empty}</p>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {items.map((item) => (
                <li key={item.slug} className="flex gap-3 p-4">
                  <Link href={localePath(language, `/tours/${item.slug}`)} onClick={closePanel} className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={localePath(language, `/tours/${item.slug}`)} onClick={closePanel} className="line-clamp-2 font-semibold text-slate-900 hover:text-blue-700">{item.title}</Link>
                    <p className="mt-0.5 truncate text-sm text-slate-500">{item.location}</p>
                    {item.bookingMode === "inquiry" ? null : <p className="mt-1 text-sm font-bold text-blue-700">{copy.from} {formatPrice(item.price)}</p>}
                  </div>
                  <button type="button" onClick={() => remove(item.slug)} aria-label={`${copy.remove} — ${item.title}`} className="h-fit rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
                    <X size={18} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-slate-200 p-4">
              <button type="button" onClick={clear} className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">{copy.clear}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
