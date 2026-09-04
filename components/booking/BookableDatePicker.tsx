"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { isOperatingDate } from "@/lib/tour-booking";

type BookableDatePickerProps = {
  value: string;
  minimumDate: string;
  operatingWeekdays?: number[];
  locale: string;
  onChange: (date: string) => void;
};

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const dateFromIso = (value: string) => new Date(`${value}T12:00:00Z`);

export default function BookableDatePicker({ value, minimumDate, operatingWeekdays, locale, onChange }: BookableDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = dateFromIso(value || minimumDate);
    return new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1, 12));
  });
  const container = useRef<HTMLDivElement>(null);
  const rtl = locale === "ar";
  const calendarLocale = locale === "zh" ? "zh-CN" : locale === "ar" ? "ar-SA" : locale;
  const selectedDate = dateFromIso(value);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const firstWeekday = new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth(), 1, 12)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth() + 1, 0, 12)).getUTCDate();
  const dates = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    if (day < 1 || day > daysInMonth) return null;
    return new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth(), day, 12));
  });
  const weekDays = Array.from({ length: 7 }, (_, day) => new Intl.DateTimeFormat(calendarLocale, { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 7, 30 + day, 12))));
  const displayDate = new Intl.DateTimeFormat(calendarLocale, { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(selectedDate);
  const monthLabel = new Intl.DateTimeFormat(calendarLocale, { month: "long", year: "numeric", timeZone: "UTC" }).format(visibleMonth);
  const previousMonth = new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth() - 1, 1, 12));
  const cannotGoBack = isoDate(new Date(Date.UTC(previousMonth.getUTCFullYear(), previousMonth.getUTCMonth() + 1, 0, 12))) < minimumDate;
  const labels = rtl
    ? { choose: "اختر تاريخ الرحلة", available: "التواريخ المتاحة", unavailable: "غير متاح" }
    : locale === "de"
      ? { choose: "Reisedatum auswählen", available: "Buchbare Termine", unavailable: "Nicht verfügbar" }
      : locale === "ru"
        ? { choose: "Выберите дату поездки", available: "Доступные даты", unavailable: "Недоступно" }
        : locale === "pl"
          ? { choose: "Wybierz datę wycieczki", available: "Dostępne terminy", unavailable: "Niedostępne" }
          : locale === "zh"
            ? { choose: "选择行程日期", available: "可预订日期", unavailable: "不可预订" }
            : { choose: "Choose your trip date", available: "Bookable dates", unavailable: "Unavailable" };

  return (
    <div ref={container} className="relative mt-1" dir={rtl ? "rtl" : "ltr"}>
      <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex w-full items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-start font-semibold text-ink outline-none transition hover:border-brand-navy focus:border-brand-navy focus:ring-4 focus:ring-ocean-tint">
        <CalendarDays className="shrink-0 text-brand-navy" size={19}/>
        <span className="flex-1">{displayDate}</span>
        <ChevronRight className={`text-muted transition ${open ? "rotate-90" : ""}`} size={18}/>
      </button>
      {open ? <div role="dialog" aria-label={labels.choose} className="absolute z-50 mt-2 w-full min-w-[300px] rounded-2xl border border-line bg-white p-4 shadow-2xl shadow-ink/20">
        <div className="flex items-center justify-between gap-3">
          <button type="button" disabled={cannotGoBack} aria-label="Previous month" onClick={() => setVisibleMonth(previousMonth)} className="rounded-full p-2 text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-25"><ChevronLeft size={19}/></button>
          <p className="font-black text-brand-navy">{monthLabel}</p>
          <button type="button" aria-label="Next month" onClick={() => setVisibleMonth(new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth() + 1, 1, 12)))} className="rounded-full p-2 text-muted hover:bg-surface-muted"><ChevronRight size={19}/></button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted">{weekDays.map((day, index) => <span key={`${day}-${index}`} className="py-1">{day}</span>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {dates.map((candidate, index) => {
            if (!candidate) return <span key={`empty-${index}`} aria-hidden="true" className="aspect-square"/>;
            const candidateIso = isoDate(candidate);
            const bookable = candidateIso >= minimumDate && isOperatingDate(candidateIso, operatingWeekdays);
            const selected = candidateIso === value;
            return <button key={candidateIso} type="button" disabled={!bookable} aria-label={`${candidate.getUTCDate()} ${monthLabel}${bookable ? `, ${labels.available}` : `, ${labels.unavailable}`}`} aria-pressed={selected} onClick={() => { onChange(candidateIso); setOpen(false); }} className={`relative aspect-square rounded-xl text-sm font-bold transition ${selected ? "bg-brand-navy text-white shadow-md" : bookable ? "bg-ocean-tint text-brand-navy hover:bg-ocean-soft hover:ring-2 hover:ring-brand-navy/20" : "cursor-not-allowed text-line line-through"}`}>
              {candidate.getUTCDate()}
              {bookable && !selected ? <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500" aria-hidden="true"/> : null}
            </button>;
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-surface-muted pt-3 text-xs font-semibold text-muted">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"/>{labels.available}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-line"/>{labels.unavailable}</span>
        </div>
      </div> : null}
    </div>
  );
}
