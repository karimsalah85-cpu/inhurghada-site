"use client";

import { type FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  CircleMinus,
  CirclePlus,
  Clock3,
  Hotel,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { trackEvent } from "@/lib/analytics";
import { localePath } from "@/lib/i18n";
import { confirmationStorageKey } from "@/lib/booking-confirmation";

type ParticipantPricing = { adults: number; youth?: number; infants?: number };

type BookingFormProps = {
  tourName: string;
  tourSlug: string;
  price?: string;
  duration?: string;
  location?: string;
  participantPricing?: ParticipantPricing;
  availableTimes?: string[];
};

const tomorrow = () => {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function Counter({ label, description, value, onChange }: { label: string; description: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <button type="button" aria-label={`Remove ${label}`} onClick={() => onChange(Math.max(0, value - 1))} className="p-2.5 text-slate-700 hover:bg-slate-100"><CircleMinus size={18} /></button>
        <span className="w-9 text-center font-bold text-slate-900">{value}</span>
        <button type="button" aria-label={`Add ${label}`} disabled={value >= 30} onClick={() => onChange(Math.min(30, value + 1))} className="p-2.5 text-blue-700 hover:bg-blue-50 disabled:opacity-40"><CirclePlus size={18} /></button>
      </div>
    </div>
  );
}

const upsells: Record<string, { id: string; price: number; en: string; de: string; ru: string }[]> = {
  "full-day-diving": [{ id: "diving-equipment", price: 30, en: "Complete diving equipment rental", de: "Komplette Tauchausrüstung mieten", ru: "Аренда полного комплекта снаряжения для дайвинга" }],
  "luxor-private-day-trip": [{ id: "tutankhamun-ticket", price: 30, en: "Entry to Tutankhamun's tomb", de: "Eintritt zum Grab Tutanchamuns", ru: "Входной билет в гробницу Тутанхамона" }],
};

const arabicBookingCopy: Record<string, string> = {
  "From": "ابتداءً من", "person": "للشخص", "Clear local price · pickup confirmed after booking": "سعر واضح · يتم تأكيد الاستلام بعد الحجز",
  "Date": "التاريخ", "Time": "الوقت", "Select your package": "اختر الباقة", "Adults": "البالغون", "each": "لكل شخص",
  "Youth (9–10)": "الأطفال (9–10)", "Youth (4–10)": "الأطفال (4–10)", "Infants": "الرضع", "Free of charge": "مجاناً",
  "Book now": "احجز الآن", "Tell us about yourself": "بياناتك", "Required field": "حقل مطلوب", "Full name": "الاسم الكامل",
  "Enter your full name": "أدخل الاسم الكامل", "Email address": "البريد الإلكتروني", "WhatsApp number": "رقم واتساب",
  "Pickup location": "مكان الاستلام", "Hotel name or full pickup address": "اسم الفندق أو عنوان الاستلام الكامل",
  "Required so we can confirm your pickup on WhatsApp.": "مطلوب لتأكيد الاستلام عبر واتساب.", "Special requests": "طلبات خاصة",
  "optional": "اختياري", "Anything we should know?": "هل توجد معلومات مهمة؟", "Before booking, please review our": "قبل الحجز، راجع",
  "cancellation policy": "سياسة الإلغاء", "By submitting, you agree to our terms and conditions.": "بإرسال الطلب، توافق على الشروط والأحكام.",
  "Sending booking…": "جارٍ إرسال الحجز…", "Confirm booking": "تأكيد الحجز", "Change date or travelers": "تغيير التاريخ أو المسافرين",
  "Please select at least one adult.": "اختر شخصاً بالغاً واحداً على الأقل.",
};

export default function BookingForm({ tourName, tourSlug, price, duration, location, participantPricing, availableTimes }: BookingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatPrice, language } = useSiteSettings();
  const de = language === "de";
  const ru = language === "ru";
  const ar = language === "ar";
  const tr = (en: string, deText: string, ruText: string, arText = arabicBookingCopy[en] || en) => de ? deText : ru ? ruText : ar ? arText : en;
  const adultPrice = participantPricing?.adults ?? Number(price || 0);
  const youthPrice = participantPricing?.youth;
  const infantPrice = participantPricing?.infants;
  const times = availableTimes?.length ? availableTimes : ["Time confirmed by WhatsApp"];
  const [step, setStep] = useState<"select" | "checkout">("select");
  const [adults, setAdults] = useState(Math.min(30, Math.max(1, Number(searchParams.get("guests")) || 1)));
  const [youth, setYouth] = useState(0);
  const [infants, setInfants] = useState(0);
  const [date, setDate] = useState(searchParams.get("date") || tomorrow());
  const [time, setTime] = useState(times[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hotel, setHotel] = useState("");
  const [guideLanguage, setGuideLanguage] = useState("English");
  const [message, setMessage] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [divingLicenseConfirmed, setDivingLicenseConfirmed] = useState(false);
  const [quadMinimumAgeConfirmed, setQuadMinimumAgeConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [website, setWebsite] = useState("");

  const extraOptions = upsells[tourSlug] || [];
  const requiresDivingLicense = tourSlug === "full-day-diving";
  const requiresQuadMinimumAge = ["quad-safari-morning", "quad-safari-sunset"].includes(tourSlug);
  const extrasTotal = extraOptions.filter((option) => selectedExtras.includes(option.id)).reduce((sum, option) => sum + option.price, 0);
  const total = adults * adultPrice + youth * (youthPrice ?? adultPrice) + infants * (infantPrice ?? 0) + extrasTotal;
  const travelerText = de
    ? `${adults} Erwachsene${youthPrice !== undefined ? ` · ${youth} Kinder` : ""}${infantPrice !== undefined ? ` · ${infants} Kleinkinder` : ""}`
    : ru
      ? `${adults} взр.${youthPrice !== undefined ? ` · ${youth} дет.` : ""}${infantPrice !== undefined ? ` · ${infants} младен.` : ""}`
    : `${adults} adult${adults === 1 ? "" : "s"}${youthPrice !== undefined ? ` · ${youth} youth` : ""}${infantPrice !== undefined ? ` · ${infants} infant${infants === 1 ? "" : "s"}` : ""}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adults) { setError(tr("Please select at least one adult.", "Bitte wähle mindestens einen Erwachsenen.", "Выберите хотя бы одного взрослого.")); return; }
    if (requiresDivingLicense && !divingLicenseConfirmed) {
      setError(tr("Every diver must hold a valid diving license for this booking.", "Für diesen Tauchausflug muss jeder Taucher einen gültigen Tauchschein besitzen.", "Для этого погружения у каждого дайвера должен быть действующий сертификат."));
      return;
    }
    if (requiresQuadMinimumAge && !quadMinimumAgeConfirmed) {
      setError(tr("Every quad-tour participant must be at least 9 years old.", "Alle Teilnehmer der Quad-Tour müssen mindestens 9 Jahre alt sein.", "Каждому участнику тура на квадроциклах должно быть не менее 9 лет."));
      return;
    }
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tour", locale: ar ? "ar" : ru ? "ru" : de ? "de" : "en", customerName: name.trim(), phone: phone.trim(), customerEmail: email.trim(),
          tourName, tourSlug, extras: selectedExtras, location: location || "Hurghada", duration: duration || "Please confirm",
          price: `${formatPrice(String(total))} total`, date, guests: travelerText, hotel,
          message: `Time: ${time}\nGuide language: ${guideLanguage}${requiresDivingLicense ? "\nValid diving license: confirmed for every diver" : ""}${requiresQuadMinimumAge ? "\nQuad minimum age 9: confirmed for every participant" : ""}${selectedExtras.length ? `\nOptional extras: ${extraOptions.filter((option) => selectedExtras.includes(option.id)).map((option) => de ? option.de : ru ? option.ru : option.en).join(", ")}` : ""}${message ? `\nCustomer note: ${message}` : ""}`,
          adults, youth, infants,
          divingLicenseConfirmed,
          quadMinimumAgeConfirmed,
          website,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Booking submission failed.");
      trackEvent("booking_complete", { transaction_id: data.reference, value: total, currency: "USD", item_name: tourName, booking_type: "tour" });
      if (!data.whatsappSent && data.whatsappUrl) window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      window.sessionStorage.setItem(confirmationStorageKey(data.reference), JSON.stringify({
        reference: data.reference,
        customerName: name.trim(),
        serviceName: tourName,
        date,
        time,
        travelers: travelerText,
        total: formatPrice(String(total)),
        customerEmailSent: Boolean(data.customerEmailSent),
        whatsappSent: Boolean(data.whatsappSent),
        bookingConfirmationPdf: String(data.bookingConfirmationPdf || ""),
      }));
      router.push(`${localePath(language, "/booking/confirmation")}?reference=${encodeURIComponent(data.reference)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Booking submission failed.");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-500">{tr("From", "Ab", "От")} <span className="text-2xl font-black text-slate-950">{formatPrice(String(adultPrice))}</span> / {tr("person", "Person", "человека")}</p><p className="mt-1 text-sm font-medium text-emerald-700">{tr("Clear local price · pickup confirmed after booking", "Klarer lokaler Preis · Abholung nach Buchung bestätigt", "Понятная местная цена · трансфер подтверждается после бронирования")}</p></div><ShieldCheck className="text-emerald-600" /></div>
      {step === "select" ? <>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-slate-700">{tr("Date", "Datum", "Дата")} <RequiredMark/><div className="relative mt-1"><CalendarDays className="absolute left-3 top-3 text-slate-400" size={18}/><input required type="date" min={tomorrow()} value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></div></label>
          <label className="block text-sm font-bold text-slate-700">{tr("Time", "Uhrzeit", "Время")} <RequiredMark/><div className="relative mt-1"><Clock3 className="absolute left-3 top-3 text-slate-400" size={18}/><select required value={time} onChange={(event) => setTime(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-10 py-3 font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">{times.map((option) => <option key={option}>{ru && option === "Time confirmed by WhatsApp" ? "Время подтверждается в WhatsApp" : option}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400" size={18}/></div></label>
        </div>
        {requiresDivingLicense ? <div className="mt-5 rounded-2xl border border-cyan-300 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950"><p className="font-black">{de ? "Gültiger Tauchschein erforderlich" : "Valid diving license required"}</p><p className="mt-1">{de ? "Jeder Taucher muss einen gültigen Tauchschein besitzen und den Nachweis mitbringen." : "Every diver must hold a valid scuba diving license and bring proof on the trip."}</p></div> : null}
        {requiresQuadMinimumAge ? <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-black">{de ? "Mindestalter: 9 Jahre" : "Minimum age: 9 years"}</p><p className="mt-1">{de ? "Alle Teilnehmer müssen am Tag der Tour mindestens 9 Jahre alt sein." : "Every participant must be at least 9 years old on the day of the tour."}</p></div> : null}
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 px-4"><p className="pt-4 text-sm font-bold text-slate-900">{tr("Select your package", "Paket auswählen", "Выберите пакет")}</p><Counter label={tr("Adults", "Erwachsene", "Взрослые")} description={`${formatPrice(String(adultPrice))} ${tr("each", "pro Person", "за человека")}`} value={adults} onChange={setAdults}/>{youthPrice !== undefined && <Counter label={requiresQuadMinimumAge ? tr("Youth (9–10)", "Jugendliche (9–10)", "Дети (9–10)") : tr("Youth (4–10)", "Kinder (4–10)", "Дети (4–10)")} description={`${formatPrice(String(youthPrice))} ${tr("each", "pro Kind", "за ребёнка")}`} value={youth} onChange={setYouth}/>} {infantPrice !== undefined && <Counter label={tr("Infants", "Kleinkinder", "Младенцы")} description={tr("Free of charge", "Kostenlos", "Бесплатно")} value={infants} onChange={setInfants}/>}</div>
        {extraOptions.length ? <fieldset className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4"><legend className="px-1 text-sm font-black text-slate-900">{de ? "Optionale Extras" : "Optional extras"}</legend>{extraOptions.map((option) => <label key={option.id} className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm"><span className="flex items-center gap-3"><input type="checkbox" checked={selectedExtras.includes(option.id)} onChange={(event) => setSelectedExtras((items) => event.target.checked ? [...items, option.id] : items.filter((item) => item !== option.id))} className="h-4 w-4 accent-blue-600" />{de ? option.de : option.en}</span><strong>+{formatPrice(String(option.price))}</strong></label>)}</fieldset> : null}
        <div className="mt-5 flex items-end justify-between border-t pt-5"><div><p className="font-bold text-slate-900">{de ? "Gesamtpreis" : "Total"}</p><p className="text-xs text-slate-500">{de ? "Barzahlung bei Ankunft · keine Online-Zahlung" : "Cash on arrival · no online payment"}</p></div><p className="text-3xl font-black text-blue-700">{formatPrice(String(total))}</p></div>
        <button type="button" onClick={() => { if (!adults) return setError(tr("Please select at least one adult.", "Bitte wähle mindestens einen Erwachsenen.", "Выберите хотя бы одного взрослого.")); trackEvent("booking_start", { value: total, currency: "USD", item_name: tourName, booking_type: "tour" }); setStep("checkout"); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700">{tr("Book now", "Jetzt buchen", "Забронировать")} <Users size={18}/></button>
        {error && <p role="alert" className="mt-3 text-center text-sm text-rose-600">{error}</p>}
      </> : <form onSubmit={submit} aria-busy={submitting} className="mt-6 space-y-4">
        <input name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="font-bold text-slate-900">{tourName}</p><p className="mt-1 text-sm text-slate-600">{date} {de ? "um" : "at"} {time} · {travelerText}</p><p className="mt-2 font-black text-blue-700">{formatPrice(String(total))} · {de ? "Barzahlung bei Ankunft" : "Cash on arrival"}</p></div>
        <p className="border-b pb-2 text-lg font-black text-slate-950">{tr("Tell us about yourself", "Deine Angaben", "Ваши данные")}</p>
        <p className="text-xs text-slate-500"><RequiredMark/> {tr("Required field", "Pflichtfeld", "Обязательное поле")}</p>
        <label className="block text-sm font-bold text-slate-800">{tr("Full name", "Vollständiger Name", "Полное имя")} <RequiredMark/><input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder={tr("Enter your full name", "Vollständigen Namen eingeben", "Введите имя и фамилию")} /></label>
        <label className="block text-sm font-bold text-slate-800">{tr("Email address", "E-Mail-Adresse", "Электронная почта")} <RequiredMark/><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="you@example.com" /></label>
        <label className="block text-sm font-bold text-slate-800">{tr("WhatsApp number", "WhatsApp-Nummer", "Номер WhatsApp")} <RequiredMark/><input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="+20 103 080 9150" /></label>
        <label className="block text-sm font-bold text-slate-800">{tr("Pickup location", "Abholort", "Место трансфера")} <RequiredMark/><div className="relative mt-1"><Hotel className="absolute left-3 top-3 text-slate-400" size={18}/><input required value={hotel} onChange={(event) => setHotel(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder={tr("Hotel name or full pickup address", "Hotelname oder vollständige Abholadresse", "Название отеля или полный адрес")} /></div><span className="mt-1 block text-xs font-normal text-slate-500">{tr("Required so we can confirm your pickup on WhatsApp.", "Erforderlich, damit wir deine Abholung per WhatsApp bestätigen können.", "Нужно для подтверждения трансфера в WhatsApp.")}</span></label>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-bold">{de ? "Ausweis oder Reisepass vor dem Ausflug erforderlich" : "ID or passport required before the trip"}</p><p className="mt-1">{de ? "Für die Reisegenehmigung ist ein gültiger Ausweis oder Reisepass erforderlich. Bitte halte ihn vor dem Ausflug bereit." : "A valid ID or passport is mandatory for trip permit reasons. Please make sure you have it available before your experience."}</p></div>
        {requiresDivingLicense ? <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cyan-300 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950"><input type="checkbox" required checked={divingLicenseConfirmed} onChange={(event) => setDivingLicenseConfirmed(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-cyan-700" /><span><strong>{de ? "Gültiger Tauchschein erforderlich" : "Valid diving license required"} <RequiredMark/></strong><span className="mt-1 block">{de ? "Ich bestätige, dass jeder Taucher einen gültigen Tauchschein besitzt und den Nachweis zum Ausflug mitbringt." : "I confirm that every diver holds a valid scuba diving license and will bring proof on the trip."}</span></span></label> : null}
        {requiresQuadMinimumAge ? <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><input type="checkbox" required checked={quadMinimumAgeConfirmed} onChange={(event) => setQuadMinimumAgeConfirmed(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-amber-700" /><span><strong>{de ? "Mindestalter: 9 Jahre" : "Minimum age: 9 years"} <RequiredMark/></strong><span className="mt-1 block">{de ? "Ich bestätige, dass alle Teilnehmer mindestens 9 Jahre alt sind." : "I confirm that every participant is at least 9 years old."}</span></span></label> : null}
        <label className="block text-sm font-bold text-slate-800">{de ? "Bevorzugte Sprache des Reiseführers" : "Preferred guide language"}<select value={guideLanguage} onChange={(event) => setGuideLanguage(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option>English</option><option>Arabic</option><option>German</option><option>Russian</option><option>Polish</option><option>Chinese</option></select></label>
        <label className="block text-sm font-bold text-slate-800">{tr("Special requests", "Besondere Wünsche", "Особые пожелания")} <span className="font-normal text-slate-500">({tr("optional", "optional", "необязательно")})</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 h-20 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder={tr("Anything we should know?", "Gibt es etwas, das wir wissen sollten?", "Что нам нужно знать?")} /></label>
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">{tr("Before booking, please review our", "Bitte lies vor der Buchung unsere", "Перед бронированием ознакомьтесь с")} <Link href={localePath(language, "/terms-conditions#cancellations")} target="_blank" className="font-bold text-blue-700 underline">{tr("cancellation policy", "Stornierungsbedingungen", "правилами отмены")}</Link>. {tr("By submitting, you agree to our terms and conditions.", "Mit dem Absenden stimmst du unseren Allgemeinen Geschäftsbedingungen zu.", "Отправляя заявку, вы соглашаетесь с нашими условиями.")}</p>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white disabled:opacity-60">{submitting ? tr("Sending booking…", "Buchung wird gesendet…", "Отправка бронирования…") : `${tr("Confirm booking", "Buchung bestätigen", "Подтвердить бронирование")} · ${formatPrice(String(total))}`} <MessageCircle size={18}/></button>
        <button type="button" onClick={() => setStep("select")} className="w-full text-sm font-semibold text-slate-600 hover:text-blue-700">← {tr("Change date or travelers", "Datum oder Reisende ändern", "Изменить дату или гостей")}</button>
        <p className="text-center text-xs leading-5 text-slate-500">{tr("Your booking is reserved now. You pay cash when you arrive; we confirm pickup via WhatsApp.", "Deine Buchung ist reserviert. Du bezahlst bei Ankunft bar; wir bestätigen die Abholung per WhatsApp.", "Заявка на бронирование принята. Оплата наличными по прибытии; трансфер мы подтвердим в WhatsApp.")}</p>
      </form>}
    </div>
  );
}

function RequiredMark() {
  return <span aria-hidden="true" className="text-rose-600">*</span>;
}
