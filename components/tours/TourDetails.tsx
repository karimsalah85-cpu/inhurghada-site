"use client";

import type { Tour } from "@/data/tours";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { BadgeCheck, CalendarDays, Clock3, Compass, Sparkles, Ticket } from "lucide-react";

export default function TourDetails({ tour }: { tour: Tour }) {
  const { formatPrice, language } = useSiteSettings();
  const de = language === "de";
  const ru = language === "ru";
  const ar = language === "ar";
  const tr = (en: string, deText: string, ruText: string, arText: string) => de ? deText : ru ? ruText : ar ? arText : en;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Description","Beschreibung","Описание","الوصف")}</p>
        <h2 className="mt-4 text-3xl font-bold text-slate-900">{tr("About this tour","Über diesen Ausflug","Об этой экскурсии","عن هذه الرحلة")}</h2>
        <p className="mt-6 text-lg leading-8 text-slate-600">{tour.description}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-cyan-700"><Clock3 size={16} /> {tr("Duration","Dauer","Продолжительность","المدة")}</div>
            <p className="mt-3 text-xl font-semibold text-slate-900">{tour.duration}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-cyan-700"><Sparkles size={16} /> {tr("Rating","Bewertung","Рейтинг","التقييم")}</div>
            <p className="mt-3 text-xl font-semibold text-slate-900">{tour.rating} / 5</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-cyan-700"><Ticket size={16} /> {tr("Price","Preis","Цена","السعر")}</div>
            <p className="mt-3 text-xl font-semibold text-slate-900">{formatPrice(tour.price)} {tour.priceUnit ?? tr("per person","pro Person","за человека","للشخص")}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Highlights","Höhepunkte","Основные моменты","أهم المميزات")}</p>
        <ul className="mt-6 space-y-4">
          {tour.highlights.map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <BadgeCheck className="mt-0.5 shrink-0 text-cyan-700" size={18} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Included","Inklusive","Включено","يشمل")}</p>
          <ul className="mt-6 space-y-4">
            {(tour.included ?? []).map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <BadgeCheck className="mt-0.5 shrink-0 text-cyan-700" size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Not included","Nicht inklusive","Не включено","لا يشمل")}</p>
          <ul className="mt-6 space-y-4">
            {(tour.notIncluded ?? []).map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <BadgeCheck className="mt-0.5 shrink-0 text-cyan-700" size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Know before you go","Wichtige Informationen","Важная информация","معلومات مهمة")}</p>
          <ul className="mt-6 space-y-4">
            {(tour.notes ?? []).map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <CalendarDays className="mt-0.5 shrink-0 text-cyan-700" size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Select your package","Paket auswählen","Выберите пакет","اختر الباقة")}</p>
          <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{tour.packageName ?? tour.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{tour.packageDescription ?? tour.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">{de ? "Ab" : ru ? "От" : "Starting from"}</p>
                <p className="text-2xl font-bold text-cyan-700">{formatPrice(tour.packagePrice ?? tour.price)}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-cyan-700">
              <Compass size={16} /> {tour.packageLabel ?? (de ? "Erwachsener" : ru ? "Взрослый" : "Adult")}
            </div>
          </div>
        </div>
      </div>

      {tour.itinerary ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{de ? "Tagesablauf" : ru ? "Программа дня" : "Day plan"}</p>
          <ul className="mt-6 space-y-4">
            {tour.itinerary.map((item) => (
              <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
