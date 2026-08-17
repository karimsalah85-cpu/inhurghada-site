import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";
import { localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Daily Red Sea",
  description: "Meet the local Hurghada team behind Daily Red Sea tours, excursions, and private transfers.",
  path: "/about",
});

export function AboutPage({ locale = "en" }: { locale?: "en" | "de" | "ru" | "ar" | "pl" | "zh" }) {
  const de = locale === "de";
  const ru = locale === "ru";
  const ar = locale === "ar";
  const zh = locale === "zh";
  const arabic: Record<string, string> = {
    "Local help in Hurghada": "مساعدة محلية في الغردقة",
    "Memorable Red Sea days, made easier.": "أيام لا تُنسى في البحر الأحمر، أصبحت أسهل.",
    "Daily Red Sea helps travelers choose and arrange tours, boat trips, desert experiences, historical day trips, and private transfers in and around Hurghada. We focus on clear information, practical local support, and straightforward booking.": "تساعد Daily Red Sea المسافرين على اختيار وتنظيم الرحلات وجولات القوارب وتجارب الصحراء والرحلات التاريخية اليومية وخدمات التوصيل الخاص في الغردقة وما حولها. نركز على تقديم معلومات واضحة ودعم محلي عملي وحجز بسيط ومباشر.",
    "Local knowledge": "معرفة محلية",
    "Advice grounded in Hurghada pickup areas, trip timings, and the practical details visitors need.": "نصائح مبنية على مناطق الاستلام في الغردقة ومواعيد الرحلات والتفاصيل العملية التي يحتاجها الزوار.",
    "Selected experiences": "تجارب مختارة",
    "A focused collection of tours and transfers with clear inclusions and starting prices.": "مجموعة مختارة من الرحلات وخدمات التوصيل مع توضيح واضح لما تشمله الأسعار المبدئية.",
    "Human confirmation": "تأكيد شخصي",
    "Our team confirms availability and pickup details directly by WhatsApp.": "يقوم فريقنا بتأكيد التوفر وتفاصيل الاستلام مباشرة عبر واتساب.",
    "Transparent booking": "حجز شفاف",
    "Your date, travelers, total, payment method, and important requirements are shown before confirmation.": "يتم عرض التاريخ وعدد المسافرين والإجمالي وطريقة الدفع والمتطلبات المهمة قبل التأكيد.",
    "Planning something specific?": "هل تخطط لشيء محدد؟",
    "Tell us your dates, hotel, group size, and interests. We will help you choose an appropriate available experience without adding hidden costs.": "أخبرنا بتواريخك وفندقك وعدد أفراد المجموعة واهتماماتك. سنساعدك في اختيار تجربة متاحة ومناسبة دون أي تكاليف خفية.",
    "Hello Daily Red Sea, I would like help planning my Hurghada trip.": "مرحباً Daily Red Sea، أرغب في المساعدة لتخطيط رحلتي إلى الغردقة.",
    "Ask our local team": "تواصل مع فريقنا المحلي",
    "Explore tours": "استكشف الرحلات",
  };
  const chinese: Record<string, string> = {
    "Local help in Hurghada": "赫尔格达本地协助", "Memorable Red Sea days, made easier.": "轻松畅享难忘的红海时光。",
    "Daily Red Sea helps travelers choose and arrange tours, boat trips, desert experiences, historical day trips, and private transfers in and around Hurghada. We focus on clear information, practical local support, and straightforward booking.": "Daily Red Sea 帮助游客选择和安排赫尔格达及周边的旅游项目、游船、沙漠体验、历史一日游和私人接送。我们提供清晰的信息、实用的本地支持和简单直接的预订流程。",
    "Local knowledge": "本地经验", "Advice grounded in Hurghada pickup areas, trip timings, and the practical details visitors need.": "根据赫尔格达接送区域、行程时间和游客所需的实用信息提供建议。",
    "Selected experiences": "精选体验", "A focused collection of tours and transfers with clear inclusions and starting prices.": "精选旅游和接送服务，清楚列明包含项目和起价。",
    "Human confirmation": "人工确认", "Our team confirms availability and pickup details directly by WhatsApp.": "我们的团队会通过 WhatsApp 直接确认名额和接送详情。",
    "Transparent booking": "透明预订", "Your date, travelers, total, payment method, and important requirements are shown before confirmation.": "确认前会清楚显示日期、人数、总价、付款方式和重要要求。",
    "Planning something specific?": "有特别的行程需求？", "Tell us your dates, hotel, group size, and interests. We will help you choose an appropriate available experience without adding hidden costs.": "告诉我们日期、酒店、人数和兴趣，我们会帮助您选择合适且有名额的体验，不收取隐藏费用。",
    "Hello Daily Red Sea, I would like help planning my Hurghada trip.": "您好 Daily Red Sea，我想请您帮助规划赫尔格达行程。", "Ask our local team": "咨询本地团队", "Explore tours": "探索旅游项目",
  };
  const polish: Record<string, string> = {
    "Local help in Hurghada": "Lokalne wsparcie w Hurghadzie",
    "Memorable Red Sea days, made easier.": "Niezapomniane dni nad Morzem Czerwonym — teraz łatwiej.",
    "Daily Red Sea helps travelers choose and arrange tours, boat trips, desert experiences, historical day trips, and private transfers in and around Hurghada. We focus on clear information, practical local support, and straightforward booking.": "Daily Red Sea pomaga wybrać i zorganizować wycieczki, rejsy, atrakcje pustynne, wyjazdy historyczne i prywatne transfery w Hurghadzie i okolicy. Stawiamy na jasne informacje, lokalne wsparcie i prostą rezerwację.",
    "Local knowledge": "Lokalna wiedza",
    "Advice grounded in Hurghada pickup areas, trip timings, and the practical details visitors need.": "Praktyczne porady dotyczące stref odbioru, godzin wyjazdu i szczegółów ważnych dla odwiedzających Hurghadę.",
    "Selected experiences": "Wybrane atrakcje",
    "A focused collection of tours and transfers with clear inclusions and starting prices.": "Starannie wybrane wycieczki i transfery z jasnym zakresem usług i cenami wyjściowymi.",
    "Human confirmation": "Potwierdzenie przez zespół",
    "Our team confirms availability and pickup details directly by WhatsApp.": "Nasz zespół potwierdza dostępność i szczegóły odbioru bezpośrednio przez WhatsApp.",
    "Transparent booking": "Przejrzysta rezerwacja",
    "Your date, travelers, total, payment method, and important requirements are shown before confirmation.": "Przed potwierdzeniem widzisz datę, liczbę osób, sumę, sposób płatności i ważne wymagania.",
    "Planning something specific?": "Planujesz coś konkretnego?",
    "Tell us your dates, hotel, group size, and interests. We will help you choose an appropriate available experience without adding hidden costs.": "Podaj daty, hotel, liczbę osób i zainteresowania. Pomożemy wybrać dostępną atrakcję bez ukrytych kosztów.",
    "Hello Daily Red Sea, I would like help planning my Hurghada trip.": "Dzień dobry Daily Red Sea, proszę o pomoc w zaplanowaniu pobytu w Hurghadzie.",
    "Ask our local team": "Zapytaj lokalny zespół",
    "Explore tours": "Odkryj wycieczki",
  };
  const tr = (en: string, deText: string, ruText: string) => de ? deText : ru ? ruText : ar ? arabic[en] || en : locale === "pl" ? polish[en] || en : zh ? chinese[en] || en : en;
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

export default function Page() {
  return <AboutPage />;
}
