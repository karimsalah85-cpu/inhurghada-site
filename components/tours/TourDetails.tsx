"use client";

import type { Tour } from "@/data/tours";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { BadgeCheck, CalendarDays, Clock3, Compass, Sparkles, Ticket, TriangleAlert } from "lucide-react";
import TourItinerary from "@/components/tours/TourItinerary";
import { speedboatTerms } from "@/data/speedboat-booking";

export default function TourDetails({ tour }: { tour: Tour }) {
  const { formatPrice, language } = useSiteSettings();
  const de = language === "de";
  const ru = language === "ru";
  const ar = language === "ar";
  const zh = language === "zh";
  const tr = (en: string, deText: string, ruText: string, arText: string, zhText = en) => de ? deText : ru ? ruText : ar ? arText : zh ? zhText : en;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Description","Beschreibung","Описание","الوصف","项目介绍")}</p>
        <h2 className="mt-4 text-3xl font-bold text-slate-900">{tr("About this tour","Über diesen Ausflug","Об этой экскурсии","عن هذه الرحلة","关于此行程")}</h2>
        <p className="mt-6 text-lg leading-8 text-slate-600">{tour.description}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-cyan-700"><Clock3 size={16} /> {tr("Duration","Dauer","Продолжительность","المدة","时长")}</div>
            <p className="mt-3 text-xl font-semibold text-slate-900">{tour.duration}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-cyan-700"><Sparkles size={16} /> {tr("Rating","Bewertung","Рейтинг","التقييم","评分")}</div>
            <p className="mt-3 text-xl font-semibold text-slate-900">{tour.rating} / 5</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-cyan-700"><Ticket size={16} /> {tr("Price","Preis","Цена","السعر","价格")}</div>
            <p className="mt-3 text-xl font-semibold text-slate-900">{tour.bookingMode === "inquiry" ? tr("Price on request", "Preis auf Anfrage", "Цена по запросу", "السعر عند الطلب", "价格需咨询") : <>{tour.originalPrice && Number(tour.originalPrice) > Number(tour.price) ? <span className="mr-2 text-base text-slate-400 line-through">{formatPrice(tour.originalPrice)}</span> : null}{formatPrice(tour.price)} {tour.priceUnit ?? tr("per person","pro Person","за человека","للشخص","每人")}</>}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Highlights","Höhepunkte","Основные моменты","أهم المميزات","行程亮点")}</p>
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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Included","Inklusive","Включено","يشمل","费用包含")}</p>
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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Not included","Nicht inklusive","Не включено","لا يشمل","费用不含")}</p>
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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Know before you go","Wichtige Informationen","Важная информация","معلومات مهمة","出行须知")}</p>
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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{tr("Select your package","Paket auswählen","Выберите пакет","اختر الباقة","选择套餐")}</p>
          <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{tour.packageName ?? tour.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{tour.packageDescription ?? tour.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">{tour.bookingMode === "inquiry" ? tr("Quotation", "Angebot", "Предложение", "عرض سعر", "报价") : de ? "Ab" : ru ? "От" : zh ? "起价" : "Starting from"}</p>
                <p className="text-2xl font-bold text-cyan-700">{tour.bookingMode === "inquiry" ? tr("Request price", "Preis anfragen", "Узнать цену", "اطلب السعر", "咨询价格") : formatPrice(tour.packagePrice ?? tour.price)}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-cyan-700">
              <Compass size={16} /> {tour.packageLabel ?? (de ? "Erwachsener" : ru ? "Взрослый" : zh ? "成人" : "Adult")}
            </div>
          </div>
        </div>
      </div>

      {tour.itinerary ? <TourItinerary items={tour.itinerary} /> : null}

      {tour.showSpeedboatTerms ? <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">Terms &amp; Conditions</p><ul className="mt-6 space-y-3">{speedboatTerms.map((item) => <li key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"><BadgeCheck className="mt-0.5 shrink-0 text-cyan-700" size={18}/><span>{item}</span></li>)}</ul></section> : null}

      {tour.notSuitableFor?.length || tour.whatToBring?.length ? <div className="grid gap-8 lg:grid-cols-2"><div className="rounded-3xl border border-rose-200 bg-rose-50 p-8"><p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-rose-700"><TriangleAlert size={18}/>Not suitable for</p><ul className="mt-5 space-y-3">{tour.notSuitableFor?.map((item)=><li key={item} className="rounded-xl bg-white p-4 text-sm text-slate-700">{item}</li>)}</ul></div><div className="rounded-3xl border border-amber-200 bg-amber-50 p-8"><p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-800">What to bring</p><ul className="mt-5 grid gap-3 sm:grid-cols-2">{tour.whatToBring?.map((item)=><li key={item} className="rounded-xl bg-white p-4 text-sm text-slate-700">{item}</li>)}</ul></div></div> : null}
    </div>
  );
}
