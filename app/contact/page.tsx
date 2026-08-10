import type { Metadata } from "next";
import Link from "next/link";
import TrackedExternalLink from "@/components/analytics/TrackedExternalLink";
import { contactEmail, displayPhoneNumber, whatsappUrl } from "@/lib/contact";
import { languageAlternates, localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Contact Daily Red Sea",
    description: "Contact the Daily Red Sea team for Hurghada tour, pickup, booking, and private-transfer assistance.",
    path: "/contact",
  }),
  alternates: { canonical: "/contact", languages: { ...languageAlternates("/contact"), "x-default": localePath("en", "/contact") } },
};

export default function ContactPage({ locale = "en" }: { locale?: "en" | "de" | "ru" | "ar" | "pl" | "zh" }) {
  const de = locale === "de";
  const ru = locale === "ru";
  const zh = locale === "zh";
  const chinese: Record<string, string> = {
    "We are here to help": "我们随时为您提供帮助", "Contact Daily Red Sea": "联系 Daily Red Sea", "For the fastest response, send your travel date, hotel, number of adults and children, and the tour or transfer you are considering.": "为了更快获得回复，请发送出行日期、酒店、成人和儿童人数，以及您考虑的旅游或接送服务。",
    "Hello Daily Red Sea, I need help with a booking.": "您好 Daily Red Sea，我需要预订帮助。", "Fastest": "最快回复", "Tour advice, availability, pickup changes, and booking help.": "旅游建议、名额查询、接送变更和预订帮助。", "Useful for detailed requests and documents.": "适合详细咨询和发送文件。", "Telephone": "电话", "For urgent same-day assistance.": "适合当天紧急协助。", "Already booked?": "已经预订？", "Include your booking reference when contacting us. For pickup changes or urgent questions close to departure, use WhatsApp so the team can identify your booking quickly.": "联系我们时请提供预订编号。如需更改接送或在出发前有紧急问题，请使用 WhatsApp，以便团队快速找到您的预订。", "Find my booking": "查找我的预订",
  };
  const tr = (en: string, deText: string, ruText: string) => de ? deText : ru ? ruText : zh ? chinese[en] || en : en;
  return (
    <main className="min-h-screen bg-slate-50 px-6 pb-20 pt-32 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="font-semibold uppercase tracking-[0.28em] text-cyan-700">{tr("We are here to help", "Wir helfen gerne", "Мы готовы помочь")}</p>
        <h1 className="mt-4 text-4xl font-black text-slate-950 sm:text-6xl">{tr("Contact Daily Red Sea", "Daily Red Sea kontaktieren", "Связаться с Daily Red Sea")}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{tr("For the fastest response, send your travel date, hotel, number of adults and children, and the tour or transfer you are considering.", "Für eine schnelle Antwort sende uns Reisedatum, Hotel, Anzahl der Erwachsenen und Kinder sowie den gewünschten Ausflug oder Transfer.", "Чтобы получить быстрый ответ, сообщите дату поездки, отель, количество взрослых и детей, а также интересующую экскурсию или трансфер.")}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <TrackedExternalLink event="whatsapp_click" eventData={{ location: "contact_page" }} href={whatsappUrl(tr("Hello Daily Red Sea, I need help with a booking.", "Hallo Daily Red Sea, ich brauche Hilfe bei einer Buchung.", "Здравствуйте! Мне нужна помощь с бронированием."))} target="_blank" rel="noopener noreferrer" className="rounded-3xl border border-emerald-200 bg-emerald-50 p-7 transition hover:-translate-y-1"><p className="text-sm font-bold uppercase tracking-wider text-emerald-700">{tr("Fastest", "Am schnellsten", "Самый быстрый способ")}</p><h2 className="mt-3 text-2xl font-black text-slate-950">WhatsApp</h2><p className="mt-3 text-slate-600">{tr("Tour advice, availability, pickup changes, and booking help.", "Beratung, Verfügbarkeit, Änderungen der Abholung und Buchungshilfe.", "Советы по экскурсиям, наличие мест, изменение трансфера и помощь с бронированием.")}</p></TrackedExternalLink>
          <TrackedExternalLink event="email_click" eventData={{ location: "contact_page" }} href={`mailto:${contactEmail}`} className="rounded-3xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1"><p className="text-sm font-bold uppercase tracking-wider text-cyan-700">E-Mail</p><h2 className="mt-3 text-xl font-black text-slate-950">{contactEmail}</h2><p className="mt-3 text-slate-600">{tr("Useful for detailed requests and documents.", "Geeignet für ausführliche Anfragen und Dokumente.", "Подходит для подробных запросов и документов.")}</p></TrackedExternalLink>
          <TrackedExternalLink event="phone_click" eventData={{ location: "contact_page" }} href={`tel:${displayPhoneNumber.replace(/\s/g, "")}`} className="rounded-3xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1"><p className="text-sm font-bold uppercase tracking-wider text-cyan-700">{tr("Telephone", "Telefon", "Телефон")}</p><h2 className="mt-3 text-xl font-black text-slate-950">{displayPhoneNumber}</h2><p className="mt-3 text-slate-600">{tr("For urgent same-day assistance.", "Für dringende Hilfe am selben Tag.", "Для срочной помощи в день поездки.")}</p></TrackedExternalLink>
        </div>
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-8"><h2 className="text-2xl font-black text-slate-950">{tr("Already booked?", "Bereits gebucht?", "Уже забронировали?")}</h2><p className="mt-4 leading-7 text-slate-600">{tr("Include your booking reference when contacting us. For pickup changes or urgent questions close to departure, use WhatsApp so the team can identify your booking quickly.", "Nenne bei der Kontaktaufnahme deine Buchungsnummer. Für Änderungen der Abholung oder dringende Fragen kurz vor Abfahrt nutze WhatsApp.", "При обращении укажите номер бронирования. Для изменения трансфера или срочных вопросов перед отправлением используйте WhatsApp.")}</p><Link href={localePath(locale, "/booking")} className="mt-6 inline-flex rounded-full bg-blue-700 px-6 py-3 font-bold text-white">{tr("Find my booking", "Buchung finden", "Найти бронирование")}</Link></section>
      </div>
    </main>
  );
}
