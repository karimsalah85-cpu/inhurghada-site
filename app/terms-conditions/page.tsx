import Link from "next/link";
import type { Metadata } from "next";
import { localePath, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description: "Terms and conditions for Daily Red Sea bookings and transfers.",
  path: "/terms-conditions",
});

type TermsLocale = Extract<Locale, "en" | "de" | "ru">;
type Section = { title: string; id?: string; paragraphs: string[] };

const copy: Record<TermsLocale, { legal: string; title: string; intro: string; back: string; sections: Section[] }> = {
  en: {
    legal: "Legal",
    title: "Terms & Conditions",
    intro: "By booking a tour, transfer, or activity with Daily Red Sea, you agree to the terms below. These terms apply alongside any specific conditions shown on an individual tour page.",
    back: "Back to home",
    sections: [
      { title: "Bookings & confirmation", paragraphs: ["A request submitted through our website or WhatsApp is not confirmed until you receive confirmation from our team, including your final price, pickup details, and payment method. Please check your confirmation carefully and let us know immediately if any details are incorrect."] },
      { title: "Pricing & payment", paragraphs: ["Prices are shown per person or per booking, in your selected currency, and include the inclusions listed on the tour page. Unless stated otherwise, payment is accepted in cash on arrival; some tours may require online prepayment or a deposit, which will be clearly indicated before you confirm. We do not add hidden fees on top of the listed price."] },
      { title: "Pickup & participation", paragraphs: ["Pickup times are estimates confirmed the day before (or on the morning of) your activity via WhatsApp, and may shift due to traffic, weather, or hotel location. Some activities have age, health, swimming ability, or fitness requirements listed on the tour page—please read these before booking and let us know of any relevant medical conditions in advance."] },
      { title: "Changes to bookings", paragraphs: ["If you need to change your date, group size, or pickup details, contact us on WhatsApp as early as possible. Changes are subject to availability and may not always be possible close to the activity date."] },
      { title: "Cancellations & Refunds", id: "cancellations", paragraphs: [
        "Free cancellation window: Unless a different window is stated on the specific tour page, cancellations made at least 24 hours before the scheduled pickup time are eligible for a full refund (or no charge, for cash-on-arrival bookings).",
        "Late cancellations: Cancellations made within 24 hours of pickup, or no-shows, are not eligible for a refund, since local suppliers reserve your place and incur costs.",
        "Tour-specific terms: Some activities (for example, private tours, boats with limited capacity, or third-party operated experiences) may have a longer notice period or be non-refundable—this will always be shown on the tour page before you book.",
        "Cancellations by us: If we or our local supplier need to cancel or reschedule an activity (weather, safety, insufficient group size, or operational reasons), you'll be offered a full refund or the option to rebook another date or activity.",
        "How to cancel: Message us on WhatsApp with your booking reference as soon as possible. We'll confirm your refund eligibility and, where applicable, process it to your original payment method within a stated number of business days (for example, 5–7 days)—for cash-on-arrival bookings, no charge is made.",
      ] },
      { title: "Liability", paragraphs: [
        "Daily Red Sea operates as a booking and coordination platform, connecting travelers with local Hurghada-based operators, crews, guides, and drivers who deliver the activity itself.",
        "Tours, boat trips, safaris, and transfers are carried out by independent local suppliers in accordance with their own safety standards and applicable Egyptian regulations.",
        "Participation in water-based activities (snorkeling, diving, boat trips) and land-based activities (quad biking, desert safaris) carries inherent risk. Guests participate at their own risk and are expected to follow their guide's or crew's safety briefing and instructions at all times.",
        "Daily Red Sea is not liable for injury, loss, illness, or damage arising from a guest's failure to follow safety instructions, pre-existing medical conditions not disclosed at booking, or acts outside our reasonable control (including weather, natural events, third-party acts, or force majeure).",
        "Itineraries, routes, and timings may be adjusted by the local operator for safety or operational reasons; we'll aim to notify you of significant changes as early as possible.",
        "Nothing in these terms excludes liability that cannot legally be excluded under applicable law.",
      ] },
    ],
  },
  de: {
    legal: "Rechtliches",
    title: "Allgemeine Geschäftsbedingungen",
    intro: "Mit der Buchung eines Ausflugs, Transfers oder einer Aktivität bei Daily Red Sea stimmst du den folgenden Bedingungen zu. Diese gelten zusätzlich zu den besonderen Bedingungen auf der jeweiligen Ausflugsseite.",
    back: "Zur Startseite",
    sections: [
      { title: "Buchung & Bestätigung", paragraphs: ["Eine Anfrage über unsere Website oder WhatsApp ist erst bestätigt, wenn du von unserem Team eine Bestätigung mit dem endgültigen Preis, den Abholdetails und der Zahlungsmethode erhalten hast. Bitte prüfe die Bestätigung sorgfältig und teile uns Fehler sofort mit."] },
      { title: "Preise & Zahlung", paragraphs: ["Die Preise gelten pro Person oder pro Buchung in der von dir gewählten Währung und enthalten die auf der Ausflugsseite aufgeführten Leistungen. Sofern nicht anders angegeben, erfolgt die Zahlung bei Ankunft in bar. Für einzelne Ausflüge kann eine Online-Vorauszahlung oder Anzahlung erforderlich sein; darauf weisen wir vor der Bestätigung deutlich hin. Zum angegebenen Preis kommen keine versteckten Gebühren hinzu."] },
      { title: "Abholung & Teilnahme", paragraphs: ["Abholzeiten sind Richtwerte und werden am Vortag oder am Morgen der Aktivität per WhatsApp bestätigt. Sie können sich aufgrund von Verkehr, Wetter oder Hotellage ändern. Für manche Aktivitäten gelten Alters-, Gesundheits-, Schwimm- oder Fitnessanforderungen. Bitte lies diese vor der Buchung und informiere uns vorab über relevante gesundheitliche Einschränkungen."] },
      { title: "Änderungen an Buchungen", paragraphs: ["Wenn du Datum, Gruppengröße oder Abholdetails ändern möchtest, kontaktiere uns so früh wie möglich per WhatsApp. Änderungen sind von der Verfügbarkeit abhängig und kurz vor dem Aktivitätstag möglicherweise nicht mehr möglich."] },
      { title: "Stornierungen & Rückerstattungen", id: "cancellations", paragraphs: [
        "Kostenlose Stornierungsfrist: Sofern auf der jeweiligen Ausflugsseite keine andere Frist angegeben ist, berechtigen Stornierungen mindestens 24 Stunden vor der geplanten Abholzeit zu einer vollständigen Rückerstattung. Bei Barzahlung vor Ort entstehen keine Kosten.",
        "Verspätete Stornierungen: Bei Stornierungen innerhalb von 24 Stunden vor der Abholung oder bei Nichterscheinen besteht kein Anspruch auf Rückerstattung, da lokale Anbieter deinen Platz reservieren und Kosten entstehen.",
        "Ausflugsspezifische Bedingungen: Für bestimmte Aktivitäten, zum Beispiel private Touren, Boote mit begrenzter Kapazität oder Leistungen externer Anbieter, kann eine längere Frist gelten oder eine Rückerstattung ausgeschlossen sein. Dies wird vor der Buchung auf der Ausflugsseite angezeigt.",
        "Stornierungen durch uns: Müssen wir oder ein lokaler Anbieter eine Aktivität wegen Wetter, Sicherheit, zu geringer Gruppengröße oder betrieblicher Gründe absagen oder verschieben, erhältst du eine vollständige Rückerstattung oder kannst einen anderen Termin beziehungsweise eine andere Aktivität wählen.",
        "So stornierst du: Sende uns so früh wie möglich deine Buchungsnummer per WhatsApp. Wir bestätigen die Erstattungsberechtigung und veranlassen eine mögliche Rückzahlung innerhalb der genannten Bearbeitungszeit, zum Beispiel 5–7 Werktage, über die ursprüngliche Zahlungsmethode. Bei Barzahlung vor Ort wird nichts berechnet.",
      ] },
      { title: "Haftung", paragraphs: [
        "Daily Red Sea ist eine Buchungs- und Koordinationsplattform, die Reisende mit lokalen Anbietern, Crews, Reiseleitern und Fahrern in Hurghada verbindet, welche die jeweilige Leistung durchführen.",
        "Ausflüge, Bootsfahrten, Safaris und Transfers werden von unabhängigen lokalen Anbietern nach deren Sicherheitsstandards und den geltenden ägyptischen Vorschriften durchgeführt.",
        "Wasseraktivitäten wie Schnorcheln, Tauchen und Bootsfahrten sowie Landaktivitäten wie Quadfahren und Wüstensafaris sind mit unvermeidbaren Risiken verbunden. Gäste nehmen auf eigenes Risiko teil und müssen jederzeit die Sicherheitsunterweisung und Anweisungen des Reiseleiters oder der Crew befolgen.",
        "Daily Red Sea haftet nicht für Verletzungen, Verluste, Erkrankungen oder Schäden, die durch Missachtung von Sicherheitsanweisungen, bei der Buchung nicht angegebene Vorerkrankungen oder Ereignisse außerhalb unseres zumutbaren Einflusses entstehen, einschließlich Wetter, Naturereignissen, Handlungen Dritter oder höherer Gewalt.",
        "Routen, Ablauf und Zeiten können vom lokalen Anbieter aus Sicherheits- oder Betriebsgründen angepasst werden. Über wesentliche Änderungen informieren wir dich so früh wie möglich.",
        "Diese Bedingungen schließen keine Haftung aus, die nach geltendem Recht nicht ausgeschlossen werden darf.",
      ] },
    ],
  },
  ru: {
    legal: "Правовая информация",
    title: "Условия бронирования",
    intro: "Бронируя экскурсию, трансфер или другое мероприятие у Daily Red Sea, вы соглашаетесь с приведёнными ниже условиями. Они действуют вместе со специальными условиями, указанными на странице конкретной экскурсии.",
    back: "На главную",
    sections: [
      { title: "Бронирование и подтверждение", paragraphs: ["Заявка, отправленная через сайт или WhatsApp, считается подтверждённой только после сообщения от нашей команды с окончательной стоимостью, деталями трансфера и способом оплаты. Пожалуйста, внимательно проверьте подтверждение и сразу сообщите нам, если какие-либо данные указаны неверно."] },
      { title: "Цены и оплата", paragraphs: ["Цены указаны за человека или за бронирование в выбранной валюте и включают услуги, перечисленные на странице экскурсии. Если не указано иное, оплата производится наличными по прибытии. Для некоторых экскурсий может потребоваться онлайн-предоплата или депозит; об этом будет ясно сообщено до подтверждения. Мы не добавляем скрытых сборов к указанной цене."] },
      { title: "Трансфер и участие", paragraphs: ["Время трансфера является ориентировочным и подтверждается через WhatsApp накануне или утром в день мероприятия. Оно может измениться из-за дорожной ситуации, погоды или расположения отеля. Для некоторых мероприятий действуют требования по возрасту, здоровью, умению плавать или физической подготовке. Ознакомьтесь с ними до бронирования и заранее сообщите нам о важных медицинских особенностях."] },
      { title: "Изменение бронирования", paragraphs: ["Если необходимо изменить дату, размер группы или детали трансфера, свяжитесь с нами через WhatsApp как можно раньше. Изменения зависят от наличия мест и могут быть невозможны незадолго до даты мероприятия."] },
      { title: "Отмена и возврат средств", id: "cancellations", paragraphs: [
        "Бесплатная отмена: Если на странице экскурсии не указан другой срок, при отмене не позднее чем за 24 часа до запланированного времени трансфера вы имеете право на полный возврат. При оплате наличными по прибытии плата не взимается.",
        "Поздняя отмена: При отмене менее чем за 24 часа до трансфера или при неявке возврат не предоставляется, поскольку местные поставщики резервируют место и несут расходы.",
        "Специальные условия экскурсии: Для некоторых мероприятий, например частных туров, лодок с ограниченной вместимостью или услуг сторонних операторов, может действовать более длительный срок отмены либо бронирование может быть невозвратным. Это всегда указывается на странице экскурсии до бронирования.",
        "Отмена с нашей стороны: Если мы или местный поставщик вынуждены отменить или перенести мероприятие из-за погоды, безопасности, недостаточного количества участников или операционных причин, вам предложат полный возврат либо перенос на другую дату или мероприятие.",
        "Как отменить: Как можно раньше отправьте нам номер бронирования через WhatsApp. Мы подтвердим право на возврат и, если он положен, вернём средства исходным способом оплаты в течение указанного количества рабочих дней, например 5–7 дней. При оплате наличными по прибытии плата не взимается.",
      ] },
      { title: "Ответственность", paragraphs: [
        "Daily Red Sea работает как платформа бронирования и координации, связывая путешественников с местными операторами, экипажами, гидами и водителями в Хургаде, которые непосредственно оказывают услуги.",
        "Экскурсии, морские прогулки, сафари и трансферы выполняются независимыми местными поставщиками в соответствии с их правилами безопасности и применимыми нормами Египта.",
        "Водные мероприятия, включая снорклинг, дайвинг и морские прогулки, а также наземные мероприятия, включая поездки на квадроциклах и сафари, связаны с естественным риском. Гости участвуют на свой риск и обязаны всегда соблюдать инструктаж и указания гида или экипажа.",
        "Daily Red Sea не несёт ответственности за травмы, утрату имущества, заболевания или ущерб, возникшие из-за несоблюдения инструкций, не сообщённых при бронировании заболеваний либо обстоятельств вне нашего разумного контроля, включая погоду, природные явления, действия третьих лиц и форс-мажор.",
        "Маршрут, программа и время могут быть изменены местным оператором по соображениям безопасности или по операционным причинам. Мы постараемся сообщить о существенных изменениях как можно раньше.",
        "Ничто в настоящих условиях не исключает ответственность, которую нельзя исключить по применимому законодательству.",
      ] },
    ],
  },
};

function Paragraph({ children }: { children: string }) {
  const separator = children.indexOf(":");
  if (separator < 0) return <p className="leading-8">{children}</p>;
  return <p className="leading-8"><strong className="text-slate-900">{children.slice(0, separator + 1)}</strong>{children.slice(separator + 1)}</p>;
}

export default function TermsConditionsPage({ locale = "en" }: { locale?: TermsLocale }) {
  const content = copy[locale];
  return (
    <main className="mx-auto max-w-5xl px-6 py-24 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{content.legal}</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900">{content.title}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">{content.intro}</p>
        <div className="mt-10 space-y-7 text-slate-700">
          {content.sections.map((section) => <section key={section.title} id={section.id} className={section.id ? "scroll-mt-28" : undefined}>
            <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
            <div className="mt-3 space-y-3">{section.paragraphs.map((paragraph) => <Paragraph key={paragraph}>{paragraph}</Paragraph>)}</div>
          </section>)}
        </div>
        <Link href={localePath(locale)} className="mt-10 inline-flex text-sm font-semibold text-cyan-700">← {content.back}</Link>
      </div>
    </main>
  );
}
