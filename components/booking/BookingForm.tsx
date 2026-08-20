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
import type { DestinationSlug } from "@/lib/destinations";

type ParticipantPricing = { adults: number; youth?: number; infants?: number };
type PackageOption = { id: string; label: string; price: number };

type BookingFormProps = {
  tourName: string;
  tourSlug: string;
  destinationSlug?: DestinationSlug;
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
  packageOptions?: PackageOption[];
  entrancePricing?: { adults: number; youth: number };
  bookingExtras?: BookingExtra[];
  requiresMarinaTransferChoice?: boolean;
  bookingLeadTime?: "next-day-before-15";
  currency?: "USD" | "EUR" | "SAR";
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
  "Every diver must hold a valid diving license for this booking.": "يجب أن يحمل كل غواص رخصة غوص سارية المفعول لهذا الحجز.", "Every quad-tour participant must be at least 9 years old.": "يجب ألا يقل عمر كل مشارك في رحلة الكواد عن 9 سنوات.",
  "Sold out or not enough places for this group.": "نفدت الأماكن أو لا توجد أماكن كافية لهذه المجموعة.", "Available": "متاح", "places remaining": "أماكن متبقية", "Time confirmed by WhatsApp": "يتم تأكيد الوقت عبر واتساب", "Select your private boat": "اختر القارب الخاص", "Extra hour": "ساعة إضافية", "Travelers and island entrance": "المسافرون ورسوم دخول الجزيرة", "entrance each": "رسوم دخول لكل شخص", "Optional add-ons": "إضافات اختيارية", "per person": "للشخص", "Total": "الإجمالي", "Cash on arrival · no online payment": "الدفع نقداً عند الوصول · لا يوجد دفع إلكتروني", "Cash on arrival": "الدفع نقداً عند الوصول", "at": "الساعة", "Sold out": "نفدت الأماكن", "Included pickup zones": "مناطق الاستلام المشمولة", "ID or passport required before the trip": "يلزم إبراز بطاقة الهوية أو جواز السفر قبل الرحلة", "A valid ID or passport is mandatory for trip permit reasons. Please make sure you have it available before your experience.": "يلزم وجود بطاقة هوية أو جواز سفر ساري لإصدار تصريح الرحلة. يرجى تجهيزه قبل التجربة.", "Preferred guide language": "لغة المرشد المفضلة", "This excursion does not operate on the selected weekday. Choose another date.": "هذه الرحلة لا تعمل في اليوم المحدد. اختر تاريخاً آخر.", "Choose your transfer pickup area.": "اختر منطقة الاستلام للنقل.",
  "Do you require transfer to Hurghada marina?": "هل تحتاج إلى نقل إلى مارينا الغردقة؟", "No": "لا", "Yes": "نعم", "Select pickup area": "اختر منطقة الاستلام", "Transfer price is confirmed by WhatsApp for the selected area.": "يتم تأكيد سعر النقل للمنطقة المختارة عبر واتساب.", "Booking submission failed.": "تعذّر إرسال الحجز.", "Valid diving license required": "يلزم رخصة غوص سارية", "Every diver must hold a valid scuba diving license and bring proof on the trip.": "يجب أن يحمل كل غواص رخصة غوص سارية المفعول ويُحضر إثباتها في الرحلة.", "Minimum age: 9 years": "الحد الأدنى للسن: 9 سنوات", "Every participant must be at least 9 years old on the day of the tour.": "يجب أن يكون عمر كل مشارك 9 سنوات على الأقل في يوم الرحلة.", "I confirm that every diver holds a valid scuba diving license and will bring proof on the trip.": "أؤكد أن كل غواص يحمل رخصة غوص سارية المفعول وسيُحضر إثباتها خلال الرحلة.", "I confirm that every participant is at least 9 years old.": "أؤكد أن عمر كل مشارك 9 سنوات على الأقل.", "Optional extras": "إضافات اختيارية", "total per booking": "لكل الحجز",
};
const chineseBookingCopy: Record<string, string> = {
  "From": "起价", "person": "每人", "Clear local price · pickup confirmed after booking": "透明本地价格 · 预订后确认接送", "Date": "日期", "Time": "时间", "Select your package": "选择套餐", "Adults": "成人", "each": "每人", "Youth (9–10)": "儿童（9–10 岁）", "Youth (4–10)": "儿童（4–10 岁）", "Infants": "婴儿", "Free of charge": "免费", "Book now": "立即预订", "Added to your trip cart.": "已添加到行程购物车。", "Add to trip cart": "添加到行程购物车", "View cart": "查看购物车", "Tell us about yourself": "填写您的信息", "Required field": "必填项", "Full name": "姓名", "Enter your full name": "请输入姓名", "Email address": "电子邮箱", "WhatsApp number": "WhatsApp 号码", "Pickup location": "接送地点", "Hotel name or full pickup address": "酒店名称或完整接送地址", "Required so we can confirm your pickup on WhatsApp.": "用于通过 WhatsApp 确认接送。", "Special requests": "特别要求", "optional": "选填", "Anything we should know?": "还有什么需要我们了解？", "Before booking, please review our": "预订前请查看我们的", "cancellation policy": "取消政策", "By submitting, you agree to our terms and conditions.": "提交即表示您同意我们的条款与条件。", "Sending booking…": "正在提交预订…", "Confirm booking": "确认预订", "Change date or travelers": "更改日期或人数", "Please select at least one adult.": "请至少选择一位成人。", "Every diver must hold a valid diving license for this booking.": "本次预订中的每位潜水员都必须持有有效潜水证。", "Every quad-tour participant must be at least 9 years old.": "每位四轮摩托参与者必须年满 9 岁。", "Your booking is reserved now. You pay cash when you arrive; we confirm pickup via WhatsApp.": "您的预订已保留。抵达时以现金付款；我们会通过 WhatsApp 确认接送。",
};
Object.assign(chineseBookingCopy, { "Sold out or not enough places for this group.": "已售罄或剩余名额不足。", "Available": "可预订", "places remaining": "个名额剩余", "Time confirmed by WhatsApp": "时间通过 WhatsApp 确认", "Select your private boat": "选择私人快艇", "Extra hour": "额外一小时", "Travelers and island entrance": "游客与岛屿门票", "entrance each": "每人门票", "Optional add-ons": "可选附加项目", "per person": "每人", "Total": "总计", "Cash on arrival · no online payment": "抵达时现金付款 · 无需在线支付", "Cash on arrival": "抵达时现金付款", "at": "时间", "Sold out": "已售罄", "Included pickup zones": "包含接送区域", "ID or passport required before the trip": "行程前须出示身份证或护照", "A valid ID or passport is mandatory for trip permit reasons. Please make sure you have it available before your experience.": "办理行程许可需要有效身份证或护照，请在出发前准备好。", "Preferred guide language": "首选导游语言", "This excursion does not operate on the selected weekday. Choose another date.": "该行程在所选星期几不运营，请选择其他日期。", "Choose your transfer pickup area.": "请选择接送区域。", "Do you require transfer to Hurghada marina?": "您是否需要前往赫尔格达码头的接送服务？", "No": "否", "Yes": "是", "Select pickup area": "选择接送区域", "Transfer price is confirmed by WhatsApp for the selected area.": "所选区域的接送价格将通过 WhatsApp 确认。", "Booking submission failed.": "预订提交失败。", "Valid diving license required": "需要有效潜水证", "Every diver must hold a valid scuba diving license and bring proof on the trip.": "每位潜水员必须持有有效的深潜证，并在行程中携带证明。", "Minimum age: 9 years": "最低年龄：9 岁", "Every participant must be at least 9 years old on the day of the tour.": "每位参与者在行程当天必须年满 9 岁。", "I confirm that every diver holds a valid scuba diving license and will bring proof on the trip.": "我确认每位潜水员均持有有效的潜水证，并将在行程中携带证明。", "I confirm that every participant is at least 9 years old.": "我确认所有参与者均已年满 9 岁。", "Optional extras": "可选附加项目", "total per booking": "每次预订总计" });
const polishBookingCopy: Record<string, string> = {
  "From": "Od", "person": "osobę", "Clear local price · pickup confirmed after booking": "Jasna cena lokalna · odbiór potwierdzamy po rezerwacji", "Date": "Data", "Time": "Godzina", "Select your package": "Wybierz pakiet", "Adults": "Dorośli", "each": "za osobę", "Youth (4–10)": "Dzieci (4–10 lat)", "Infants": "Niemowlęta", "Free of charge": "Bezpłatnie", "Book now": "Zarezerwuj", "Added to your trip cart.": "Dodano do koszyka wycieczek.", "Add to trip cart": "Dodaj do koszyka", "View cart": "Zobacz koszyk", "Tell us about yourself": "Podaj swoje dane", "Required field": "Pole wymagane", "Full name": "Imię i nazwisko", "Enter your full name": "Wpisz imię i nazwisko", "Email address": "Adres e-mail", "WhatsApp number": "Numer WhatsApp", "Pickup location": "Miejsce odbioru", "Hotel name or full pickup address": "Nazwa hotelu lub pełny adres odbioru", "Required so we can confirm your pickup on WhatsApp.": "Potrzebne do potwierdzenia odbioru przez WhatsApp.", "Special requests": "Specjalne życzenia", "optional": "opcjonalnie", "Anything we should know?": "Czy powinniśmy o czymś wiedzieć?", "Before booking, please review our": "Przed rezerwacją przeczytaj", "cancellation policy": "zasady anulowania", "By submitting, you agree to our terms and conditions.": "Wysyłając formularz, akceptujesz regulamin.", "Sending booking…": "Wysyłanie rezerwacji…", "Confirm booking": "Potwierdź rezerwację", "Change date or travelers": "Zmień datę lub uczestników", "Please select at least one adult.": "Wybierz co najmniej jedną osobę dorosłą.", "Every diver must hold a valid diving license for this booking.": "Każdy nurek musi posiadać ważne uprawnienia nurkowe na tę rezerwację.", "Every quad-tour participant must be at least 9 years old.": "Każdy uczestnik wycieczki quadami musi mieć ukończone 9 lat.", "Your booking is reserved now. You pay cash when you arrive; we confirm pickup via WhatsApp.": "Rezerwacja została przyjęta. Płatność gotówką na miejscu; odbiór potwierdzimy przez WhatsApp."
};
Object.assign(polishBookingCopy, { "Sold out or not enough places for this group.": "Brak miejsc lub niewystarczająca liczba miejsc dla tej grupy.", "Available": "Dostępne", "places remaining": "wolnych miejsc", "Time confirmed by WhatsApp": "Godzinę potwierdzimy przez WhatsApp", "Select your private boat": "Wybierz prywatną łódź", "Extra hour": "Dodatkowa godzina", "Travelers and island entrance": "Uczestnicy i wstęp na wyspę", "entrance each": "wstęp za osobę", "Optional add-ons": "Opcjonalne dodatki", "per person": "za osobę", "Total": "Razem", "Cash on arrival · no online payment": "Płatność gotówką na miejscu · bez płatności online", "Cash on arrival": "Płatność gotówką na miejscu", "at": "o", "Sold out": "Brak miejsc", "Included pickup zones": "Strefy odbioru w cenie", "ID or passport required before the trip": "Przed wycieczką wymagany jest dowód lub paszport", "A valid ID or passport is mandatory for trip permit reasons. Please make sure you have it available before your experience.": "Do uzyskania zezwolenia wymagany jest ważny dowód lub paszport. Przygotuj go przed wycieczką.", "Preferred guide language": "Preferowany język przewodnika", "This excursion does not operate on the selected weekday. Choose another date.": "Ta wycieczka nie odbywa się w wybranym dniu tygodnia. Wybierz inną datę.", "Choose your transfer pickup area.": "Wybierz strefę odbioru.", "Do you require transfer to Hurghada marina?": "Czy potrzebujesz transferu do mariny w Hurghadzie?", "No": "Nie", "Yes": "Tak", "Select pickup area": "Wybierz strefę odbioru", "Transfer price is confirmed by WhatsApp for the selected area.": "Cena transferu dla wybranej strefy zostanie potwierdzona przez WhatsApp.", "Booking submission failed.": "Nie udało się wysłać rezerwacji.", "Valid diving license required": "Wymagane ważne uprawnienia nurkowe", "Every diver must hold a valid scuba diving license and bring proof on the trip.": "Każdy nurek musi posiadać ważne uprawnienia nurkowe i zabrać ze sobą dowód na wycieczkę.", "Minimum age: 9 years": "Minimalny wiek: 9 lat", "Every participant must be at least 9 years old on the day of the tour.": "Każdy uczestnik musi mieć ukończone 9 lat w dniu wycieczki.", "I confirm that every diver holds a valid scuba diving license and will bring proof on the trip.": "Potwierdzam, że każdy nurek posiada ważne uprawnienia nurkowe i zabierze ze sobą dowód na wycieczkę.", "I confirm that every participant is at least 9 years old.": "Potwierdzam, że wszyscy uczestnicy mają ukończone 9 lat.", "Optional extras": "Opcjonalne dodatki", "total per booking": "łącznie za rezerwację" });

export default function BookingForm({ tourName, tourSlug, destinationSlug = "hurghada", pickupZones = [], price, originalPrice, priceUnit, pricingMode = "per-person", duration, location, participantPricing, availableTimes, ageBands, boatOptions, packageOptions, entrancePricing, bookingExtras = [], requiresMarinaTransferChoice = false, bookingLeadTime, currency = "USD", operatingWeekdays }: BookingFormProps) {
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
  const boatCapacityError = (capacity?: number) => de
    ? `Das gewählte Boot ist für höchstens ${capacity} Personen geeignet.`
    : ru
    ? `Выбранная лодка рассчитана максимум на ${capacity} пассажиров.`
    : ar
    ? `القارب المختار يتسع حتى ${capacity} ركاب.`
    : pl
    ? `Wybrana łódź mieści maksymalnie ${capacity} osób.`
    : zh
    ? `所选快艇最多可容纳 ${capacity} 位乘客。`
    : `The selected boat accepts up to ${capacity} passengers.`;
  const boatCapacityNotice = (capacity?: number) => de
    ? `Dieses Boot ist für höchstens ${capacity} Personen geeignet. Wähle ein größeres Boot oder verringere die Gruppengröße.`
    : ru
    ? `Эта лодка рассчитана максимум на ${capacity} пассажиров. Выберите лодку побольше или уменьшите группу.`
    : ar
    ? `يتسع هذا القارب حتى ${capacity} ركاب. اختر قارباً أكبر أو قلل عدد أفراد المجموعة.`
    : pl
    ? `Ta łódź mieści maksymalnie ${capacity} osób. Wybierz większą łódź lub zmniejsz liczbę uczestników.`
    : zh
    ? `此快艇最多可容纳 ${capacity} 位乘客。请选择更大的快艇或减少人数。`
    : `This boat accepts up to ${capacity} passengers. Choose a larger boat or reduce the group.`;
  const bookingSubmissionFailedText = tr("Booking submission failed.", "Buchung konnte nicht gesendet werden.", "Не удалось отправить бронирование.");
  const baseAdultPrice = participantPricing?.adults ?? Number(price || 0);
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
  const [selectedPackageOption, setSelectedPackageOption] = useState(packageOptions?.[0]?.id || "");
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
  const selectedPackage = packageOptions?.find((option) => option.id === selectedPackageOption) ?? packageOptions?.[0];
  const adultPrice = selectedPackage ? selectedPackage.price : baseAdultPrice;
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
    if (boatOverCapacity) { setError(boatCapacityError(selectedBoat?.capacity)); return; }
    if (unavailableWeekday) { setError(tr("This excursion does not operate on the selected weekday. Choose another date.", "Dieser Ausflug findet am gewählten Wochentag nicht statt. Wähle ein anderes Datum.", "Экскурсия не проводится в выбранный день недели. Выберите другую дату.")); return; }
    if (requiresMarinaTransferChoice && transferRequired && !transferArea) { setError(tr("Choose your transfer pickup area.", "Wähle den Abholbereich für den Transfer.", "Выберите зону трансфера.")); return; }
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
          price: `${formatPrice(String(total), currency)} total`, date, guests: travelerText, hotel,
          message: `Time: ${time}\nGuide language: ${guideLanguage}${selectedBoat ? `\nBoat: ${selectedBoat.label}` : ""}${selectedPackage ? `\nPackage: ${selectedPackage.label}` : ""}${bookingExtras.some((option) => extraQuantities[option.id]) ? `\nQuantity extras: ${bookingExtras.filter((option) => extraQuantities[option.id]).map((option) => `${option.label} x${extraQuantities[option.id]}`).join(", ")}` : ""}${requiresMarinaTransferChoice ? `\nMarina transfer: ${transferRequired ? `Yes - ${transferArea}` : "No"}` : ""}${requiresDivingLicense ? "\nValid diving license: confirmed for every diver" : ""}${requiresQuadMinimumAge ? "\nQuad minimum age 9: confirmed for every participant" : ""}${selectedExtras.length ? `\nOptional extras: ${extraOptions.filter((option) => selectedExtras.includes(option.id)).map((option) => de ? option.de : ru ? option.ru : option.en).join(", ")}` : ""}${message ? `\nCustomer note: ${message}` : ""}`,
          adults, youth, infants,
          divingLicenseConfirmed,
          quadMinimumAgeConfirmed,
          website,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || bookingSubmissionFailedText);
      trackEvent("booking_complete", { transaction_id: data.reference, value: total, currency, item_name: tourName, booking_type: "tour" });
      if (!data.whatsappSent && data.whatsappUrl) window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      window.sessionStorage.setItem(confirmationStorageKey(data.reference), JSON.stringify({
        reference: data.reference,
        customerName: name.trim(),
        serviceName: tourName,
        date,
        time,
        travelers: travelerText,
        total: formatPrice(String(total), currency),
        customerEmailSent: Boolean(data.customerEmailSent),
        whatsappSent: Boolean(data.whatsappSent),
        bookingConfirmationPdf: String(data.bookingConfirmationPdf || ""),
      }));
      router.push(`${localePath(language, "/booking/confirmation")}?reference=${encodeURIComponent(data.reference)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : bookingSubmissionFailedText);
    } finally { setSubmitting(false); }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-500">{tr("From", "Ab", "От")} {originalPrice && Number(originalPrice) > adultPrice ? <span className="mr-2 text-sm text-slate-400 line-through">{formatPrice(originalPrice, currency)}</span> : null}<span className="text-2xl font-black text-slate-950">{formatPrice(String(adultPrice), currency)}</span> / {priceUnit || tr("person", "Person", "человека")}</p><p className="mt-1 text-sm font-medium text-emerald-700">{tr("Clear local price · pickup confirmed after booking", "Klarer lokaler Preis · Abholung nach Buchung bestätigt", "Понятная местная цена · трансфер подтверждается после бронирования")}</p></div><ShieldCheck className="text-emerald-600" /></div>
      {step === "select" ? <>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-slate-700">{tr("Date", "Datum", "Дата")} <RequiredMark/><div className="relative mt-1"><CalendarDays className="absolute left-3 top-3 text-slate-400" size={18}/><input required type="date" min={minimumBookingDate(bookingLeadTime)} value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></div></label>
          {availability?.managed ? <p className={`rounded-xl p-3 text-sm font-bold ${unavailable ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{unavailable ? tr("Sold out or not enough places for this group.", "Ausverkauft oder nicht genügend Plätze für diese Gruppe.", "Нет мест или недостаточно мест для этой группы.") : remainingPlaces === 9999 ? tr("Available", "Verfügbar", "Доступно") : `${remainingPlaces} ${tr("places remaining", "Plätze verfügbar", "мест осталось")}`}</p> : null}
          <label className="block text-sm font-bold text-slate-700">{tr("Time", "Uhrzeit", "Время")} <RequiredMark/><div className="relative mt-1"><Clock3 className="absolute left-3 top-3 text-slate-400" size={18}/><select required value={time} onChange={(event) => setTime(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-10 py-3 font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">{times.map((option) => <option key={option}>{option === "Time confirmed by WhatsApp" ? tr(option, "Uhrzeit wird per WhatsApp bestätigt", "Время подтверждается в WhatsApp") : option}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400" size={18}/></div></label>
        </div>
        {requiresDivingLicense ? <div className="mt-5 rounded-2xl border border-cyan-300 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950"><p className="font-black">{tr("Valid diving license required", "Gültiger Tauchschein erforderlich", "Требуется действующий сертификат дайвера")}</p><p className="mt-1">{tr("Every diver must hold a valid scuba diving license and bring proof on the trip.", "Jeder Taucher muss einen gültigen Tauchschein besitzen und den Nachweis mitbringen.", "У каждого дайвера должен быть действующий сертификат для подводного плавания; документ нужно взять с собой в поездку.")}</p></div> : null}
        {requiresQuadMinimumAge ? <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-black">{tr("Minimum age: 9 years", "Mindestalter: 9 Jahre", "Минимальный возраст: 9 лет")}</p><p className="mt-1">{tr("Every participant must be at least 9 years old on the day of the tour.", "Alle Teilnehmer müssen am Tag der Tour mindestens 9 Jahre alt sein.", "Каждому участнику должно быть не менее 9 лет в день тура.")}</p></div> : null}
        {boatOptions?.length ? <fieldset className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4"><legend className="px-1 text-sm font-black text-slate-900">{tr("Select your private boat", "Wähle dein privates Boot", "Выберите частную лодку")}</legend><div className="space-y-2">{boatOptions.map((option) => <label key={option.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm"><span className="flex items-center gap-3"><input type="radio" name="boat-option" checked={selectedBoatOption === option.id} onChange={() => setSelectedBoatOption(option.id)} className="accent-cyan-700"/><span>{option.label}{option.extraHourPrice ? <small className="mt-1 block text-xs text-slate-500">{tr("Extra hour", "Zusätzliche Stunde", "Дополнительный час")}: {formatPrice(option.extraHourPrice)}</small> : null}</span></span><strong>{formatPrice(option.price)}</strong></label>)}</div></fieldset> : null}
        {packageOptions && packageOptions.length > 1 ? <fieldset className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4"><legend className="px-1 text-sm font-black text-slate-900">{tr("Select your package", "Paket auswählen", "Выберите пакет")}</legend><div className="space-y-2">{packageOptions.map((option) => <label key={option.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm"><span className="flex items-center gap-3"><input type="radio" name="package-option" checked={selectedPackageOption === option.id} onChange={() => setSelectedPackageOption(option.id)} className="accent-cyan-700"/><span>{option.label}</span></span><strong>{formatPrice(String(option.price), currency)}</strong></label>)}</div></fieldset> : null}
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 px-4"><p className="pt-4 text-sm font-bold text-slate-900">{tr("Travelers and island entrance", "Reisende und Insel-Eintritt", "Путешественники и вход на остров")}</p><Counter label={ageBands?.adults || tr("Adults", "Erwachsene", "Взрослые")} description={entrancePricing ? `${formatPrice(entrancePricing.adults)} ${tr("entrance each", "Eintritt pro Person", "билет за каждого")}` : pricingMode === "per-booking" ? `${formatPrice(String(adultPrice), currency)} ${tr("total per booking", "gesamt pro Buchung", "за всё бронирование")}` : `${formatPrice(String(adultPrice), currency)} ${tr("each", "pro Person", "за человека")}`} value={adults} onChange={setAdults}/>{(entrancePricing || youthPrice !== undefined) && <Counter label={ageBands?.children || tr("Youth (4–10)", "Kinder (4–10)", "Дети (4–10)")} description={`${entrancePricing ? formatPrice(entrancePricing.youth) : formatPrice(String(youthPrice ?? 0), currency)} ${tr("each", "pro Kind", "за ребёнка")}`} value={youth} onChange={setYouth}/>} {infantPrice !== undefined && <Counter label={ageBands?.infants || tr("Infants", "Kleinkinder", "Младенцы")} description={tr("Free of charge", "Kostenlos", "Бесплатно")} value={infants} onChange={setInfants}/>} {boatOverCapacity ? <p className="pb-4 text-sm font-bold text-rose-700">{boatCapacityNotice(selectedBoat?.capacity)}</p> : null}</div>
        {bookingExtras.length ? <fieldset className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4"><legend className="px-1 text-sm font-black text-slate-900">{tr("Optional add-ons", "Optionale Zusatzleistungen", "Дополнительные опции")}</legend>{bookingExtras.map((option) => <div key={option.id} className="mt-2 rounded-xl bg-white px-3"><Counter label={option.label} description={`${formatPrice(option.price)} ${tr("per person", "pro Person", "за человека")}`} value={extraQuantities[option.id] || 0} onChange={(quantity) => setExtraQuantities((current) => ({ ...current, [option.id]: quantity }))}/></div>)}</fieldset> : null}
        {requiresMarinaTransferChoice ? <fieldset className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4"><legend className="px-1 text-sm font-black text-slate-900">{tr("Do you require transfer to Hurghada marina?", "Benötigst du einen Transfer zum Jachthafen Hurghada?", "Нужен ли вам трансфер до марины Хургады?")}</legend><div className="mt-2 flex gap-5 text-sm"><label><input type="radio" name="marina-transfer" checked={!transferRequired} onChange={() => { setTransferRequired(false); setTransferArea(""); }} className="mr-2 accent-emerald-700"/>{tr("No", "Nein", "Нет")}</label><label><input type="radio" name="marina-transfer" checked={transferRequired} onChange={() => setTransferRequired(true)} className="mr-2 accent-emerald-700"/>{tr("Yes", "Ja", "Да")}</label></div>{transferRequired ? <select required value={transferArea} onChange={(event) => setTransferArea(event.target.value)} className="mt-3 w-full rounded-xl border border-emerald-200 bg-white p-3 text-sm"><option value="">{tr("Select pickup area", "Abholbereich auswählen", "Выберите зону трансфера")}</option>{marinaTransferOptions.map((area) => <option key={area}>{area}</option>)}</select> : null}<p className="mt-2 text-xs text-emerald-900">{tr("Transfer price is confirmed by WhatsApp for the selected area.", "Der Transferpreis für den gewählten Bereich wird per WhatsApp bestätigt.", "Стоимость трансфера для выбранной зоны будет подтверждена в WhatsApp.")}</p></fieldset> : null}
        {extraOptions.length ? <fieldset className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4"><legend className="px-1 text-sm font-black text-slate-900">{tr("Optional extras", "Optionale Extras", "Дополнительные опции")}</legend>{extraOptions.map((option) => <label key={option.id} className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm"><span className="flex items-center gap-3"><input type="checkbox" checked={selectedExtras.includes(option.id)} onChange={(event) => setSelectedExtras((items) => event.target.checked ? [...items, option.id] : items.filter((item) => item !== option.id))} className="h-4 w-4 accent-blue-600" />{de ? option.de : ru ? option.ru : zh ? option.zh : option.en}</span><strong>+{formatPrice(String(option.price * (option.charge === "adult" ? adults : 1)))}</strong></label>)}</fieldset> : null}
        <div className="mt-5 flex items-end justify-between border-t pt-5"><div><p className="font-bold text-slate-900">{tr("Total", "Gesamtpreis", "Итого")}</p><p className="text-xs text-slate-500">{tr("Cash on arrival · no online payment", "Barzahlung bei Ankunft · keine Online-Zahlung", "Оплата наличными по прибытии · без онлайн-оплаты")}</p></div><p className="text-3xl font-black text-blue-700">{formatPrice(String(total), currency)}</p></div>
        {unavailableWeekday ? <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">{tr("This excursion does not operate on the selected weekday. Choose another date.", "Dieser Ausflug findet am gewählten Wochentag nicht statt. Wähle ein anderes Datum.", "Экскурсия не проводится в выбранный день недели. Выберите другую дату.")}</p> : null}
        <button disabled={unavailable || boatOverCapacity || unavailableWeekday} type="button" onClick={() => { if (!adults) return setError(tr("Please select at least one adult.", "Bitte wähle mindestens einen Erwachsenen.", "Выберите хотя бы одного взрослого.")); if (requiresMarinaTransferChoice && transferRequired && !transferArea) return setError(tr("Choose your transfer pickup area.", "Wähle den Abholbereich für den Transfer.", "Выберите зону трансфера.")); trackEvent("booking_start", { value: total, currency, item_name: tourName, booking_type: "tour" }); setStep("checkout"); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400">{unavailable ? tr("Sold out", "Ausverkauft", "Мест нет") : tr("Book now", "Jetzt buchen", "Забронировать")} <Users size={18}/></button>
        <button type="button" onClick={() => {
          if (!adults) return setError(tr("Please select at least one adult.", "Bitte wähle mindestens einen Erwachsenen.", "Выберите хотя бы одного взрослого."));
          if (boatOverCapacity) return setError(boatCapacityError(selectedBoat?.capacity));
          if (requiresMarinaTransferChoice && transferRequired && !transferArea) return setError(tr("Choose your transfer pickup area.", "Wähle den Abholbereich für den Transfer.", "Выберите зону трансфера."));
          addItem({ tourSlug, tourName, destinationSlug, currency, date, time, adults, youth, infants, extras: selectedExtras, selectedBoatOption, extraQuantities, transferRequired, transferArea, subtotal: total, requiresDivingLicense, requiresQuadMinimumAge });
          setCartMessage(tr("Added to your trip cart.", "Zum Reisewarenkorb hinzugefügt.", "Добавлено в корзину поездок.", "تمت الإضافة إلى سلة الرحلات."));
        }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 py-4 font-bold text-blue-800 hover:bg-blue-100">{tr("Add to trip cart", "Zum Reisewarenkorb", "Добавить в корзину", "أضف إلى سلة الرحلات")} <ShoppingCart size={18}/></button>
        {cartMessage ? <p className="mt-3 text-center text-sm font-semibold text-emerald-700">{cartMessage} <Link href={localePath(language, "/cart")} className="underline">{tr("View cart", "Warenkorb ansehen", "Открыть корзину", "عرض السلة")}</Link></p> : null}
        {error && <p role="alert" className="mt-3 text-center text-sm text-rose-600">{error}</p>}
      </> : <form onSubmit={submit} aria-busy={submitting} className="mt-6 space-y-4">
        <input name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="font-bold text-slate-900">{tourName}</p><p className="mt-1 text-sm text-slate-600">{date} {tr("at", "um", "в")} {time} · {travelerText}</p><p className="mt-2 font-black text-blue-700">{formatPrice(String(total), currency)} · {tr("Cash on arrival", "Barzahlung bei Ankunft", "оплата наличными по прибытии")}</p></div>
        <p className="border-b pb-2 text-lg font-black text-slate-950">{tr("Tell us about yourself", "Deine Angaben", "Ваши данные")}</p>
        <p className="text-xs text-slate-500"><RequiredMark/> {tr("Required field", "Pflichtfeld", "Обязательное поле")}</p>
        <label className="block text-sm font-bold text-slate-800">{tr("Full name", "Vollständiger Name", "Полное имя")} <RequiredMark/><input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder={tr("Enter your full name", "Vollständigen Namen eingeben", "Введите имя и фамилию")} /></label>
        <label className="block text-sm font-bold text-slate-800">{tr("Email address", "E-Mail-Adresse", "Электронная почта")} <RequiredMark/><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="you@example.com" /></label>
        <label className="block text-sm font-bold text-slate-800">{tr("WhatsApp number", "WhatsApp-Nummer", "Номер WhatsApp")} <RequiredMark/><input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="+20 103 080 9150" /></label>
        <label className="block text-sm font-bold text-slate-800">{tr("Pickup location", "Abholort", "Место трансфера")} <RequiredMark/><div className="relative mt-1"><Hotel className="absolute left-3 top-3 text-slate-400" size={18}/><input required value={hotel} onChange={(event) => setHotel(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder={tr("Hotel name or full pickup address", "Hotelname oder vollständige Abholadresse", "Название отеля или полный адрес")} /></div>{pickupZones.length ? <span className="mt-1 block text-xs font-normal text-emerald-700">Included pickup zones: {pickupZones.join(", ")}.</span> : <span className="mt-1 block text-xs font-normal text-slate-500">{tr("Required so we can confirm your pickup on WhatsApp.", "Erforderlich, damit wir deine Abholung per WhatsApp bestätigen können.", "Нужно для подтверждения трансфера в WhatsApp.")}</span>}</label>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-bold">{tr("ID or passport required before the trip", "Ausweis oder Reisepass vor dem Ausflug erforderlich", "Необходим документ, удостоверяющий личность, или паспорт")}</p><p className="mt-1">{tr("A valid ID or passport is mandatory for trip permit reasons. Please make sure you have it available before your experience.", "Für die Reisegenehmigung ist ein gültiger Ausweis oder Reisepass erforderlich. Bitte halte ihn vor dem Ausflug bereit.", "Для оформления разрешения на поездку необходим действующий документ, удостоверяющий личность, или паспорт. Пожалуйста, подготовьте его заранее.")}</p></div>
        {requiresDivingLicense ? <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cyan-300 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950"><input type="checkbox" required checked={divingLicenseConfirmed} onChange={(event) => setDivingLicenseConfirmed(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-cyan-700" /><span><strong>{tr("Valid diving license required", "Gültiger Tauchschein erforderlich", "Требуется действующий сертификат дайвера")} <RequiredMark/></strong><span className="mt-1 block">{tr("I confirm that every diver holds a valid scuba diving license and will bring proof on the trip.", "Ich bestätige, dass jeder Taucher einen gültigen Tauchschein besitzt und den Nachweis zum Ausflug mitbringt.", "Я подтверждаю, что у каждого дайвера есть действующий сертификат для подводного плавания, который он возьмёт с собой в поездку.")}</span></span></label> : null}
        {requiresQuadMinimumAge ? <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><input type="checkbox" required checked={quadMinimumAgeConfirmed} onChange={(event) => setQuadMinimumAgeConfirmed(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-amber-700" /><span><strong>{tr("Minimum age: 9 years", "Mindestalter: 9 Jahre", "Минимальный возраст: 9 лет")} <RequiredMark/></strong><span className="mt-1 block">{tr("I confirm that every participant is at least 9 years old.", "Ich bestätige, dass alle Teilnehmer mindestens 9 Jahre alt sind.", "Я подтверждаю, что всем участникам не менее 9 лет.")}</span></span></label> : null}
        <label className="block text-sm font-bold text-slate-800">{tr("Preferred guide language", "Bevorzugte Sprache des Reiseführers", "Предпочитаемый язык гида")}<select value={guideLanguage} onChange={(event) => setGuideLanguage(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option>English</option><option>Arabic</option><option>German</option><option>Russian</option><option>Polish</option><option>Chinese</option></select></label>
        <label className="block text-sm font-bold text-slate-800">{tr("Special requests", "Besondere Wünsche", "Особые пожелания")} <span className="font-normal text-slate-500">({tr("optional", "optional", "необязательно")})</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 h-20 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder={tr("Anything we should know?", "Gibt es etwas, das wir wissen sollten?", "Что нам нужно знать?")} /></label>
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">{tr("Before booking, please review our", "Bitte lies vor der Buchung unsere", "Перед бронированием ознакомьтесь с")} <Link href={localePath(language, "/terms-conditions#cancellations")} target="_blank" className="font-bold text-blue-700 underline">{tr("cancellation policy", "Stornierungsbedingungen", "правилами отмены")}</Link>. {tr("By submitting, you agree to our terms and conditions.", "Mit dem Absenden stimmst du unseren Allgemeinen Geschäftsbedingungen zu.", "Отправляя заявку, вы соглашаетесь с нашими условиями.")}</p>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white disabled:opacity-60">{submitting ? tr("Sending booking…", "Buchung wird gesendet…", "Отправка бронирования…") : `${tr("Confirm booking", "Buchung bestätigen", "Подтвердить бронирование")} · ${formatPrice(String(total), currency)}`} <MessageCircle size={18}/></button>
        <button type="button" onClick={() => setStep("select")} className="w-full text-sm font-semibold text-slate-600 hover:text-blue-700">← {tr("Change date or travelers", "Datum oder Reisende ändern", "Изменить дату или гостей")}</button>
        <p className="text-center text-xs leading-5 text-slate-500">{tr("Your booking is reserved now. You pay cash when you arrive; we confirm pickup via WhatsApp.", "Deine Buchung ist reserviert. Du bezahlst bei Ankunft bar; wir bestätigen die Abholung per WhatsApp.", "Заявка на бронирование принята. Оплата наличными по прибытии; трансфер мы подтвердим в WhatsApp.")}</p>
      </form>}
    </div>
  );
}

function RequiredMark() {
  return <span aria-hidden="true" className="text-rose-600">*</span>;
}
