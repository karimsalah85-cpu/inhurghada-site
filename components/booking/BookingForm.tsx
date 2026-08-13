"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
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
  ShoppingCart,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { trackEvent } from "@/lib/analytics";
import { localePath } from "@/lib/i18n";
import { confirmationStorageKey } from "@/lib/booking-confirmation";
import { useCart } from "@/components/cart/CartProvider";
import type { BoatOption, BookingExtra } from "@/data/speedboat-booking";
import { marinaTransferOptions } from "@/data/speedboat-booking";

type ParticipantPricing = { adults: number; youth?: number; infants?: number };

type BookingFormProps = {
  tourName: string;
  tourSlug: string;
  destinationSlug?: "hurghada" | "marsa-alam";
  pickupZones?: string[];
  price?: string;
  originalPrice?: string;
  priceUnit?: string;
  pricingMode?: "per-person" | "per-booking";
  duration?: string;
  location?: string;
  participantPricing?: ParticipantPricing;
  availableTimes?: string[];
  ageBands?: { adults: string; children: string; infants: string };
  boatOptions?: BoatOption[];
  entrancePricing?: { adults: number; youth: number };
  bookingExtras?: BookingExtra[];
  requiresMarinaTransferChoice?: boolean;
  bookingLeadTime?: "next-day-before-15";
  currency?: "USD" | "EUR";
  operatingWeekdays?: number[];
};

const tomorrow = () => {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function minimumBookingDate(leadTime?: "next-day-before-15") {
  if (leadTime !== "next-day-before-15") return tomorrow();
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || "";
  const cairoDate = new Date(`${part("year")}-${part("month")}-${part("day")}T12:00:00Z`);
  cairoDate.setUTCDate(cairoDate.getUTCDate() + (Number(part("hour")) >= 15 ? 2 : 1));
  return cairoDate.toISOString().slice(0, 10);
}

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

const upsells: Record<string, { id: string; price: number; charge?: "adult"; en: string; de: string; ru: string; zh: string }[]> = {
  "full-day-diving": [{ id: "diving-equipment", price: 30, en: "Complete diving equipment rental", de: "Komplette Tauchausrüstung mieten", ru: "Аренда полного комплекта снаряжения для дайвинга", zh: "全套潜水装备租赁" }],
  "luxor-private-day-trip": [{ id: "tutankhamun-ticket", price: 30, en: "Entry to Tutankhamun's tomb", de: "Eintritt zum Grab Tutanchamuns", ru: "Входной билет в гробницу Тутанхамона", zh: "图坦卡蒙陵墓门票" }],
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
const chineseBookingCopy: Record<string, string> = {
  "From": "起价", "person": "每人", "Clear local price · pickup confirmed after booking": "透明本地价格 · 预订后确认接送", "Date": "日期", "Time": "时间", "Select your package": "选择套餐", "Adults": "成人", "each": "每人", "Youth (9–10)": "儿童（9–10 岁）", "Youth (4–10)": "儿童（4–10 岁）", "Infants": "婴儿", "Free of charge": "免费", "Book now": "立即预订", "Added to your trip cart.": "已添加到行程购物车。", "Add to trip cart": "添加到行程购物车", "View cart": "查看购物车", "Tell us about yourself": "填写您的信息", "Required field": "必填项", "Full name": "姓名", "Enter your full name": "请输入姓名", "Email address": "电子邮箱", "WhatsApp number": "WhatsApp 号码", "Pickup location": "接送地点", "Hotel name or full pickup address": "酒店名称或完整接送地址", "Required so we can confirm your pickup on WhatsApp.": "用于通过 WhatsApp 确认接送。", "Special requests": "特别要求", "optional": "选填", "Anything we should know?": "还有什么需要我们了解？", "Before booking, please review our": "预订前请查看我们的", "cancellation policy": "取消政策", "By submitting, you agree to our terms and conditions.": "提交即表示您同意我们的条款与条件。", "Sending booking…": "正在提交预订…", "Confirm booking": "确认预订", "Change date or travelers": "更改日期或人数", "Please select at least one adult.": "请至少选择一位成人。", "Every diver must hold a valid diving license for this booking.": "本次预订中的每位潜水员都必须持有有效潜水证。", "Every quad-tour participant must be at least 9 years old.": "每位四轮摩托参与者必须年满 9 岁。", "Your booking is reserved now. You pay cash when you arrive; we confirm pickup via WhatsApp.": "您的预订已保留。抵达时以现金付款；我们会通过 WhatsApp 确认接送。",
};
const polishBookingCopy: Record<string, string> = {
  "From": "Od", "person": "osobę", "Clear local price · pickup confirmed after booking": "Jasna cena lokalna · odbiór potwierdzamy po rezerwacji", "Date": "Data", "Time": "Godzina", "Select your package": "Wybierz pakiet", "Adults": "Dorośli", "each": "za osobę", "Youth (4–10)": "Dzieci (4–10 lat)", "Infants": "Niemowlęta", "Free of charge": "Bezpłatnie", "Book now": "Zarezerwuj", "Added to your trip cart.": "Dodano do koszyka wycieczek.", "Add to trip cart": "Dodaj do koszyka", "View cart": "Zobacz koszyk", "Tell us about yourself": "Podaj swoje dane", "Required field": "Pole wymagane", "Full name": "Imię i nazwisko", "Enter your full name": "Wpisz imię i nazwisko", "Email address": "Adres e-mail", "WhatsApp number": "Numer WhatsApp", "Pickup location": "Miejsce odbioru", "Hotel name or full pickup address": "Nazwa hotelu lub pełny adres odbioru", "Required so we can confirm your pickup on WhatsApp.": "Potrzebne do potwierdzenia odbioru przez WhatsApp.", "Special requests": "Specjalne życzenia", "optional": "opcjonalnie", "Anything we should know?": "Czy powinniśmy o czymś wiedzieć?", "Before booking, please review our": "Przed rezerwacją przeczytaj", "cancellation policy": "zasady anulowania", "By submitting, you agree to our terms and conditions.": "Wysyłając formularz, akceptujesz regulamin.", "Sending booking…": "Wysyłanie rezerwacji…", "Confirm booking": "Potwierdź rezerwację", "Change date or travelers": "Zmień datę lub uczestników", "Please select at least one adult.": "Wybierz co najmniej jedną osobę dorosłą.", "Your booking is reserved now. You pay cash when you arrive; we confirm pickup via WhatsApp.": "Rezerwacja została przyjęta. Płatność gotówką na miejscu; odbiór potwierdzimy przez WhatsApp."
};

export default function BookingForm({ tourName, tourSlug, destinationSlug = "hurghada", pickupZones = [], price, originalPrice, priceUnit, pricingMode = "per-person", duration, location, participantPricing, availableTimes, ageBands, boatOptions, entrancePricing, bookingExtras = [], requiresMarinaTransferChoice = false, bookingLeadTime, currency = "USD", operatingWeekdays }: BookingFormProps) {
  const idempotencyKey = useRef<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatPrice, language } = useSiteSettings();
  const { addItem } = useCart();
  const de = language === "de";
  const ru = language === "ru";
  const ar = language === "ar";
  const pl = language === "pl";
  const zh = language === "zh";
  const tr = (en: string, deText: string, ruText: string, arText = arabicBookingCopy[en] || en) => de ? deText : ru ? ruText : ar ? arText : pl ? polishBookingCopy[en] || en : zh ? chineseBookingCopy[en] || en : en;
  const adultPrice = participantPricing?.adults ?? Number(price || 0);
  const youthPrice = participantPricing?.youth;
  const infantPrice = participantPricing?.infants;
  const times = availableTimes?.length ? availableTimes : ["Time confirmed by WhatsApp"];
  const [step, setStep] = useState<"select" | "checkout">("select");
  const [adults, setAdults] = useState(Math.min(30, Math.max(1, Number(searchParams.get("guests")) || 1)));
  const [youth, setYouth] = useState(0);
  const [infants, setInfants] = useState(0);
  const [date, setDate] = useState(searchParams.get("date") || minimumBookingDate(bookingLeadTime));
  const [time, setTime] = useState(times[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hotel, setHotel] = useState("");
  const [guideLanguage, setGuideLanguage] = useState("English");
  const [message, setMessage] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedBoatOption, setSelectedBoatOption] = useState(boatOptions?.[0]?.id || "");
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});
  const [transferRequired, setTransferRequired] = useState(false);
  const [transferArea, setTransferArea] = useState("");
  const [divingLicenseConfirmed, setDivingLicenseConfirmed] = useState(false);
  const [quadMinimumAgeConfirmed, setQuadMinimumAgeConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [website, setWebsite] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [availability, setAvailability] = useState<{ managed: boolean; soldOut?: boolean; slots?: Array<{ remaining: number | null }> } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/availability?tour=${encodeURIComponent(tourSlug)}&date=${encodeURIComponent(date)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null).then((result) => setAvailability(result)).catch(() => undefined);
    return () => controller.abort();
  }, [date, tourSlug]);

  const extraOptions = upsells[tourSlug] || [];
  const selectedBoat = boatOptions?.find((option) => option.id === selectedBoatOption) ?? boatOptions?.[0];
  const requiresDivingLicense = tourSlug === "full-day-diving";
  const requiresQuadMinimumAge = ["quad-safari-morning", "quad-safari-sunset"].includes(tourSlug);
  const extrasTotal = extraOptions.filter((option) => selectedExtras.includes(option.id)).reduce((sum, option) => sum + option.price * (option.charge === "adult" ? adults : 1), 0);
  const configuredExtrasTotal = bookingExtras.reduce((sum, option) => sum + option.price * (extraQuantities[option.id] || 0), 0);
  const entranceTotal = entrancePricing ? adults * entrancePricing.adults + youth * entrancePricing.youth : 0;
  const participantTotal = selectedBoat
    ? selectedBoat.price + entranceTotal
    : pricingMode === "per-booking"
    ? adultPrice
    : adults * adultPrice + youth * (youthPrice ?? adultPrice) + infants * (infantPrice ?? 0);
  const total = participantTotal + extrasTotal + configuredExtrasTotal;
  const requestedPlaces = adults + youth + infants;
  const remainingPlaces = availability?.managed ? Math.max(...(availability.slots || []).map((slot) => slot.remaining ?? 9999), 0) : null;
  const unavailable = Boolean(availability?.soldOut || (remainingPlaces !== null && remainingPlaces < requestedPlaces));
  const boatOverCapacity = Boolean(selectedBoat && requestedPlaces > selectedBoat.capacity);
  const selectedWeekday = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00Z`).getUTCDay() : -1;
  const unavailableWeekday = Boolean(operatingWeekdays?.length && !operatingWeekdays.includes(selectedWeekday));
  const travelerText = de
    ? `${adults} Erwachsene${youthPrice !== undefined ? ` · ${youth} Kinder` : ""}${infantPrice !== undefined ? ` · ${infants} Kleinkinder` : ""}`
    : ru
      ? `${adults} взр.${youthPrice !== undefined ? ` · ${youth} дет.` : ""}${infantPrice !== undefined ? ` · ${infants} младен.` : ""}`
    : pl ? `${adults} dorosłych${youthPrice !== undefined ? ` · ${youth} dzieci` : ""}${infantPrice !== undefined ? ` · ${infants} niemowląt` : ""}` : zh ? `${adults} 位成人${youthPrice !== undefined ? ` · ${youth} 位儿童` : ""}${infantPrice !== undefined ? ` · ${infants} 位婴儿` : ""}` : `${adults} adult${adults === 1 ? "" : "s"}${youthPrice !== undefined ? ` · ${youth} youth` : ""}${infantPrice !== undefined ? ` · ${infants} infant${infants === 1 ? "" : "s"}` : ""}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adults) { setError(tr("Please select at least one adult.", "Bitte wähle mindestens einen Erwachsenen.", "Выберите хотя бы одного взрослого.")); return; }
    if (boatOverCapacity) { setError(`The selected boat accepts up to ${selectedBoat?.capacity} passengers.`); return; }
    if (unavailableWeekday) { setError("This excursion does not operate on the selected weekday."); return; }
    if (requiresMarinaTransferChoice && transferRequired && !transferArea) { setError("Choose your transfer pickup area."); return; }
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
      idempotencyKey.current ||= crypto.randomUUID();
      const response = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          type: "tour", locale: language, customerName: name.trim(), phone: phone.trim(), customerEmail: email.trim(),
          tourName, tourSlug, extras: selectedExtras, selectedBoatOption, extraQuantities, transferRequired, transferArea, location: location || "Hurghada", duration: duration || "Please confirm",
          price: `${formatPrice(String(total))} total`, date, guests: travelerText, hotel,
          message: `Time: ${time}\nGuide language: ${guideLanguage}${selectedBoat ? `\nBoat: ${selectedBoat.label}` : ""}${bookingExtras.some((option) => extraQuantities[option.id]) ? `\nQuantity extras: ${bookingExtras.filter((option) => extraQuantities[option.id]).map((option) => `${option.label} x${extraQuantities[option.id]}`).join(", ")}` : ""}${requiresMarinaTransferChoice ? `\nMarina transfer: ${transferRequired ? `Yes - ${transferArea}` : "No"}` : ""}${requiresDivingLicense ? "\nValid diving license: confirmed for every diver" : ""}${requiresQuadMinimumAge ? "\nQuad minimum age 9: confirmed for every participant" : ""}${selectedExtras.length ? `\nOptional extras: ${extraOptions.filter((option) => selectedExtras.includes(option.id)).map((option) => de ? option.de : ru ? option.ru : option.en).join(", ")}` : ""}${message ? `\nCustomer note: ${message}` : ""}`,
          adults, youth, infants,
          divingLicenseConfirmed,
          quadMinimumAgeConfirmed,
          website,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Booking submission failed.");
      trackEvent("booking_complete", { transaction_id: data.reference, value: total, currency, item_name: tourName, booking_type: "tour" });
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
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-500">{tr("From", "Ab", "От")} {originalPrice && Number(originalPrice) > adultPrice ? <span className="mr-2 text-sm text-slate-400 line-through">{formatPrice(originalPrice)}</span> : null}<span className="text-2xl font-black text-slate-950">{formatPrice(String(adultPrice))}</span> / {priceUnit || tr("person", "Person", "человека")}</p><p className="mt-1 text-sm font-medium text-emerald-700">{tr("Clear local price · pickup confirmed after booking", "Klarer lokaler Preis · Abholung nach Buchung bestätigt", "Понятная местная цена · трансфер подтверждается после бронирования")}</p></div><ShieldCheck className="text-emerald-600" /></div>
      {step === "select" ? <>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-slate-700">{tr("Date", "Datum", "Дата")} <RequiredMark/><div className="relative mt-1"><CalendarDays className="absolute left-3 top-3 text-slate-400" size={18}/><input required type="date" min={minimumBookingDate(bookingLeadTime)} value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></div></label>
          {availability?.managed ? <p className={`rounded-xl p-3 text-sm font-bold ${unavailable ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{unavailable ? "Sold out or not enough places for this group." : remainingPlaces === 9999 ? "Available" : `${remainingPlaces} places remaining`}</p> : null}
          <label className="block text-sm font-bold text-slate-700">{tr("Time", "Uhrzeit", "Время")} <RequiredMark/><div className="relative mt-1"><Clock3 className="absolute left-3 top-3 text-slate-400" size={18}/><select required value={time} onChange={(event) => setTime(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-10 py-3 font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">{times.map((option) => <option key={option}>{ru && option === "Time confirmed by WhatsApp" ? "Время подтверждается в WhatsApp" : option}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400" size={18}/></div></label>
        </div>
        {requiresDivingLicense ? <div className="mt-5 rounded-2xl border border-cyan-300 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950"><p className="font-black">{de ? "Gültiger Tauchschein erforderlich" : zh ? "需要有效潜水证" : "Valid diving license required"}</p><p className="mt-1">{de ? "Jeder Taucher muss einen gültigen Tauchschein besitzen und den Nachweis mitbringen." : zh ? "每位潜水员必须持有有效的深潜证，并在行程中携带证明。" : "Every diver must hold a valid scuba diving license and bring proof on the trip."}</p></div> : null}
        {requiresQuadMinimumAge ? <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-black">{de ? "Mindestalter: 9 Jahre" : zh ? "最低年龄：9 岁" : "Minimum age: 9 years"}</p><p className="mt-1">{de ? "Alle Teilnehmer müssen am Tag der Tour mindestens 9 Jahre alt sein." : zh ? "每位参与者在行程当天必须年满 9 岁。" : "Every participant must be at least 9 years old on the day of the tour."}</p></div> : null}
        {boatOptions?.length ? <fieldset className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4"><legend className="px-1 text-sm font-black text-slate-900">Select your private boat</legend><div className="space-y-2">{boatOptions.map((option) => <label key={option.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm"><span className="flex items-center gap-3"><input type="radio" name="boat-option" checked={selectedBoatOption === option.id} onChange={() => setSelectedBoatOption(option.id)} className="accent-cyan-700"/><span>{option.label}{option.extraHourPrice ? <small className="mt-1 block text-xs text-slate-500">Extra hour: {formatPrice(option.extraHourPrice)}</small> : null}</span></span><strong>{formatPrice(option.price)}</strong></label>)}</div></fieldset> : null}
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 px-4"><p className="pt-4 text-sm font-bold text-slate-900">Travelers and island entrance</p><Counter label={ageBands?.adults || tr("Adults", "Erwachsene", "Взрослые")} description={entrancePricing ? `${formatPrice(entrancePricing.adults)} entrance each` : pricingMode === "per-booking" ? `${formatPrice(String(adultPrice))} ${tr("total per booking", "gesamt pro Buchung", "за всё бронирование")}` : `${formatPrice(String(adultPrice))} ${tr("each", "pro Person", "за человека")}`} value={adults} onChange={setAdults}/>{(entrancePricing || youthPrice !== undefined) && <Counter label={ageBands?.children || tr("Youth (4–10)", "Kinder (4–10)", "Дети (4–10)")} description={`${formatPrice(entrancePricing?.youth ?? youthPrice ?? 0)} ${tr("each", "pro Kind", "за ребёнка")}`} value={youth} onChange={setYouth}/>} {infantPrice !== undefined && <Counter label={ageBands?.infants || tr("Infants", "Kleinkinder", "Младенцы")} description={tr("Free of charge", "Kostenlos", "Бесплатно")} value={infants} onChange={setInfants}/>} {boatOverCapacity ? <p className="pb-4 text-sm font-bold text-rose-700">This boat accepts up to {selectedBoat?.capacity} passengers. Choose a larger boat or reduce the group.</p> : null}</div>
        {bookingExtras.length ? <fieldset className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4"><legend className="px-1 text-sm font-black text-slate-900">Optional add-ons</legend>{bookingExtras.map((option) => <div key={option.id} className="mt-2 rounded-xl bg-white px-3"><Counter label={option.label} description={`${formatPrice(option.price)} per person`} value={extraQuantities[option.id] || 0} onChange={(quantity) => setExtraQuantities((current) => ({ ...current, [option.id]: quantity }))}/></div>)}</fieldset> : null}
        {requiresMarinaTransferChoice ? <fieldset className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4"><legend className="px-1 text-sm font-black text-slate-900">Do you require transfer to Hurghada marina?</legend><div className="mt-2 flex gap-5 text-sm"><label><input type="radio" name="marina-transfer" checked={!transferRequired} onChange={() => { setTransferRequired(false); setTransferArea(""); }} className="mr-2 accent-emerald-700"/>No</label><label><input type="radio" name="marina-transfer" checked={transferRequired} onChange={() => setTransferRequired(true)} className="mr-2 accent-emerald-700"/>Yes</label></div>{transferRequired ? <select required value={transferArea} onChange={(event) => setTransferArea(event.target.value)} className="mt-3 w-full rounded-xl border border-emerald-200 bg-white p-3 text-sm"><option value="">Select pickup area</option>{marinaTransferOptions.map((area) => <option key={area}>{area}</option>)}</select> : null}<p className="mt-2 text-xs text-emerald-900">Transfer price is confirmed by WhatsApp for the selected area.</p></fieldset> : null}
        {extraOptions.length ? <fieldset className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4"><legend className="px-1 text-sm font-black text-slate-900">{de ? "Optionale Extras" : zh ? "可选附加项目" : "Optional extras"}</legend>{extraOptions.map((option) => <label key={option.id} className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm"><span className="flex items-center gap-3"><input type="checkbox" checked={selectedExtras.includes(option.id)} onChange={(event) => setSelectedExtras((items) => event.target.checked ? [...items, option.id] : items.filter((item) => item !== option.id))} className="h-4 w-4 accent-blue-600" />{de ? option.de : ru ? option.ru : zh ? option.zh : option.en}</span><strong>+{formatPrice(String(option.price * (option.charge === "adult" ? adults : 1)))}</strong></label>)}</fieldset> : null}
        <div className="mt-5 flex items-end justify-between border-t pt-5"><div><p className="font-bold text-slate-900">{de ? "Gesamtpreis" : "Total"}</p><p className="text-xs text-slate-500">{de ? "Barzahlung bei Ankunft · keine Online-Zahlung" : "Cash on arrival · no online payment"}</p></div><p className="text-3xl font-black text-blue-700">{formatPrice(String(total))}</p></div>
        {unavailableWeekday ? <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">This excursion does not operate on the selected weekday. Choose another date.</p> : null}
        <button disabled={unavailable || boatOverCapacity || unavailableWeekday} type="button" onClick={() => { if (!adults) return setError(tr("Please select at least one adult.", "Bitte wähle mindestens einen Erwachsenen.", "Выберите хотя бы одного взрослого.")); if (requiresMarinaTransferChoice && transferRequired && !transferArea) return setError("Choose your transfer pickup area."); trackEvent("booking_start", { value: total, currency, item_name: tourName, booking_type: "tour" }); setStep("checkout"); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400">{unavailable ? "Sold out" : tr("Book now", "Jetzt buchen", "Забронировать")} <Users size={18}/></button>
        <button type="button" onClick={() => {
          if (!adults) return setError(tr("Please select at least one adult.", "Bitte wähle mindestens einen Erwachsenen.", "Выберите хотя бы одного взрослого."));
          if (boatOverCapacity) return setError(`The selected boat accepts up to ${selectedBoat?.capacity} passengers.`);
          if (requiresMarinaTransferChoice && transferRequired && !transferArea) return setError("Choose your transfer pickup area.");
          addItem({ tourSlug, tourName, destinationSlug, currency, date, time, adults, youth, infants, extras: selectedExtras, selectedBoatOption, extraQuantities, transferRequired, transferArea, subtotal: total, requiresDivingLicense, requiresQuadMinimumAge });
          setCartMessage(tr("Added to your trip cart.", "Zum Reisewarenkorb hinzugefügt.", "Добавлено в корзину поездок.", "تمت الإضافة إلى سلة الرحلات."));
        }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 py-4 font-bold text-blue-800 hover:bg-blue-100">{tr("Add to trip cart", "Zum Reisewarenkorb", "Добавить в корзину", "أضف إلى سلة الرحلات")} <ShoppingCart size={18}/></button>
        {cartMessage ? <p className="mt-3 text-center text-sm font-semibold text-emerald-700">{cartMessage} <Link href={localePath(language, "/cart")} className="underline">{tr("View cart", "Warenkorb ansehen", "Открыть корзину", "عرض السلة")}</Link></p> : null}
        {error && <p role="alert" className="mt-3 text-center text-sm text-rose-600">{error}</p>}
      </> : <form onSubmit={submit} aria-busy={submitting} className="mt-6 space-y-4">
        <input name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="font-bold text-slate-900">{tourName}</p><p className="mt-1 text-sm text-slate-600">{date} {de ? "um" : "at"} {time} · {travelerText}</p><p className="mt-2 font-black text-blue-700">{formatPrice(String(total))} · {de ? "Barzahlung bei Ankunft" : "Cash on arrival"}</p></div>
        <p className="border-b pb-2 text-lg font-black text-slate-950">{tr("Tell us about yourself", "Deine Angaben", "Ваши данные")}</p>
        <p className="text-xs text-slate-500"><RequiredMark/> {tr("Required field", "Pflichtfeld", "Обязательное поле")}</p>
        <label className="block text-sm font-bold text-slate-800">{tr("Full name", "Vollständiger Name", "Полное имя")} <RequiredMark/><input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder={tr("Enter your full name", "Vollständigen Namen eingeben", "Введите имя и фамилию")} /></label>
        <label className="block text-sm font-bold text-slate-800">{tr("Email address", "E-Mail-Adresse", "Электронная почта")} <RequiredMark/><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="you@example.com" /></label>
        <label className="block text-sm font-bold text-slate-800">{tr("WhatsApp number", "WhatsApp-Nummer", "Номер WhatsApp")} <RequiredMark/><input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="+20 103 080 9150" /></label>
        <label className="block text-sm font-bold text-slate-800">{tr("Pickup location", "Abholort", "Место трансфера")} <RequiredMark/><div className="relative mt-1"><Hotel className="absolute left-3 top-3 text-slate-400" size={18}/><input required value={hotel} onChange={(event) => setHotel(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder={tr("Hotel name or full pickup address", "Hotelname oder vollständige Abholadresse", "Название отеля или полный адрес")} /></div>{pickupZones.length ? <span className="mt-1 block text-xs font-normal text-emerald-700">Included pickup zones: {pickupZones.join(", ")}.</span> : <span className="mt-1 block text-xs font-normal text-slate-500">{tr("Required so we can confirm your pickup on WhatsApp.", "Erforderlich, damit wir deine Abholung per WhatsApp bestätigen können.", "Нужно для подтверждения трансфера в WhatsApp.")}</span>}</label>
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
