"use client";

import { type FormEvent, type ReactNode, useMemo, useRef, useState } from "react";
import { CalendarDays, Car, Clock3, Hotel, MapPin, MessageCircle, Phone, Plane, User, Users } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { localePath } from "@/lib/i18n";
import { confirmationStorageKey } from "@/lib/booking-confirmation";
import { isTransferLeadTimeValid, minimumTransferSlot } from "@/lib/booking-validation";

const areas = ["Hurghada Airport", "Hurghada Hotels", "Senzo Mall", "Makadi Bay", "Sahl Hasheesh", "El Gouna", "Soma Bay"];
const resortZones = new Set(["Makadi Bay", "Sahl Hasheesh", "El Gouna", "Soma Bay"]);
type TransferService = "airport" | "senzo";

const arabicTransferCopy: Record<string, string> = {
  "Small car": "سيارة صغيرة", "Larger vehicle": "سيارة أكبر", "Private car": "سيارة خاصة",
  "Book a private transfer": "احجز توصيلاً خاصاً", "Choose your service and see the fixed one-way fare instantly.": "اختر الخدمة وشاهد سعر الاتجاه الواحد فوراً.",
  "Airport transfer": "توصيل المطار", "Senzo Mall transfer": "توصيل سنزو مول", "one way within Hurghada": "اتجاه واحد داخل الغردقة",
  "Required field": "حقل مطلوب", "Pickup location": "مكان الاستلام", "Pickup hotel / full address": "فندق الاستلام / العنوان الكامل",
  "Required pickup details": "تفاصيل الاستلام المطلوبة", "Drop-off location": "مكان الوصول", "Transfer date": "تاريخ التوصيل",
  "Pickup time": "وقت الاستلام", "Please book at least 1 hour before pickup.": "يرجى الحجز قبل موعد الاستلام بساعة واحدة على الأقل.",
  "Passengers": "الركاب", " (maximum 4)": " (بحد أقصى 4)", "Travel bags": "حقائب السفر", "Flight number (optional)": "رقم الرحلة (اختياري)",
  "Your name": "اسمك", "WhatsApp number": "رقم واتساب", "Email address": "البريد الإلكتروني", "Notes (optional)": "ملاحظات (اختياري)",
  "Add luggage, child seat, or any special request.": "أضف مقعد طفل أو أي طلب خاص.", "Before booking, please review our": "قبل الحجز، راجع",
  "cancellation policy": "سياسة الإلغاء", "By submitting, you agree to our terms and conditions.": "بإرسال الطلب، توافق على الشروط والأحكام.",
  "Sending transfer request…": "جارٍ إرسال طلب التوصيل…", "Book one way": "احجز اتجاهاً واحداً",
};
const chineseTransferCopy: Record<string, string> = {
  "Small car": "小型车辆", "Larger vehicle": "大型车辆", "Private car": "私人车辆", "Book a private transfer": "预订私人接送", "Choose your service and see the fixed one-way fare instantly.": "选择服务，即刻查看单程固定价格。", "Airport transfer": "机场接送", "Senzo Mall transfer": "Senzo Mall 接送", "one way within Hurghada": "赫尔格达市内单程", "Required field": "必填项", "Pickup location": "上车地点", "Pickup hotel / full address": "上车酒店／完整地址", "Required pickup details": "请填写准确的上车信息", "Drop-off location": "下车地点", "Transfer date": "接送日期", "Pickup time": "上车时间", "Please book at least 1 hour before pickup.": "请至少提前 1 小时预订。", "Passengers": "乘客", " (maximum 4)": "（最多 4 人）", "Travel bags": "旅行行李", "Flight number (optional)": "航班号（选填）", "Your name": "您的姓名", "WhatsApp number": "WhatsApp 号码", "Email address": "电子邮箱", "Notes (optional)": "备注（选填）", "Add luggage, child seat, or any special request.": "请填写儿童座椅或其他特别要求。", "Before booking, please review our": "预订前请查看我们的", "cancellation policy": "取消政策", "By submitting, you agree to our terms and conditions.": "提交即表示您同意我们的条款与条件。", "Sending transfer request…": "正在提交接送请求…", "Book one way": "预订单程接送", "Airport transfers must start or finish at Hurghada Airport.": "机场接送必须从赫尔格达机场出发或在机场结束。", "Senzo transfers must start or finish at Senzo Mall.": "Senzo 接送必须从 Senzo Mall 出发或在商场结束。", "We need at least 1 hour to arrange your transfer. Please choose a later pickup time.": "我们至少需要 1 小时安排接送，请选择更晚的上车时间。", "We could not reach the booking service. Check your connection and try again.": "无法连接预订服务，请检查网络后重试。",
};
const polishTransferCopy: Record<string, string> = {
  "Small car": "Mały samochód", "Larger vehicle": "Większy pojazd", "Private car": "Prywatny samochód", "Book a private transfer": "Zarezerwuj prywatny transfer", "Choose your service and see the fixed one-way fare instantly.": "Wybierz usługę i od razu zobacz stałą cenę przejazdu w jedną stronę.", "Airport transfer": "Transfer lotniskowy", "Senzo Mall transfer": "Transfer do Senzo Mall", "one way within Hurghada": "w jedną stronę w Hurghadzie", "Required field": "Pole wymagane", "Pickup location": "Miejsce odbioru", "Pickup hotel / full address": "Hotel odbioru / pełny adres", "Required pickup details": "Wymagane dane odbioru", "Drop-off location": "Miejsce docelowe", "Transfer date": "Data transferu", "Pickup time": "Godzina odbioru", "Please book at least 1 hour before pickup.": "Zarezerwuj co najmniej 1 godzinę przed odbiorem.", "Passengers": "Pasażerowie", " (maximum 4)": " (maksymalnie 4)", "Travel bags": "Bagaże podróżne", "Flight number (optional)": "Numer lotu (opcjonalnie)", "Your name": "Imię i nazwisko", "WhatsApp number": "Numer WhatsApp", "Email address": "Adres e-mail", "Notes (optional)": "Uwagi (opcjonalnie)", "Add luggage, child seat, or any special request.": "Dodaj fotelik dziecięcy lub inne życzenie.", "Before booking, please review our": "Przed rezerwacją przeczytaj", "cancellation policy": "zasady anulowania", "By submitting, you agree to our terms and conditions.": "Wysyłając formularz, akceptujesz regulamin.", "Sending transfer request…": "Wysyłanie prośby o transfer…", "Book one way": "Zarezerwuj przejazd", "Airport transfers must start or finish at Hurghada Airport.": "Transfer lotniskowy musi zaczynać się lub kończyć na lotnisku w Hurghadzie.", "Senzo transfers must start or finish at Senzo Mall.": "Transfer do Senzo musi zaczynać się lub kończyć w Senzo Mall.", "We need at least 1 hour to arrange your transfer. Please choose a later pickup time.": "Potrzebujemy co najmniej godziny na organizację transferu. Wybierz późniejszą godzinę.", "We could not reach the booking service. Check your connection and try again.": "Nie udało się połączyć z usługą rezerwacji. Sprawdź połączenie i spróbuj ponownie."
};

export default function TransferBookingForm({ initialService = "airport" }: { initialService?: TransferService }) {
  const idempotencyKey = useRef<string | null>(null);
  const router = useRouter();
  const { language } = useSiteSettings();
  const de = language === "de";
  const ru = language === "ru";
  const ar = language === "ar";
  const pl = language === "pl";
  const zh = language === "zh";
  const tr = (en: string, deText: string, ruText: string, arText = arabicTransferCopy[en] || en) => de ? deText : ru ? ruText : ar ? arText : pl ? polishTransferCopy[en] || en : zh ? chineseTransferCopy[en] || en : en;
  const [service, setService] = useState<TransferService>(initialService);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickup, setPickup] = useState(initialService === "airport" ? "Hurghada Airport" : "Hurghada Hotels");
  const [pickupDetails, setPickupDetails] = useState("");
  const [dropoff, setDropoff] = useState(initialService === "airport" ? "Hurghada Hotels" : "Senzo Mall");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [travelBags, setTravelBags] = useState(initialService === "airport" ? "1" : "0");
  const [flight, setFlight] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [website, setWebsite] = useState("");
  const passengerCount = Math.max(1, Number.parseInt(passengers, 10) || 1);
  const bagCount = Math.max(0, Number.parseInt(travelBags, 10) || 0);
  const baseFare = service === "airport" ? 20 : 10;
  const resortSupplement = resortZones.has(pickup) || resortZones.has(dropoff) ? 7 : 0;
  const total = baseFare + resortSupplement;
  const vehicle = service === "airport" ? (passengerCount <= 2 ? tr("Small car", "Kleinwagen", "Легковой автомобиль") : tr("Larger vehicle", "Größeres Fahrzeug", "Автомобиль повышенной вместимости")) : tr("Private car", "Privatwagen", "Частный автомобиль");
  const serviceAreas = service === "airport" ? areas.filter((area) => area !== "Senzo Mall") : areas.filter((area) => area !== "Hurghada Airport");
  const routeIsValid = useMemo(() => {
    if (pickup === dropoff) return false;
    return service === "airport"
      ? pickup === "Hurghada Airport" || dropoff === "Hurghada Airport"
      : pickup === "Senzo Mall" || dropoff === "Senzo Mall";
  }, [dropoff, pickup, service]);
  const minimumSlot = minimumTransferSlot();

  function changeService(nextService: TransferService) {
    setService(nextService);
    if (nextService === "airport") {
      setPickup("Hurghada Airport");
      setDropoff("Hurghada Hotels");
      setTravelBags("1");
    } else {
      setPickup("Hurghada Hotels");
      setDropoff("Senzo Mall");
      setPassengers((value) => String(Math.min(Number(value) || 1, 4)));
      setTravelBags("0");
    }
  }

  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!routeIsValid) {
      alert(service === "airport" ? tr("Airport transfers must start or finish at Hurghada Airport.", "Flughafentransfers müssen am Flughafen Hurghada beginnen oder enden.", "Трансфер должен начинаться или заканчиваться в аэропорту Хургады.") : tr("Senzo transfers must start or finish at Senzo Mall.", "Senzo-Transfers müssen an der Senzo Mall beginnen oder enden.", "Трансфер должен начинаться или заканчиваться у Senzo Mall."));
      return;
    }
    if (!isTransferLeadTimeValid(date, time)) {
      alert(tr("We need at least 1 hour to arrange your transfer. Please choose a later pickup time.", "Wir benötigen mindestens 1 Stunde, um deinen Transfer zu organisieren. Bitte wähle eine spätere Abholzeit.", "Нам требуется не менее 1 часа для организации трансфера. Выберите более позднее время."));
      return;
    }
    if (service === "senzo" && passengerCount > 4) {
      alert(de ? "Senzo-Mall-Transfers sind für maximal 4 Fahrgäste möglich." : "Senzo Mall transfers allow a maximum of 4 passengers.");
      return;
    }
    if (service === "senzo" && bagCount > 0) {
      alert(de ? "Bei Senzo-Mall-Transfers sind keine Reisekoffer erlaubt." : "Senzo Mall transfers do not allow travel bags.");
      return;
    }
    if (service === "airport" && passengerCount <= 2 && bagCount > 2) {
      alert(de ? "Im Kleinwagen sind maximal 2 Reisekoffer erlaubt. Reduziere die Anzahl oder buche für mindestens 3 Fahrgäste ein größeres Fahrzeug." : "The small car allows a maximum of 2 travel bags. Reduce the bags or add a third passenger to request a larger vehicle.");
      return;
    }
    if (service === "airport" && passengerCount > 2 && bagCount > passengerCount * 2) {
      alert(de ? "Im größeren Fahrzeug sind maximal 2 Reisekoffer pro Fahrgast erlaubt." : "The larger vehicle allows a maximum of 2 travel bags per passenger.");
      return;
    }

    const serviceName = service === "airport" ? "Hurghada Airport one-way transfer" : "Senzo Mall one-way transfer";
    trackEvent("booking_start", { booking_type: "transfer", item_name: serviceName, value: total, currency: "USD" });

    setSubmitting(true);
    try {
      idempotencyKey.current ||= crypto.randomUUID();
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          type: "transfer",
          locale: language,
          customerName: name.trim(),
          phone: phone.trim(),
          customerEmail: email.trim(),
          tourName: serviceName,
          location: `${pickup} to ${dropoff}`,
          duration: "One way",
          price: `$${total.toFixed(2)} fixed one-way fare`,
          guests: passengers,
          date,
          time,
          hotel: `${pickup}: ${pickupDetails.trim()} → ${dropoff}`,
          message: `Service: ${serviceName}\nFare: $${total.toFixed(2)} (${resortSupplement ? `$${baseFare} base + $7 resort supplement` : `$${baseFare} base`})\nVehicle: ${vehicle}\nTravel bags: ${bagCount}\nNotes: ${notes.trim() || "None"}\nPassengers: ${passengers}\nFlight: ${flight.trim() || "Not provided"}\nTime: ${time}`,
          service,
          pickup,
          dropoff,
          passengers: passengerCount,
          travelBags: bagCount,
          website,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.error || "Transfer request failed. Please try again.");
        return;
      }

      trackEvent("booking_complete", { transaction_id: data.reference, booking_type: "transfer", item_name: serviceName, value: total, currency: "USD" });

      if (!data.whatsappSent && data.whatsappUrl) window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      window.sessionStorage.setItem(confirmationStorageKey(data.reference), JSON.stringify({
        reference: data.reference,
        customerName: name.trim(),
        serviceName,
        date,
        time,
        travelers: `${passengers} ${de ? "Fahrgäste" : ru ? "пасс." : zh ? "位乘客" : "passengers"}`,
        total: `$${total.toFixed(2)}`,
        customerEmailSent: Boolean(data.customerEmailSent),
        whatsappSent: Boolean(data.whatsappSent),
        bookingConfirmationPdf: String(data.bookingConfirmationPdf || ""),
      }));
      router.push(`${localePath(language, "/booking/confirmation")}?reference=${encodeURIComponent(data.reference)}`);
    } catch {
      alert(tr("We could not reach the booking service. Check your connection and try again.", "Der Buchungsservice ist nicht erreichbar. Prüfe deine Verbindung und versuche es erneut.", "Не удалось связаться с сервисом бронирования. Проверьте соединение и попробуйте снова."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submitTransfer} aria-busy={submitting} className="rounded-3xl bg-white p-6 shadow-2xl md:p-8">
      <input name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-blue-100 p-3 text-blue-700"><Car /></div>
        <div><h2 className="text-2xl font-bold text-slate-900">{tr("Book a private transfer", "Privaten Transfer buchen", "Забронировать частный трансфер")}</h2><p className="mt-1 text-sm text-slate-600">{tr("Choose your service and see the fixed one-way fare instantly.", "Wähle den Service und sieh sofort den festen Preis für eine einfache Fahrt.", "Выберите услугу и сразу узнайте фиксированную цену поездки в одну сторону.")}</p></div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => changeService("airport")} className={`rounded-2xl border p-4 text-left transition ${service === "airport" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300"}`}><span className="block font-bold text-slate-900">{tr("Airport transfer", "Flughafentransfer", "Трансфер из аэропорта")}</span><span className="mt-1 block text-sm text-slate-600">$20 {tr("one way within Hurghada", "einfache Fahrt innerhalb Hurghadas", "в одну сторону по Хургаде")}</span></button>
        <button type="button" onClick={() => changeService("senzo")} className={`rounded-2xl border p-4 text-left transition ${service === "senzo" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300"}`}><span className="block font-bold text-slate-900">{tr("Senzo Mall transfer", "Senzo-Mall-Transfer", "Трансфер в Senzo Mall")}</span><span className="mt-1 block text-sm text-slate-600">$10 {tr("one way within Hurghada", "einfache Fahrt innerhalb Hurghadas", "в одну сторону по Хургаде")}</span></button>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <p className="text-xs text-slate-500 sm:col-span-2"><RequiredMark/> {tr("Required field", "Pflichtfeld", "Обязательное поле")}</p>
        <Field required icon={<MapPin />} label={tr("Pickup location", "Abholort", "Место отправления")}><select value={pickup} onChange={(event) => setPickup(event.target.value)} required>{serviceAreas.map((area) => <option key={area}>{area}</option>)}</select></Field>
        <Field required icon={<Hotel />} label={tr("Pickup hotel / full address", "Abholhotel / vollständige Adresse", "Отель / полный адрес подачи")}><input type="text" value={pickupDetails} onChange={(event) => setPickupDetails(event.target.value)} placeholder={tr("Required pickup details", "Erforderliche Abholdetails", "Укажите точное место подачи")} required /></Field>
        <Field required icon={<Hotel />} label={tr("Drop-off location", "Zielort", "Место назначения")}><select value={dropoff} onChange={(event) => setDropoff(event.target.value)} required>{serviceAreas.map((area) => <option key={area}>{area}</option>)}</select></Field>
        <Field required icon={<CalendarDays />} label={tr("Transfer date", "Transferdatum", "Дата трансфера")}><input type="date" value={date} onChange={(event) => setDate(event.target.value)} min={minimumSlot.date} required /></Field>
        <Field required icon={<Clock3 />} label={tr("Pickup time", "Abholzeit", "Время подачи")}><input type="time" value={time} onChange={(event) => setTime(event.target.value)} min={date === minimumSlot.date ? minimumSlot.time : undefined} required /><p className="mt-2 text-xs leading-5 text-amber-700">{tr("Please book at least 1 hour before pickup.", "Bitte mindestens 1 Stunde Vorlaufzeit einplanen.", "Бронируйте минимум за 1 час до подачи.")}</p></Field>
        <Field required icon={<Users />} label={`${tr("Passengers", "Fahrgäste", "Пассажиры")}${service === "senzo" ? tr(" (maximum 4)", " (maximal 4)", " (максимум 4)") : ""}`}><input type="number" min="1" max={service === "senzo" ? 4 : undefined} step="1" value={passengers} onChange={(event) => setPassengers(event.target.value)} required /></Field>
        <Field required icon={<Car />} label={tr("Travel bags", "Reisekoffer", "Дорожные чемоданы")}><input type="number" min="0" max={service === "senzo" ? 0 : passengerCount <= 2 ? 2 : passengerCount * 2} step="1" value={travelBags} onChange={(event) => setTravelBags(event.target.value)} disabled={service === "senzo"} required /></Field>
        <Field icon={<Plane />} label={tr("Flight number (optional)", "Flugnummer (optional)", "Номер рейса (необязательно)")}><input type="text" value={flight} onChange={(event) => setFlight(event.target.value)} placeholder="MS 045" /></Field>
        <Field required icon={<User />} label={tr("Your name", "Dein Name", "Ваше имя")}><input type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></Field>
        <Field required icon={<Phone />} label={tr("WhatsApp number", "WhatsApp-Nummer", "Номер WhatsApp")}><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required /></Field>
        <Field required icon={<MessageCircle />} label={tr("Email address", "E-Mail-Adresse", "Электронная почта")}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required /></Field>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start justify-between gap-5"><div><p className="font-bold text-slate-950">{service === "airport" ? (de ? "Flughafen – einfache Fahrt" : "Airport one-way fare") : (de ? "Senzo Mall – einfache Fahrt" : "Senzo Mall one-way fare")}</p><p className="mt-1 text-sm leading-6 text-slate-600">{resortSupplement ? (de ? `Enthält den Zuschlag von $7 für ${resortZones.has(pickup) ? pickup : dropoff}.` : `Includes the $7 supplement for ${resortZones.has(pickup) ? pickup : dropoff}.`) : (de ? "Hurghada-Basiszone – kein Zuschlag." : "Hurghada base zone—no supplement.")}</p></div><p className="text-3xl font-black text-blue-700">${total.toFixed(2)}</p></div>
        <div className="mt-4 border-t border-blue-200 pt-4 text-sm text-slate-700"><p><strong>{de ? "Fahrzeug:" : "Vehicle:"}</strong> {vehicle}</p>{service === "airport" ? <p className="mt-1">{de ? "1–2 Fahrgäste: Kleinwagen, maximal 2 Koffer. Mehr als 2 Fahrgäste: größeres Fahrzeug, maximal 2 Koffer pro Person." : "1–2 passengers: small car, maximum 2 bags. More than 2 passengers: larger vehicle, maximum 2 bags per person."}</p> : <p className="mt-1">{de ? "Maximal 4 Fahrgäste. Reisekoffer sind nicht erlaubt." : "Maximum 4 passengers. Travel bags are not accepted."}</p>}</div>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="transfer-notes">{tr("Notes (optional)", "Hinweise (optional)", "Примечания (необязательно)")}</label>
      <textarea id="transfer-notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500" placeholder={tr("Add luggage, child seat, or any special request.", "Kindersitz oder besondere Wünsche hinzufügen.", "Укажите детское кресло или другие пожелания.")} />
      <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">{tr("Before booking, please review our", "Bitte lies vor der Buchung unsere", "Перед бронированием ознакомьтесь с")} <Link href={localePath(language, "/terms-conditions#cancellations")} target="_blank" className="font-bold text-blue-700 underline">{tr("cancellation policy", "Stornierungsbedingungen", "правилами отмены")}</Link>. {tr("By submitting, you agree to our terms and conditions.", "Mit dem Absenden stimmst du unseren Allgemeinen Geschäftsbedingungen zu.", "Отправляя заявку, вы соглашаетесь с нашими условиями.")}</p>
      <button type="submit" disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"><MessageCircle size={20} />{submitting ? tr("Sending transfer request…", "Transferanfrage wird gesendet…", "Отправка заявки…") : `${tr("Book one way", "Einfache Fahrt buchen", "Забронировать поездку")} · $${total.toFixed(2)}`}</button>
    </form>
  );
}

function Field({ icon, label, children, required = false }: { icon: ReactNode; label: string; children: ReactNode; required?: boolean }) {
  return <label className="block text-sm font-medium text-slate-700"><span className="mb-2 flex items-center gap-2 text-slate-700"><span className="text-blue-600">{icon}</span>{label}{required ? <RequiredMark/> : null}</span><div className="[&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-slate-200 [&>input]:p-3 [&>input]:outline-none [&>input]:focus:border-blue-500 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-slate-200 [&>select]:bg-white [&>select]:p-3 [&>select]:outline-none [&>select]:focus:border-blue-500">{children}</div></label>;
}

function RequiredMark() {
  return <span aria-hidden="true" className="text-rose-600">*</span>;
}
