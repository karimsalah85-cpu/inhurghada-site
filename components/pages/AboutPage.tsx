import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Handshake, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";
import { localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Daily Red Sea",
  description: "Meet the local team behind Daily Red Sea tours, excursions, and private transfers across the Red Sea.",
  path: "/about",
});

export function AboutPage({ locale = "en" }: { locale?: "en" | "de" | "ru" | "ar" | "pl" | "zh" }) {
  const de = locale === "de";
  const ru = locale === "ru";
  const ar = locale === "ar";
  const zh = locale === "zh";
  const arabic: Record<string, string> = {
    "Local help on the Red Sea": "مساعدة محلية على البحر الأحمر",
    "Memorable Red Sea days, made easier.": "أيام لا تُنسى في البحر الأحمر، أصبحت أسهل.",
    "Daily Red Sea helps travelers choose and arrange tours, boat trips, desert experiences, historical day trips, and private transfers across the Red Sea. We focus on clear information, practical local support, and straightforward booking.": "تساعد Daily Red Sea المسافرين على اختيار وتنظيم الرحلات وجولات القوارب وتجارب الصحراء والرحلات التاريخية اليومية وخدمات التوصيل الخاص على امتداد البحر الأحمر. نركز على تقديم معلومات واضحة ودعم محلي عملي وحجز بسيط ومباشر.",
    "Local knowledge": "معرفة محلية",
    "Advice grounded in local pickup areas, trip timings, and the practical details visitors need.": "نصائح مبنية على مناطق الاستلام المحلية ومواعيد الرحلات والتفاصيل العملية التي يحتاجها الزوار.",
    "Selected experiences": "تجارب مختارة",
    "A focused collection of tours and transfers with clear inclusions and starting prices.": "مجموعة مختارة من الرحلات وخدمات التوصيل مع توضيح واضح لما تشمله الأسعار المبدئية.",
    "Human confirmation": "تأكيد شخصي",
    "Our team confirms availability and pickup details directly by WhatsApp.": "يقوم فريقنا بتأكيد التوفر وتفاصيل الاستلام مباشرة عبر واتساب.",
    "Transparent booking": "حجز شفاف",
    "Your date, travelers, total, payment method, and important requirements are shown before confirmation.": "يتم عرض التاريخ وعدد المسافرين والإجمالي وطريقة الدفع والمتطلبات المهمة قبل التأكيد.",
    "Planning something specific?": "هل تخطط لشيء محدد؟",
    "Tell us your dates, hotel, group size, and interests. We will help you choose an appropriate available experience without adding hidden costs.": "أخبرنا بتواريخك وفندقك وعدد أفراد المجموعة واهتماماتك. سنساعدك في اختيار تجربة متاحة ومناسبة دون أي تكاليف خفية.",
    "Hello Daily Red Sea, I would like help planning my Red Sea trip.": "مرحباً Daily Red Sea، أرغب في المساعدة لتخطيط رحلتي إلى البحر الأحمر.",
    "Ask our local team": "تواصل مع فريقنا المحلي",
    "Explore tours": "استكشف الرحلات",
    "Our local partners": "شركاؤنا المحليون",
    "Every tour is operated by carefully selected, licensed local partners: boat crews, dive centers, safari guides and drivers who know these waters and roads well. Daily Red Sea handles your booking, communication and support, so you have one team to talk to from your first message until you are back at your hotel.": "يُنفَّذ كل نشاط بواسطة شركاء محليين مرخّصين نختارهم بعناية، من أطقم القوارب ومراكز الغوص ومرشدي السفاري والسائقين الذين يعرفون هذه المياه والطرق جيداً. وتتولى Daily Red Sea الحجز والتواصل والدعم، لتتعامل مع فريق واحد من أول رسالة حتى عودتك إلى فندقك.",
  };
  const chinese: Record<string, string> = {
    "Local help on the Red Sea": "红海本地协助", "Memorable Red Sea days, made easier.": "轻松畅享难忘的红海时光。",
    "Daily Red Sea helps travelers choose and arrange tours, boat trips, desert experiences, historical day trips, and private transfers across the Red Sea. We focus on clear information, practical local support, and straightforward booking.": "Daily Red Sea 帮助游客选择和安排红海沿岸的旅游项目、游船、沙漠体验、历史一日游和私人接送。我们提供清晰的信息、实用的本地支持和简单直接的预订流程。",
    "Local knowledge": "本地经验", "Advice grounded in local pickup areas, trip timings, and the practical details visitors need.": "根据本地接送区域、行程时间和游客所需的实用信息提供建议。",
    "Selected experiences": "精选体验", "A focused collection of tours and transfers with clear inclusions and starting prices.": "精选旅游和接送服务，清楚列明包含项目和起价。",
    "Human confirmation": "人工确认", "Our team confirms availability and pickup details directly by WhatsApp.": "我们的团队会通过 WhatsApp 直接确认名额和接送详情。",
    "Transparent booking": "透明预订", "Your date, travelers, total, payment method, and important requirements are shown before confirmation.": "确认前会清楚显示日期、人数、总价、付款方式和重要要求。",
    "Planning something specific?": "有特别的行程需求？", "Tell us your dates, hotel, group size, and interests. We will help you choose an appropriate available experience without adding hidden costs.": "告诉我们日期、酒店、人数和兴趣，我们会帮助您选择合适且有名额的体验，不收取隐藏费用。",
    "Hello Daily Red Sea, I would like help planning my Red Sea trip.": "您好 Daily Red Sea，我想请您帮助规划红海行程。", "Ask our local team": "咨询本地团队", "Explore tours": "探索旅游项目",
    "Our local partners": "我们的本地合作伙伴", "Every tour is operated by carefully selected, licensed local partners: boat crews, dive centers, safari guides and drivers who know these waters and roads well. Daily Red Sea handles your booking, communication and support, so you have one team to talk to from your first message until you are back at your hotel.": "每个项目均由我们精心挑选的持牌本地合作伙伴运营，包括熟悉当地海域和道路的船员、潜水中心、沙漠向导和司机。Daily Red Sea 负责您的预订、沟通和支持，从您发出第一条消息到返回酒店，您只需对接一个团队。",
  };
  const polish: Record<string, string> = {
    "Local help on the Red Sea": "Lokalne wsparcie nad Morzem Czerwonym",
    "Memorable Red Sea days, made easier.": "Niezapomniane dni nad Morzem Czerwonym — teraz łatwiej.",
    "Daily Red Sea helps travelers choose and arrange tours, boat trips, desert experiences, historical day trips, and private transfers across the Red Sea. We focus on clear information, practical local support, and straightforward booking.": "Daily Red Sea pomaga wybrać i zorganizować wycieczki, rejsy, atrakcje pustynne, wyjazdy historyczne i prywatne transfery nad całym Morzem Czerwonym. Stawiamy na jasne informacje, lokalne wsparcie i prostą rezerwację.",
    "Local knowledge": "Lokalna wiedza",
    "Advice grounded in local pickup areas, trip timings, and the practical details visitors need.": "Praktyczne porady dotyczące lokalnych stref odbioru, godzin wyjazdu i szczegółów ważnych dla odwiedzających.",
    "Selected experiences": "Wybrane atrakcje",
    "A focused collection of tours and transfers with clear inclusions and starting prices.": "Starannie wybrane wycieczki i transfery z jasnym zakresem usług i cenami wyjściowymi.",
    "Human confirmation": "Potwierdzenie przez zespół",
    "Our team confirms availability and pickup details directly by WhatsApp.": "Nasz zespół potwierdza dostępność i szczegóły odbioru bezpośrednio przez WhatsApp.",
    "Transparent booking": "Przejrzysta rezerwacja",
    "Your date, travelers, total, payment method, and important requirements are shown before confirmation.": "Przed potwierdzeniem widzisz datę, liczbę osób, sumę, sposób płatności i ważne wymagania.",
    "Planning something specific?": "Planujesz coś konkretnego?",
    "Tell us your dates, hotel, group size, and interests. We will help you choose an appropriate available experience without adding hidden costs.": "Podaj daty, hotel, liczbę osób i zainteresowania. Pomożemy wybrać dostępną atrakcję bez ukrytych kosztów.",
    "Hello Daily Red Sea, I would like help planning my Red Sea trip.": "Dzień dobry Daily Red Sea, proszę o pomoc w zaplanowaniu pobytu nad Morzem Czerwonym.",
    "Ask our local team": "Zapytaj lokalny zespół",
    "Explore tours": "Odkryj wycieczki",
    "Our local partners": "Nasi lokalni partnerzy",
    "Every tour is operated by carefully selected, licensed local partners: boat crews, dive centers, safari guides and drivers who know these waters and roads well. Daily Red Sea handles your booking, communication and support, so you have one team to talk to from your first message until you are back at your hotel.": "Każdą wycieczkę realizują starannie wybrani, licencjonowani lokalni partnerzy: załogi łodzi, centra nurkowe, przewodnicy safari i kierowcy, którzy dobrze znają te wody i drogi. Daily Red Sea zajmuje się rezerwacją, komunikacją i wsparciem, więc od pierwszej wiadomości aż do powrotu do hotelu masz kontakt z jednym zespołem.",
  };
  const tr = (en: string, deText: string, ruText: string) => de ? deText : ru ? ruText : ar ? arabic[en] || en : locale === "pl" ? polish[en] || en : zh ? chinese[en] || en : en;
  return (
    <main className="min-h-screen bg-surface-muted px-6 pb-20 pt-32 sm:px-8">
      <article className="mx-auto max-w-5xl">
        <p className="font-semibold uppercase tracking-[0.28em] text-ocean-dark">{tr("Local help on the Red Sea", "Lokale Hilfe am Roten Meer", "Местная помощь на Красном море")}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black text-ink sm:text-6xl">{tr("Memorable Red Sea days, made easier.", "Unvergessliche Tage am Roten Meer – einfach geplant.", "Незабываемый отдых на Красном море — легко и удобно.")}</h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-muted">{tr("Daily Red Sea helps travelers choose and arrange tours, boat trips, desert experiences, historical day trips, and private transfers across the Red Sea. We focus on clear information, practical local support, and straightforward booking.", "Daily Red Sea hilft Reisenden bei der Auswahl und Organisation von Ausflügen, Bootstouren, Wüstenerlebnissen, historischen Tagesausflügen und privaten Transfers am Roten Meer. Wir setzen auf klare Informationen, praktische lokale Unterstützung und eine unkomplizierte Buchung.", "Daily Red Sea помогает путешественникам выбирать и организовывать экскурсии, морские прогулки, сафари в пустыне, исторические поездки и частные трансферы на Красном море. Мы предлагаем понятную информацию, местную поддержку и простое бронирование.")}</p>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            { icon: MapPin, title: tr("Local knowledge", "Lokale Kenntnisse", "Местные знания"), text: tr("Advice grounded in local pickup areas, trip timings, and the practical details visitors need.", "Praktische Beratung zu Abholgebieten, Zeiten und wichtigen Details vor Ort.", "Практические советы о районах трансфера, времени поездок и важных деталях поездки.") },
            { icon: BadgeCheck, title: tr("Selected experiences", "Ausgewählte Erlebnisse", "Отобранные экскурсии"), text: tr("A focused collection of tours and transfers with clear inclusions and starting prices.", "Eine übersichtliche Auswahl an Ausflügen und Transfers mit klaren Leistungen und Startpreisen.", "Подборка экскурсий и трансферов с понятным описанием услуг и начальными ценами.") },
            { icon: MessageCircle, title: tr("Human confirmation", "Persönliche Bestätigung", "Личное подтверждение"), text: tr("Our team confirms availability and pickup details directly by WhatsApp.", "Unser Team bestätigt Verfügbarkeit und Abholdetails direkt per WhatsApp.", "Наша команда подтверждает наличие мест и детали трансфера напрямую в WhatsApp.") },
            { icon: ShieldCheck, title: tr("Transparent booking", "Transparente Buchung", "Прозрачное бронирование"), text: tr("Your date, travelers, total, payment method, and important requirements are shown before confirmation.", "Datum, Reisende, Gesamtpreis, Zahlungsart und wichtige Anforderungen werden vor der Bestätigung angezeigt.", "До подтверждения вы увидите дату, количество гостей, итоговую сумму, способ оплаты и важные требования.") },
          ].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-3xl border border-line bg-white p-7 shadow-sm"><Icon className="text-ocean-dark" /><h2 className="mt-5 text-xl font-black text-ink">{title}</h2><p className="mt-3 leading-7 text-muted">{text}</p></div>)}
        </section>

        <section className="mt-12 rounded-3xl border border-line bg-white p-7 shadow-sm sm:p-10"><Handshake className="text-ocean-dark" /><h2 className="mt-5 text-2xl font-black text-ink">{tr("Our local partners", "Unsere lokalen Partner", "Наши местные партнёры")}</h2><p className="mt-3 max-w-3xl leading-7 text-muted">{tr("Every tour is operated by carefully selected, licensed local partners: boat crews, dive centers, safari guides and drivers who know these waters and roads well. Daily Red Sea handles your booking, communication and support, so you have one team to talk to from your first message until you are back at your hotel.", "Jeder Ausflug wird von sorgfältig ausgewählten, lizenzierten lokalen Partnern durchgeführt: Bootscrews, Tauchbasen, Safari-Guides und Fahrern, die diese Gewässer und Straßen gut kennen. Daily Red Sea übernimmt Buchung, Kommunikation und Betreuung – so hast du von der ersten Nachricht bis zur Rückkehr ins Hotel ein Team als Ansprechpartner.", "Каждую экскурсию проводят тщательно отобранные лицензированные местные партнёры: экипажи лодок, дайв-центры, гиды сафари и водители, которые хорошо знают эти воды и дороги. Daily Red Sea берёт на себя бронирование, общение и поддержку — от первого сообщения до возвращения в отель вы общаетесь с одной командой.")}</p></section>

        <section className="mt-12 rounded-[2rem] bg-ink p-8 text-white sm:p-10"><h2 className="text-3xl font-black">{tr("Planning something specific?", "Planst du etwas Besonderes?", "Планируете что-то особенное?")}</h2><p className="mt-4 max-w-2xl leading-7 text-line">{tr("Tell us your dates, hotel, group size, and interests. We will help you choose an appropriate available experience without adding hidden costs.", "Nenne uns Reisedaten, Hotel, Gruppengröße und Interessen. Wir helfen dir, ein passendes verfügbares Erlebnis ohne versteckte Kosten zu finden.", "Сообщите даты, отель, размер группы и ваши интересы. Мы поможем выбрать подходящий доступный вариант без скрытых доплат.")}</p><div className="mt-7 flex flex-wrap gap-3"><a href={whatsappUrl(tr("Hello Daily Red Sea, I would like help planning my Red Sea trip.", "Hallo Daily Red Sea, ich möchte Hilfe bei der Planung meiner Reise ans Rote Meer.", "Здравствуйте! Помогите мне спланировать отдых на Красном море."))} target="_blank" rel="noopener noreferrer" className="rounded-full bg-green-600 px-6 py-3 font-bold text-white">{tr("Ask our local team", "Lokales Team fragen", "Написать нашей команде")}</a><Link href={`${localePath(locale)}#tours`} className="rounded-full border border-white/20 px-6 py-3 font-bold">{tr("Explore tours", "Ausflüge entdecken", "Выбрать экскурсию")}</Link></div></section>
      </article>
    </main>
  );
}

export default function Page() {
  return <AboutPage />;
}
