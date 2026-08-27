"use client";

import { type FormEvent, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MessageCircle, ShoppingCart, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { tours } from "@/data/tours";
import { localePath } from "@/lib/i18n";
import { confirmationStorageKey } from "@/lib/booking-confirmation";
import { trackEvent } from "@/lib/analytics";
import ShareTripButton from "@/components/share/ShareTripButton";

export default function CartCheckout() {
  const idempotencyKey = useRef<string | null>(null);
  const { items, removeItem, clearCart, total } = useCart();
  const { language, formatPrice } = useSiteSettings();
  const router = useRouter();
  const de = language === "de";
  const ru = language === "ru";
  const ar = language === "ar";
  const pl = language === "pl";
  const zh = language === "zh";
  const chinese: Record<string, string> = {
    "Confirm that every diver has a valid diving license.": "请确认每位潜水员都持有有效潜水证。", "Confirm that every quad participant is at least 9 years old.": "请确认每位四轮摩托参与者均年满 9 岁。", "Your trip cart is empty": "您的行程购物车为空", "Choose a tour, select its date and travelers, then add it to your cart.": "选择旅游项目、日期和出行人数，然后添加到购物车。", "Explore tours": "探索旅游项目", "Multi-trip booking": "多行程预订", "Your trip cart": "您的行程购物车", "adults": "位成人", "youth": "位儿童", "infants": "位婴儿", "Remove trip": "移除行程", "Combined total": "合计", "Complete one booking": "完成一个预订", "All trips will use one booking reference, email and PDF summary.": "所有行程将共用一个预订编号、电子邮件和 PDF 摘要。", "Full name": "姓名", "Email": "电子邮箱", "WhatsApp number": "WhatsApp 号码", "Hotel / pickup location": "酒店／接送地点", "Every diver has a valid diving license and will bring proof.": "每位潜水员均持有有效潜水证，并会携带证明。", "Every quad participant is at least 9 years old.": "每位四轮摩托参与者均年满 9 岁。", "Special requests": "特别要求", "By submitting, you agree to our": "提交即表示您同意我们的", "terms and cancellation policy": "条款和取消政策", "Sending…": "正在提交…", "Book all trips": "预订所有行程", "Multiple times": "多个时间", "See the attached trip summary": "请查看附带的行程摘要",
  };
  const polish: Record<string, string> = {
    "Confirm that every diver has a valid diving license.": "Potwierdź, że każdy nurek posiada ważne uprawnienia nurkowe.", "Confirm that every quad participant is at least 9 years old.": "Potwierdź, że każdy uczestnik wycieczki quadami ma ukończone 9 lat.", "Your trip cart is empty": "Twój koszyk wycieczek jest pusty", "Choose a tour, select its date and travelers, then add it to your cart.": "Wybierz wycieczkę, jej datę i liczbę uczestników, a następnie dodaj ją do koszyka.", "Explore tours": "Przeglądaj wycieczki", "Multi-trip booking": "Rezerwacja kilku wycieczek", "Your trip cart": "Twój koszyk wycieczek", "adults": "dorosłych", "youth": "dzieci", "infants": "niemowląt", "Remove trip": "Usuń wycieczkę", "Combined total": "Razem", "Complete one booking": "Dokończ jedną rezerwację", "All trips will use one booking reference, email and PDF summary.": "Wszystkie wycieczki będą miały wspólny numer rezerwacji, e-mail i podsumowanie PDF.", "Full name": "Imię i nazwisko", "Email": "E-mail", "WhatsApp number": "Numer WhatsApp", "Hotel / pickup location": "Hotel / miejsce odbioru", "Every diver has a valid diving license and will bring proof.": "Każdy nurek posiada ważne uprawnienia nurkowe i zabierze ze sobą dowód.", "Every quad participant is at least 9 years old.": "Każdy uczestnik wycieczki quadami ma ukończone 9 lat.", "Special requests": "Specjalne życzenia", "By submitting, you agree to our": "Wysyłając formularz, akceptujesz nasze", "terms and cancellation policy": "warunki i zasady anulowania", "Sending…": "Wysyłanie…", "Book all trips": "Zarezerwuj wszystkie wycieczki", "Multiple times": "Różne godziny", "See the attached trip summary": "Zobacz załączone podsumowanie wycieczek",
  };
  const tr = (en: string, deText: string, ruText: string, arText = en) => de ? deText : ru ? ruText : ar ? arText : pl ? polish[en] || en : zh ? chinese[en] || en : en;
  const tripBookingLabel = (count: number) => de
    ? `${count} Ausflüge`
    : ru
    ? `Бронирование: ${count} поездки`
    : ar
    ? `حجز ${count} رحلات`
    : pl
    ? `Rezerwacja ${count} wycieczek`
    : zh
    ? `${count} 项行程预订`
    : `${count} trip booking`;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hotel, setHotel] = useState("");
  const [message, setMessage] = useState("");
  const [divingConfirmed, setDivingConfirmed] = useState(false);
  const [quadConfirmed, setQuadConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const requiresDivingLicense = items.some((item) => item.requiresDivingLicense);
  const requiresQuadMinimumAge = items.some((item) => item.requiresQuadMinimumAge);
  const cartCurrencies = [...new Set(items.map((item) => item.currency))];
  const cartCurrency = cartCurrencies[0] || "USD";
  const cartDestinations = [...new Set(items.map((item) => item.destinationSlug))];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;
    if (cartCurrencies.length > 1) return setError("Please book trips in different settlement currencies separately.");
    if (requiresDivingLicense && !divingConfirmed) return setError(tr("Confirm that every diver has a valid diving license.", "Bestätige, dass jeder Taucher einen gültigen Tauchschein besitzt.", "Подтвердите наличие действующего сертификата у каждого дайвера.", "أكد أن كل غواص يحمل رخصة غوص سارية."));
    if (requiresQuadMinimumAge && !quadConfirmed) return setError(tr("Confirm that every quad participant is at least 9 years old.", "Bestätige, dass alle Quad-Teilnehmer mindestens 9 Jahre alt sind.", "Подтвердите, что всем участникам тура на квадроциклах не менее 9 лет.", "أكد أن عمر كل مشارك في رحلة الكواد لا يقل عن 9 سنوات."));
    setSubmitting(true);
    setError("");
    try {
      idempotencyKey.current ||= crypto.randomUUID();
      const firstItem = items[0];
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          type: "tour",
          locale: language,
          customerName: name.trim(),
          customerEmail: email.trim(),
          phone: phone.trim(),
          hotel: hotel.trim(),
          date: firstItem.date,
          time: firstItem.time,
          tourName: `Multi-trip booking (${items.length})`,
          tourSlug: "multi-trip",
          location: cartDestinations.map((slug) => slug === "marsa-alam" ? "Marsa Alam" : slug === "jeddah" ? "Jeddah" : "Hurghada").join(" and "),
          duration: `${items.length} trips`,
          message,
          adults: 0,
          youth: 0,
          infants: 0,
          cartItems: items.map((item) => ({
            tourSlug: item.tourSlug,
            date: item.date,
            time: item.time,
            adults: item.adults,
            youth: item.youth,
            infants: item.infants,
            extras: item.extras,
            selectedBoatOption: item.selectedBoatOption,
            extraQuantities: item.extraQuantities,
            transferRequired: item.transferRequired,
            transferArea: item.transferArea,
            divingLicenseConfirmed: item.requiresDivingLicense ? divingConfirmed : true,
            quadMinimumAgeConfirmed: item.requiresQuadMinimumAge ? quadConfirmed : true,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Cart booking failed.");
      trackEvent("booking_complete", { transaction_id: data.reference, value: total, currency: cartCurrencies[0] || "USD", item_name: "Multi-trip cart", booking_type: "tour" });
      if (!data.whatsappSent && data.whatsappUrl) window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      window.sessionStorage.setItem(confirmationStorageKey(data.reference), JSON.stringify({
        reference: data.reference,
        customerName: name.trim(),
        serviceName: tripBookingLabel(items.length),
        date: items.map((item) => item.date).join(", "),
        time: tr("Multiple times", "Mehrere Uhrzeiten", "Несколько времён", "مواعيد متعددة"),
        travelers: tr("See the attached trip summary", "Siehe beigefügte Reiseübersicht", "См. приложенную сводку", "راجع ملخص الرحلات المرفق"),
        total: formatPrice(String(total), cartCurrency),
        customerEmailSent: Boolean(data.customerEmailSent),
        whatsappSent: Boolean(data.whatsappSent),
        bookingConfirmationPdf: String(data.bookingConfirmationPdf || ""),
      }));
      clearCart();
      router.push(`${localePath(language, "/booking/confirmation")}?reference=${encodeURIComponent(data.reference)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Cart booking failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!items.length) {
    return <section className="mx-auto max-w-3xl px-6 pb-24 pt-32 text-center"><ShoppingCart className="mx-auto text-slate-300" size={64}/><h1 className="mt-6 text-4xl font-black text-slate-950">{tr("Your trip cart is empty", "Dein Reisewarenkorb ist leer", "Корзина поездок пуста", "سلة الرحلات فارغة")}</h1><p className="mt-4 text-slate-600">{tr("Choose a tour, select its date and travelers, then add it to your cart.", "Wähle einen Ausflug, Datum und Reisende und füge ihn zum Warenkorb hinzu.", "Выберите экскурсию, дату и гостей, затем добавьте её в корзину.", "اختر رحلة وتاريخها وعدد المسافرين ثم أضفها إلى السلة.")}</p><Link href={localePath(language, "/tours")} className="mt-8 inline-flex rounded-xl bg-blue-700 px-6 py-4 font-bold text-white">{tr("Explore tours", "Ausflüge entdecken", "Смотреть экскурсии", "استكشف الرحلات")}</Link></section>;
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-32">
      <p className="font-semibold uppercase tracking-[0.24em] text-blue-600">{tr("Multi-trip booking", "Mehrere Ausflüge buchen", "Бронирование нескольких поездок", "حجز رحلات متعددة")}</p>
      <h1 className="mt-3 text-4xl font-black text-slate-950 sm:text-5xl">{tr("Your trip cart", "Dein Reisewarenkorb", "Корзина поездок", "سلة الرحلات")}</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {items.map((item) => {
            const tour = tours.find((entry) => entry.slug === item.tourSlug);
            return <article key={item.id} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[140px_1fr_auto] sm:items-center">
              <div className="relative h-28 overflow-hidden rounded-2xl"><Image src={tour?.image || "/images/placeholders/sea-activity.svg"} alt="" fill sizes="140px" className="object-cover"/></div>
              <div><h2 className="font-black text-slate-950">{item.tourName}</h2><p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><CalendarDays size={16}/>{item.date} · {item.time}</p><p className="mt-1 text-sm text-slate-600">{item.adults} {tr("adults", "Erwachsene", "взр.", "بالغين")}{item.youth ? ` · ${item.youth} ${tr("youth", "Kinder", "дет.", "أطفال")}` : ""}{item.infants ? ` · ${item.infants} ${tr("infants", "Kleinkinder", "млад.", "رضّع")}` : ""}</p><p className="mt-2 font-black text-blue-700">{formatPrice(String(item.subtotal), item.currency)}</p></div>
              <div className="flex items-center gap-2">{item.tourSlug === "jeddah-yacht-sunset-cruise" ? <ShareTripButton locale={language} tourSlug={item.tourSlug} date={item.date} compact/> : null}<button type="button" onClick={() => removeItem(item.id)} aria-label={tr("Remove trip", "Ausflug entfernen", "Удалить поездку", "حذف الرحلة")} className="rounded-xl border border-rose-200 p-3 text-rose-600 hover:bg-rose-50"><Trash2 size={19}/></button></div>
            </article>;
          })}
          <div className="flex items-center justify-between rounded-2xl bg-slate-950 p-6 text-white"><span className="font-bold">{tr("Combined total", "Gesamtpreis", "Общая сумма", "المجموع الكلي")}</span><strong className="text-3xl">{formatPrice(String(total), cartCurrency)}</strong></div>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">{tr("Complete one booking", "Eine Buchung abschließen", "Оформить одно бронирование", "إكمال حجز واحد")}</h2>
          <p className="text-sm leading-6 text-slate-600">{tr("All trips will use one booking reference, email and PDF summary.", "Alle Ausflüge erhalten eine gemeinsame Buchungsnummer, E-Mail und PDF-Übersicht.", "Для всех поездок будет один номер бронирования, письмо и PDF.", "ستحصل جميع الرحلات على رقم حجز واحد ورسالة بريد وملخص PDF واحد.")}</p>
          <RequiredInput label={tr("Full name", "Vollständiger Name", "Полное имя", "الاسم الكامل")} value={name} onChange={setName} autoComplete="name"/>
          <RequiredInput label={tr("Email", "E-Mail", "Электронная почта", "البريد الإلكتروني")} value={email} onChange={setEmail} type="email" autoComplete="email"/>
          <RequiredInput label={tr("WhatsApp number", "WhatsApp-Nummer", "Номер WhatsApp", "رقم واتساب")} value={phone} onChange={setPhone} type="tel" autoComplete="tel"/>
          <RequiredInput label={tr("Hotel / pickup location", "Hotel / Abholort", "Отель / место встречи", "الفندق / مكان الاستلام")} value={hotel} onChange={setHotel}/>
          {requiresDivingLicense ? <Confirmation checked={divingConfirmed} onChange={setDivingConfirmed} text={tr("Every diver has a valid diving license and will bring proof.", "Jeder Taucher besitzt einen gültigen Tauchschein und bringt den Nachweis mit.", "У каждого дайвера есть действующий сертификат, который он возьмёт с собой.", "يحمل كل غواص رخصة غوص سارية وسيحضر إثباتها.")}/> : null}
          {requiresQuadMinimumAge ? <Confirmation checked={quadConfirmed} onChange={setQuadConfirmed} text={tr("Every quad participant is at least 9 years old.", "Alle Quad-Teilnehmer sind mindestens 9 Jahre alt.", "Всем участникам тура на квадроциклах не менее 9 лет.", "عمر كل مشارك في رحلة الكواد 9 سنوات على الأقل.")}/> : null}
          <label className="block text-sm font-bold text-slate-800">{tr("Special requests", "Besondere Wünsche", "Особые пожелания", "طلبات خاصة")}<textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 h-24 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/></label>
          <p className="text-xs leading-5 text-slate-500">{tr("By submitting, you agree to our", "Mit dem Absenden stimmst du unseren", "Отправляя заявку, вы соглашаетесь с", "بإرسال الطلب، فإنك توافق على")} <Link href={localePath(language, "/terms-conditions")} className="font-bold text-blue-700 underline">{tr("terms and cancellation policy", "AGB und Stornierungsbedingungen", "условиями и правилами отмены", "الشروط وسياسة الإلغاء")}</Link>.</p>
          {error ? <p role="alert" className="text-sm font-semibold text-rose-600">{error}</p> : null}
          <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-4 font-bold text-white disabled:opacity-60">{submitting ? tr("Sending…", "Wird gesendet…", "Отправка…", "جارٍ الإرسال…") : `${tr("Book all trips", "Alle Ausflüge buchen", "Забронировать все поездки", "احجز جميع الرحلات")} · ${formatPrice(String(total), cartCurrency)}`} <MessageCircle size={18}/></button>
        </form>
      </div>
    </section>
  );
}

function RequiredInput({ label, value, onChange, type = "text", autoComplete }: { label: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string }) {
  return <label className="block text-sm font-bold text-slate-800">{label} <span className="text-rose-600">*</span><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/></label>;
}

function Confirmation({ checked, onChange, text }: { checked: boolean; onChange: (value: boolean) => void; text: string }) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><input required type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 accent-amber-700"/><span>{text} <strong className="text-rose-600">*</strong></span></label>;
}
