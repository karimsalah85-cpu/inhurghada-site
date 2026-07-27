import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";
import { languageAlternates, localePath } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "About Daily Red Sea",
  description: "Meet the local Hurghada team behind Daily Red Sea tours, excursions, and private transfers.",
  alternates: { canonical: "/about", languages: { ...languageAlternates("/about"), "x-default": localePath("en", "/about") } },
};

export default function AboutPage({ locale = "en" }: { locale?: "en" | "de" | "ru" | "ar" }) {
  const de = locale === "de";
  const ru = locale === "ru";
  const tr = (en: string, deText: string, ruText: string) => de ? deText : ru ? ruText : en;
  return (
    <main className="min-h-screen bg-slate-50 px-6 pb-20 pt-32 sm:px-8">
      <article className="mx-auto max-w-5xl">
        <p className="font-semibold uppercase tracking-[0.28em] text-cyan-700">{tr("Local help in Hurghada", "Lokale Hilfe in Hurghada", "Местная помощь в Хургаде")}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black text-slate-950 sm:text-6xl">{tr("Memorable Red Sea days, made easier.", "Unvergessliche Tage am Roten Meer – einfach geplant.", "Незабываемый отдых на Красном море — легко и удобно.")}</h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600">{tr("Daily Red Sea helps travelers choose and arrange tours, boat trips, desert experiences, historical day trips, and private transfers in and around Hurghada. We focus on clear information, practical local support, and straightforward booking.", "Daily Red Sea hilft Reisenden bei der Auswahl und Organisation von Ausflügen, Bootstouren, Wüstenerlebnissen, historischen Tagesausflügen und privaten Transfers in und um Hurghada. Wir setzen auf klare Informationen, praktische lokale Unterstützung und eine unkomplizierte Buchung.", "Daily Red Sea помогает путешественникам выбирать и организовывать экскурсии, морские прогулки, сафари в пустыне, исторические поездки и частные трансферы в Хургаде и окрестностях. Мы предлагаем понятную информацию, местную поддержку и простое бронирование.")}</p>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            { icon: MapPin, title: tr("Local knowledge", "Lokale Kenntnisse", "Знание Хургады"), text: tr("Advice grounded in Hurghada pickup areas, trip timings, and the practical details visitors need.", "Praktische Beratung zu Abholgebieten, Zeiten und wichtigen Details in Hurghada.", "Практические советы о районах трансфера, времени поездок и важных деталях отдыха в Хургаде.") },
            { icon: BadgeCheck, title: tr("Selected experiences", "Ausgewählte Erlebnisse", "Отобранные экскурсии"), text: tr("A focused collection of tours and transfers with clear inclusions and starting prices.", "Eine übersichtliche Auswahl an Ausflügen und Transfers mit klaren Leistungen und Startpreisen.", "Подборка экскурсий и трансферов с понятным описанием услуг и начальными ценами.") },
            { icon: MessageCircle, title: tr("Human confirmation", "Persönliche Bestätigung", "Личное подтверждение"), text: tr("Our team confirms availability and pickup details directly by WhatsApp.", "Unser Team bestätigt Verfügbarkeit und Abholdetails direkt per WhatsApp.", "Наша команда подтверждает наличие мест и детали трансфера напрямую в WhatsApp.") },
            { icon: ShieldCheck, title: tr("Transparent booking", "Transparente Buchung", "Прозрачное бронирование"), text: tr("Your date, travelers, total, payment method, and important requirements are shown before confirmation.", "Datum, Reisende, Gesamtpreis, Zahlungsart und wichtige Anforderungen werden vor der Bestätigung angezeigt.", "До подтверждения вы увидите дату, количество гостей, итоговую сумму, способ оплаты и важные требования.") },
          ].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><Icon className="text-cyan-700" /><h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2><p className="mt-3 leading-7 text-slate-600">{text}</p></div>)}
        </section>

        <section className="mt-12 rounded-[2rem] bg-slate-950 p-8 text-white sm:p-10"><h2 className="text-3xl font-black">{tr("Planning something specific?", "Planst du etwas Besonderes?", "Планируете что-то особенное?")}</h2><p className="mt-4 max-w-2xl leading-7 text-slate-300">{tr("Tell us your dates, hotel, group size, and interests. We will help you choose an appropriate available experience without adding hidden costs.", "Nenne uns Reisedaten, Hotel, Gruppengröße und Interessen. Wir helfen dir, ein passendes verfügbares Erlebnis ohne versteckte Kosten zu finden.", "Сообщите даты, отель, размер группы и ваши интересы. Мы поможем выбрать подходящий доступный вариант без скрытых доплат.")}</p><div className="mt-7 flex flex-wrap gap-3"><a href={whatsappUrl(tr("Hello Daily Red Sea, I would like help planning my Hurghada trip.", "Hallo Daily Red Sea, ich möchte Hilfe bei der Planung meiner Hurghada-Reise.", "Здравствуйте! Помогите мне спланировать отдых в Хургаде."))} target="_blank" rel="noopener noreferrer" className="rounded-full bg-green-600 px-6 py-3 font-bold text-white">{tr("Ask our local team", "Lokales Team fragen", "Написать нашей команде")}</a><Link href={`${localePath(locale)}#tours`} className="rounded-full border border-white/20 px-6 py-3 font-bold">{tr("Explore tours", "Ausflüge entdecken", "Выбрать экскурсию")}</Link></div></section>
      </article>
    </main>
  );
}
