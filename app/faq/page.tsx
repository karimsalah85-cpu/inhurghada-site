import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { languageAlternates, localePath } from "@/lib/i18n";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Hurghada Tours and Transfers FAQ",
    description: "Answers about booking, payment, pickup, cancellation, passports, children, and private transfers with Daily Red Sea.",
    path: "/faq",
  }),
  alternates: { canonical: "/faq", languages: { ...languageAlternates("/faq"), "x-default": localePath("en", "/faq") } },
};

const faqs = [
  { question: "How do I book?", answer: "Choose an experience, select the available date, time, and travelers, then submit your details. We confirm availability and pickup information by email or WhatsApp." },
  { question: "When and how do I pay?", answer: "Most bookings are reserved online and paid in cash on arrival. The payment method and total are shown before you submit the booking." },
  { question: "Is hotel pickup included?", answer: "Pickup information is listed on each tour page. Some resort areas can have an additional transfer charge; any applicable amount is shown or confirmed before service." },
  { question: "Do I need a passport?", answer: "Tours and excursions may require a valid passport, ID, or copy for travel permits. This requirement does not apply to ordinary private transfer services unless authorities specifically request identification." },
  { question: "Can children and infants join?", answer: "Age rules and child prices depend on the experience. Available adult, youth, and infant options are shown in the booking form." },
  { question: "Can I cancel or change a booking?", answer: "Contact us as early as possible. Tour-specific cancellation terms apply, and availability determines whether a date, time, or group-size change is possible." },
  { question: "How is my pickup time confirmed?", answer: "Select a listed time where available. When timing depends on the hotel, flight, weather, or sunset, our team confirms the exact pickup time by WhatsApp." },
  { question: "Are transfer prices per person?", answer: "Airport and Senzo Mall transfers use the fixed one-way fare described on their booking pages. Tours normally show per-person pricing unless clearly marked otherwise." },
];

const germanFaqs = [
  { question: "Wie buche ich?", answer: "Wähle ein Erlebnis, Datum, Uhrzeit und die Anzahl der Reisenden und sende anschließend deine Angaben. Wir bestätigen Verfügbarkeit und Abholung per E-Mail oder WhatsApp." },
  { question: "Wann und wie bezahle ich?", answer: "Die meisten Buchungen werden online reserviert und bei Ankunft bar bezahlt. Zahlungsart und Gesamtpreis werden vor dem Absenden angezeigt." },
  { question: "Ist die Hotelabholung inklusive?", answer: "Die Abholinformationen stehen auf jeder Ausflugsseite. Für einige Resortgebiete kann ein Zuschlag gelten, der vor der Leistung angezeigt oder bestätigt wird." },
  { question: "Brauche ich einen Reisepass?", answer: "Für Ausflüge kann ein gültiger Reisepass, Ausweis oder eine Kopie für Reisegenehmigungen erforderlich sein. Für gewöhnliche Privattransfers gilt dies normalerweise nicht." },
  { question: "Können Kinder und Kleinkinder teilnehmen?", answer: "Altersregeln und Kinderpreise hängen vom Erlebnis ab. Verfügbare Optionen werden im Buchungsformular angezeigt." },
  { question: "Kann ich eine Buchung stornieren oder ändern?", answer: "Kontaktiere uns so früh wie möglich. Es gelten die Bedingungen des jeweiligen Ausflugs; Änderungen hängen von der Verfügbarkeit ab." },
  { question: "Wie wird meine Abholzeit bestätigt?", answer: "Wähle eine angegebene Uhrzeit. Wenn die Zeit von Hotel, Flug, Wetter oder Sonnenuntergang abhängt, bestätigt unser Team sie per WhatsApp." },
  { question: "Gelten Transferpreise pro Person?", answer: "Flughafen- und Senzo-Mall-Transfers haben den auf der Buchungsseite beschriebenen Festpreis für eine einfache Fahrt. Ausflüge werden normalerweise pro Person berechnet." },
];
const russianFaqs = [
  { question: "Как забронировать?", answer: "Выберите экскурсию, дату, время и количество гостей, затем отправьте данные. Мы подтвердим наличие мест и детали трансфера по электронной почте или в WhatsApp." },
  { question: "Когда и как оплачивать?", answer: "Большинство бронирований оформляются онлайн и оплачиваются наличными по прибытии. Способ оплаты и итоговая сумма показаны до отправки заявки." },
  { question: "Включён ли трансфер из отеля?", answer: "Информация о трансфере указана на странице каждой экскурсии. Для некоторых курортных районов возможна доплата, которую мы показываем или подтверждаем заранее." },
  { question: "Нужен ли паспорт?", answer: "Для экскурсий может потребоваться действующий паспорт, удостоверение личности или копия для оформления разрешений. Для обычного частного трансфера это, как правило, не требуется." },
  { question: "Можно ли с детьми и младенцами?", answer: "Возрастные правила и детские цены зависят от экскурсии. Доступные варианты для взрослых, детей и младенцев показаны в форме бронирования." },
  { question: "Можно отменить или изменить бронирование?", answer: "Свяжитесь с нами как можно раньше. Действуют условия конкретной экскурсии, а изменения зависят от наличия мест." },
  { question: "Как подтверждается время трансфера?", answer: "Выберите доступное время. Если оно зависит от отеля, рейса, погоды или заката, наша команда подтвердит точное время в WhatsApp." },
  { question: "Цена трансфера указана за человека?", answer: "Для трансферов из аэропорта и в Senzo Mall действует фиксированная цена в одну сторону, указанная на странице. Экскурсии обычно оплачиваются за человека." },
];
const arabicFaqs = [
  { question: "كيف أحجز؟", answer: "اختر الرحلة والتاريخ والوقت وعدد المسافرين ثم أرسل بياناتك. نؤكد التوفر وتفاصيل الاستلام عبر البريد الإلكتروني أو واتساب." },
  { question: "متى وكيف أدفع؟", answer: "يتم حجز معظم الرحلات عبر الموقع والدفع نقداً عند الوصول. تظهر طريقة الدفع والإجمالي قبل إرسال الحجز." },
  { question: "هل الاستلام من الفندق مشمول؟", answer: "تظهر معلومات الاستلام في صفحة كل رحلة. قد توجد إضافة لبعض مناطق المنتجعات ويتم توضيحها قبل الخدمة." },
  { question: "هل أحتاج إلى جواز سفر؟", answer: "قد تتطلب الرحلات جواز سفر أو بطاقة هوية سارية أو صورة منها لاستخراج التصاريح. لا ينطبق ذلك عادةً على التوصيل الخاص العادي." },
  { question: "هل يمكن للأطفال والرضع المشاركة؟", answer: "تختلف قواعد العمر وأسعار الأطفال حسب الرحلة. تظهر الخيارات المتاحة في نموذج الحجز." },
  { question: "هل يمكنني إلغاء الحجز أو تعديله؟", answer: "تواصل معنا في أقرب وقت. تطبق شروط الرحلة ويعتمد التعديل على التوفر." },
  { question: "كيف يتم تأكيد وقت الاستلام؟", answer: "اختر وقتاً متاحاً. إذا كان الموعد يعتمد على الفندق أو الرحلة الجوية أو الطقس، يؤكده فريقنا عبر واتساب." },
  { question: "هل سعر التوصيل للشخص؟", answer: "توصيل المطار وسنزو مول له سعر ثابت للاتجاه الواحد كما هو موضح في صفحة الحجز. أسعار الرحلات تكون عادةً للشخص." },
];
const chineseFaqs = [
  { question: "如何预订？", answer: "选择体验、日期、时间和出行人数，然后提交您的信息。我们会通过电子邮件或 WhatsApp 确认名额和接送信息。" },
  { question: "何时以及如何付款？", answer: "大多数预订可在线提交，并在抵达时以现金付款。提交预订前会显示付款方式和总价。" },
  { question: "包含酒店接送吗？", answer: "每个旅游页面都会列出接送信息。部分度假区可能需要支付额外接送费，相关金额会在服务前显示或确认。" },
  { question: "需要护照吗？", answer: "办理旅行许可时，旅游和活动可能需要有效护照、身份证或复印件。普通私人接送通常不需要，除非有关部门要求。" },
  { question: "儿童和婴儿可以参加吗？", answer: "年龄规定和儿童价格因体验而异。预订表单会显示可选的成人、儿童和婴儿人数。" },
  { question: "可以取消或更改预订吗？", answer: "请尽早联系我们。取消政策以具体项目为准，日期、时间或人数能否更改取决于名额。" },
  { question: "接送时间如何确认？", answer: "如有可选时间，请先选择。若时间取决于酒店、航班、天气或日落，我们的团队会通过 WhatsApp 确认准确时间。" },
  { question: "接送价格是按人计算吗？", answer: "机场和 Senzo Mall 接送采用预订页面所述的单程固定价格。旅游项目通常按人收费，除非另有明确说明。" },
];

export default function FaqPage({ locale = "en" }: { locale?: "en" | "de" | "ru" | "ar" | "zh" }) {
  const de = locale === "de";
  const ru = locale === "ru";
  const ar = locale === "ar";
  const zh = locale === "zh";
  const displayedFaqs = de ? germanFaqs : ru ? russianFaqs : ar ? arabicFaqs : zh ? chineseFaqs : faqs;
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", url: absoluteUrl(localePath(locale, "/faq")), mainEntity: displayedFaqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
  return (
    <main className="min-h-screen bg-slate-50 px-6 pb-20 pt-32 sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-4xl">
        <p className="font-semibold uppercase tracking-[0.28em] text-cyan-700">{de ? "Hilfreiche Antworten" : ru ? "Полезные ответы" : ar ? "إجابات مفيدة" : zh ? "实用解答" : "Helpful answers"}</p>
        <h1 className="mt-4 text-4xl font-black text-slate-950 sm:text-6xl">{de ? "FAQ zu Ausflügen und Transfers" : ru ? "Вопросы об экскурсиях и трансферах" : ar ? "أسئلة الرحلات والتوصيلات" : zh ? "旅游和接送常见问题" : "Tours and transfers FAQ"}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">{de ? "Klare Antworten auf praktische Fragen vor der Buchung in Hurghada." : ru ? "Понятные ответы на практические вопросы перед бронированием в Хургаде." : ar ? "إجابات واضحة عن الأسئلة المهمة قبل الحجز في الغردقة." : zh ? "解答游客在赫尔格达预订前常见的实用问题。" : "Clear answers to the practical questions travelers ask before booking in Hurghada."}</p>
        <div className="mt-10 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-7 shadow-sm">{displayedFaqs.map((faq) => <details key={faq.question} className="py-6"><summary className="cursor-pointer text-lg font-bold text-slate-950">{faq.question}</summary><p className="mt-4 leading-8 text-slate-600">{faq.answer}</p></details>)}</div>
        <div className="mt-8 flex flex-wrap gap-3"><Link href={`${localePath(locale)}#tours`} className="rounded-full bg-blue-700 px-6 py-3 font-bold text-white">{de ? "Ausflüge entdecken" : ru ? "Выбрать экскурсию" : ar ? "استكشف الرحلات" : zh ? "探索旅游项目" : "Explore tours"}</Link><Link href={localePath(locale, "/contact")} className="rounded-full border border-slate-300 px-6 py-3 font-bold text-slate-800">{de ? "Kontakt" : ru ? "Связаться с нами" : ar ? "تواصل معنا" : zh ? "联系我们" : "Contact us"}</Link></div>
      </div>
    </main>
  );
}
