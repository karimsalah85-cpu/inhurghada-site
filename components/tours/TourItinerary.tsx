"use client";

import { Check, Clock3, MapPin, Route } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { parseItineraryStep } from "@/lib/itinerary";

export default function TourItinerary({ items }: { items: string[] }) {
  const { language } = useSiteSettings();
  const translations: Record<string, { eyebrow: string; title: string; optional: string; note: string }> = {
    en: { eyebrow: "Your route", title: "Itinerary", optional: "Optional", note: "Times and stops may change slightly because of weather and operating conditions." },
    de: { eyebrow: "Deine Route", title: "Reiseverlauf", optional: "Optional", note: "Zeiten und Stopps können sich je nach Wetter und Betriebsbedingungen leicht ändern." },
    ru: { eyebrow: "Ваш маршрут", title: "Программа поездки", optional: "По желанию", note: "Время и остановки могут немного меняться из-за погоды и условий проведения." },
    ar: { eyebrow: "مسار الرحلة", title: "برنامج الرحلة", optional: "اختياري", note: "قد تتغير الأوقات ومحطات التوقف قليلاً حسب الطقس وظروف التشغيل." },
    pl: { eyebrow: "Twoja trasa", title: "Program wycieczki", optional: "Opcjonalnie", note: "Godziny i postoje mogą się nieznacznie zmienić ze względu na pogodę i warunki organizacyjne." },
    zh: { eyebrow: "您的路线", title: "行程安排", optional: "可选", note: "时间和停靠点可能因天气和运营情况略有调整。" },
  };
  const labels = translations[language] || translations.en;

  return <section className="overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-sm">
    <div className="bg-gradient-to-br from-cyan-950 via-slate-950 to-blue-950 p-8 text-white">
      <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-cyan-300"><Route size={18}/>{labels.eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black">{labels.title}</h2>
    </div>
    <ol className="px-6 py-8 sm:px-9">
      {items.map((item, index) => {
        const step = parseItineraryStep(item);
        const last = index === items.length - 1;
        return <li key={`${item}-${index}`} className="relative grid grid-cols-[2.75rem_1fr] gap-4 pb-7 last:pb-0">
          {!last ? <span aria-hidden="true" className="absolute bottom-0 left-[1.34rem] top-10 w-0.5 bg-gradient-to-b from-cyan-400 to-blue-200"/> : null}
          <span className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white font-black shadow-md ${last ? "bg-emerald-500 text-white" : "bg-cyan-500 text-white"}`}>
            {last ? <Check size={20}/> : index === 0 ? <MapPin size={20}/> : index + 1}
          </span>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex sm:items-start sm:justify-between sm:gap-5">
            <div><h3 className="font-black text-slate-950">{step.title}</h3>{step.detail ? <p className="mt-1 text-sm leading-6 text-slate-600">{step.detail}</p> : null}</div>
            <div className="mt-3 flex shrink-0 flex-wrap gap-2 sm:mt-0">{step.duration ? <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"><Clock3 size={13}/>{step.duration}</span> : null}{step.optional ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{labels.optional}</span> : null}</div>
          </div>
        </li>;
      })}
    </ol>
    <p className="border-t border-slate-100 bg-slate-50 px-8 py-4 text-xs leading-5 text-slate-500">{labels.note}</p>
  </section>;
}
