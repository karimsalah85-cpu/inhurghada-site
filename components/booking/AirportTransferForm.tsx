"use client";

import { type FormEvent, type ReactNode, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Car, Clock3, Hotel, Luggage, MessageCircle, Plane, Users } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { localePath } from "@/lib/i18n";
import { confirmationStorageKey } from "@/lib/booking-confirmation";
import { isTransferLeadTimeValid, minimumTransferSlot } from "@/lib/booking-validation";
import PhoneNumberInput from "@/components/booking/PhoneNumberInput";
import { validatePhoneNumber } from "@/lib/phone";
import {
  TRANSFER_ZONE_KEYS,
  mapHotelToZone,
  type OversizedItemType,
  type TransferZoneKey,
} from "@/lib/transfer-config";
import { calculateTransferQuote } from "@/lib/transfer-quote";

type Locale = "en" | "de" | "ru" | "ar" | "pl" | "zh";

const ZONE_LABELS: Record<TransferZoneKey, string> = {
  hurghada_city: "Hurghada City / Marina / Mamsha / Village Road",
  el_ahyaa: "El Ahyaa / North Hurghada",
  sahl_hasheesh: "Sahl Hasheesh",
  makadi_bay: "Makadi Bay",
  el_gouna: "El Gouna",
  soma_bay: "Soma Bay",
  safaga: "Safaga",
  el_quseir: "El Quseir",
  port_ghalib: "Port Ghalib",
  marsa_alam: "Marsa Alam",
};

const VEHICLE_LABELS: Record<string, string> = {
  sedan: "Private Sedan",
  suv: "Private SUV",
  minivan: "Private Minivan",
  hiace: "Private Hiace / Van",
  minibus: "Private Minibus",
};

const OVERSIZED_TYPES: OversizedItemType[] = [
  "golf_bag",
  "kitesurf",
  "windsurf",
  "diving_equipment",
  "bicycle",
  "surfboard",
  "wheelchair",
  "baby_stroller",
  "other",
];

// English strings. Other locales override the most visible keys; anything not
// listed falls back to English so the flow is never broken by a missing string.
const EN = {
  heading: "Book a private airport transfer",
  sub: "Price is per vehicle and per journey — not per person. We match the vehicle to your group and luggage.",
  journey: "Journey",
  oneWay: "One way",
  roundTrip: "Round trip",
  direction: "Direction",
  airportToHotel: "Hurghada Airport → Hotel",
  hotelToAirport: "Hotel → Hurghada Airport",
  hotelToHotel: "Hotel → Hotel",
  hotel: "Hotel / resort / accommodation",
  hotelPlaceholder: "e.g. Steigenberger Aqua Magic, Hurghada",
  zone: "Pricing area",
  zoneAuto: "Detected from your hotel",
  zoneManual: "Select the closest area",
  date: "Arrival date",
  time: "Arrival / pickup time",
  leadTime: "Please allow at least 1 hour before pickup.",
  flight: "Flight number (for airport pickups)",
  returnDate: "Return date",
  returnTime: "Return pickup time",
  returnFlight: "Return flight number",
  returnHint: "Give the time you want to be collected from the hotel, not the flight departure time.",
  paxLuggage: "Passengers & luggage",
  adults: "Adults",
  children: "Children",
  infants: "Infants / babies",
  paxNote: "Adults, children and infants all take a seat and count toward vehicle capacity.",
  largeBags: "Large suitcases / checked bags",
  cabinBags: "Small cabin bags / backpacks",
  oversizedToggle: "I am travelling with oversized equipment",
  oversizedNote: "Vehicle selection depends on both passenger and luggage capacity.",
  otherLabel: "Describe the item",
  seatsToggle: "I need child seats",
  seatsNote: "Child and baby seats must be requested in advance and are subject to availability. Seats are free.",
  infantSeat: "Infant seat",
  childSeat: "Child seat",
  boosterSeat: "Booster seat",
  wheelchair: "Wheelchair / mobility equipment",
  wcNone: "None",
  wcFolding: "Folding manual wheelchair",
  wcPowered: "Powered wheelchair / mobility scooter / must stay seated in wheelchair",
  vehiclePrice: "Recommended vehicle & price",
  yourGroup: "Your group",
  upTo: "Up to",
  passengers: "passengers",
  suitcases: "large suitcases",
  privateNotShared: "Private transfer — not shared, not per person",
  totalLabel: "Transfer price",
  total: "total",
  twoVehicles: "2 private vehicles will be dispatched for your group.",
  manualTitle: "Request a transfer quote",
  manualBody: "This trip needs a quick check by our team before we can confirm the vehicle and price. Send the request and we will reply on WhatsApp.",
  reason_powered_wheelchair: "Accessible vehicle confirmation required for a powered wheelchair or scooter.",
  reason_route_not_mapped: "We could not match your accommodation to a pricing area.",
  reason_hotel_to_hotel: "Hotel-to-hotel private transfers are quoted individually.",
  reason_oversized_needs_confirmation: "The declared oversized equipment needs a vehicle check.",
  reason_group_exceeds_fleet: "Large group — we will arrange the right combination of vehicles.",
  reason_luggage_exceeds_fleet: "That much luggage needs a vehicle check.",
  reason_zone_unpriced: "This route is quoted individually.",
  reason_invalid_passengers: "Add at least one adult passenger.",
  warn_multiple_vehicles: "Your group requires 2 vehicles.",
  warn_vehicle_upsized_for_luggage: "We upgraded your vehicle so the luggage fits safely.",
  warn_folding_wheelchair_space: "We have reserved boot space for a folding wheelchair.",
  warn_oversized_declared: "Thanks for declaring oversized equipment — we will send a suitable vehicle.",
  contact: "Your details",
  name: "Full name",
  phone: "WhatsApp number",
  phoneHint: "We use this for booking confirmation and pickup details.",
  email: "Email address",
  notes: "Special requests (optional)",
  review: "Review & confirm",
  cancellationBefore: "Before booking, please review our",
  cancellation: "cancellation policy",
  agree: "By submitting, you agree to our terms and conditions.",
  submit: "Request transfer",
  submitting: "Sending transfer request…",
  errRoute: "Choose your journey and accommodation.",
  errLead: "We need at least 1 hour to arrange your transfer. Choose a later pickup time.",
  errReturnLead: "The return transfer also needs at least 1 hour of notice.",
  errPhone: "Please enter a valid WhatsApp phone number including the country code.",
  errGeneric: "Transfer request failed. Please try again.",
  errNetwork: "We could not reach the booking service. Check your connection and try again.",
  oversizedLabels: {
    golf_bag: "Golf bag",
    kitesurf: "Kite-surfing equipment",
    windsurf: "Windsurfing equipment",
    diving_equipment: "Diving equipment",
    bicycle: "Bicycle",
    surfboard: "Surfboard",
    wheelchair: "Wheelchair",
    baby_stroller: "Baby stroller",
    other: "Other oversized baggage",
  } as Record<OversizedItemType, string>,
};

type CopyShape = typeof EN;

const OVERRIDES: Partial<Record<Locale, Partial<CopyShape>>> = {
  ar: {
    heading: "احجز خدمة نقل خاصة من المطار",
    sub: "السعر لكل مركبة ولكل رحلة، وليس لكل شخص. نختار المركبة المناسبة لمجموعتك وأمتعتك.",
    oneWay: "اتجاه واحد",
    roundTrip: "ذهاب وعودة",
    direction: "الاتجاه",
    airportToHotel: "مطار الغردقة ← الفندق",
    hotelToAirport: "الفندق ← مطار الغردقة",
    hotel: "الفندق / المنتجع / مكان الإقامة",
    zone: "منطقة التسعير",
    date: "تاريخ الوصول",
    time: "وقت الوصول / الاستلام",
    adults: "بالغون",
    children: "أطفال",
    infants: "رُضّع",
    largeBags: "حقائب كبيرة",
    cabinBags: "حقائب يد صغيرة",
    totalLabel: "سعر النقل",
    total: "الإجمالي",
    privateNotShared: "نقل خاص — ليس مشتركاً وليس للفرد",
    contact: "بياناتك",
    name: "الاسم الكامل",
    phone: "رقم واتساب",
    email: "البريد الإلكتروني",
    submit: "اطلب خدمة النقل",
  },
  de: {
    heading: "Privaten Flughafentransfer buchen",
    sub: "Preis pro Fahrzeug und pro Fahrt – nicht pro Person. Wir wählen das passende Fahrzeug für Gruppe und Gepäck.",
    oneWay: "Einfache Fahrt",
    roundTrip: "Hin- und Rückfahrt",
    direction: "Richtung",
    airportToHotel: "Flughafen Hurghada → Hotel",
    hotelToAirport: "Hotel → Flughafen Hurghada",
    hotel: "Hotel / Resort / Unterkunft",
    zone: "Preiszone",
    date: "Ankunftsdatum",
    time: "Ankunfts-/Abholzeit",
    adults: "Erwachsene",
    children: "Kinder",
    infants: "Kleinkinder",
    largeBags: "Große Koffer",
    cabinBags: "Kleine Handgepäckstücke",
    totalLabel: "Transferpreis",
    total: "gesamt",
    privateNotShared: "Privattransfer – nicht geteilt, nicht pro Person",
    contact: "Deine Daten",
    name: "Vollständiger Name",
    phone: "WhatsApp-Nummer",
    email: "E-Mail-Adresse",
    submit: "Transfer anfragen",
  },
  ru: {
    heading: "Забронировать частный трансфер из аэропорта",
    sub: "Цена за автомобиль и за поездку — не за человека. Подбираем автомобиль под группу и багаж.",
    oneWay: "В одну сторону",
    roundTrip: "Туда и обратно",
    adults: "Взрослые",
    children: "Дети",
    infants: "Младенцы",
    largeBags: "Большие чемоданы",
    cabinBags: "Ручная кладь",
    totalLabel: "Цена трансфера",
    total: "итого",
    privateNotShared: "Частный трансфер — не общий и не за человека",
    contact: "Ваши данные",
    submit: "Запросить трансфер",
  },
  pl: {
    heading: "Zarezerwuj prywatny transfer z lotniska",
    sub: "Cena za pojazd i za przejazd — nie za osobę. Dobieramy pojazd do grupy i bagażu.",
    oneWay: "W jedną stronę",
    roundTrip: "W obie strony",
    adults: "Dorośli",
    children: "Dzieci",
    infants: "Niemowlęta",
    largeBags: "Duże walizki",
    cabinBags: "Małe bagaże podręczne",
    totalLabel: "Cena transferu",
    total: "razem",
    privateNotShared: "Transfer prywatny — nie wspólny i nie za osobę",
    contact: "Twoje dane",
    submit: "Zapytaj o transfer",
  },
  zh: {
    heading: "预订私人机场接送",
    sub: "价格按车辆、按行程计算，而非按人。我们会根据人数和行李匹配车辆。",
    oneWay: "单程",
    roundTrip: "往返",
    adults: "成人",
    children: "儿童",
    infants: "婴儿",
    largeBags: "大件行李箱",
    cabinBags: "小件随身行李",
    totalLabel: "接送价格",
    total: "合计",
    privateNotShared: "私人接送 — 非拼车、非按人计价",
    contact: "您的信息",
    submit: "申请接送",
  },
};

function useCopy(language: Locale) {
  return useMemo(() => ({ ...EN, ...(OVERRIDES[language] ?? {}) }) as CopyShape, [language]);
}

type Direction = "airport_to_hotel" | "hotel_to_airport" | "hotel_to_hotel";
type Wheelchair = "none" | "folding_manual" | "powered_or_fixed";

export default function AirportTransferForm() {
  const router = useRouter();
  const { language } = useSiteSettings();
  const copy = useCopy(language as Locale);
  const idempotencyKey = useRef<string | null>(null);
  const minimumSlot = minimumTransferSlot();

  const [tripType, setTripType] = useState<"one_way" | "round_trip">("one_way");
  const [direction, setDirection] = useState<Direction>("airport_to_hotel");
  const [hotelName, setHotelName] = useState("");
  const [zoneOverride, setZoneOverride] = useState<TransferZoneKey | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [returnFlightNumber, setReturnFlightNumber] = useState("");

  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [largeBags, setLargeBags] = useState(2);
  const [cabinBags, setCabinBags] = useState(0);

  const [oversizedOpen, setOversizedOpen] = useState(false);
  const [oversized, setOversized] = useState<Partial<Record<OversizedItemType, number>>>({});
  const [otherNote, setOtherNote] = useState("");
  const [seatsOpen, setSeatsOpen] = useState(false);
  const [infantSeat, setInfantSeat] = useState(0);
  const [childSeat, setChildSeat] = useState(0);
  const [boosterSeat, setBoosterSeat] = useState(0);
  const [wheelchair, setWheelchair] = useState<Wheelchair>("none");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const autoZone = mapHotelToZone(hotelName);
  const zone: TransferZoneKey | null = direction === "hotel_to_hotel" ? null : zoneOverride || autoZone;

  const oversizedItems = useMemo(
    () =>
      (Object.entries(oversized) as [OversizedItemType, number][])
        .filter(([, quantity]) => quantity > 0)
        .map(([type, quantity]) => ({ type, quantity })),
    [oversized],
  );

  const quote = useMemo(
    () =>
      calculateTransferQuote({
        direction,
        zone,
        tripType,
        adults,
        children,
        infants,
        largeBags,
        cabinBags,
        oversizedItems,
        childSeats: { infant: infantSeat, child: childSeat, booster: boosterSeat },
        wheelchair,
      }),
    [direction, zone, tripType, adults, children, infants, largeBags, cabinBags, oversizedItems, infantSeat, childSeat, boosterSeat, wheelchair],
  );

  const totalPassengers = adults + children + infants;

  function bumpOversized(type: OversizedItemType, delta: number) {
    setOversized((current) => {
      const next = Math.max(0, Math.min(20, (current[type] ?? 0) + delta));
      return { ...current, [type]: next };
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (direction !== "hotel_to_hotel" && !hotelName.trim()) {
      alert(copy.errRoute);
      return;
    }
    if (!isTransferLeadTimeValid(date, time)) {
      alert(copy.errLead);
      return;
    }
    if (tripType === "round_trip" && !isTransferLeadTimeValid(returnDate, returnTime)) {
      alert(copy.errReturnLead);
      return;
    }
    const phoneCheck = validatePhoneNumber(phone, "EG");
    if (!phoneCheck.valid) {
      alert(copy.errPhone);
      return;
    }

    const journeyName = `Private airport transfer (${tripType === "round_trip" ? "round trip" : "one way"})`;
    trackEvent("booking_start", {
      booking_type: "transfer",
      item_name: journeyName,
      value: quote.requiresManualConfirmation ? 0 : quote.total,
      currency: "USD",
    });

    setSubmitting(true);
    try {
      idempotencyKey.current ||= crypto.randomUUID();
      const payload = {
        idempotencyKey: idempotencyKey.current,
        type: "transfer" as const,
        transferProduct: "airport-v2" as const,
        locale: language,
        customerName: name.trim(),
        phone: phoneCheck.e164,
        customerEmail: email.trim(),
        tripType,
        direction,
        zone: zone ?? undefined,
        hotel: hotelName.trim(),
        hotelName: hotelName.trim(),
        date,
        time,
        flightNumber: flightNumber.trim(),
        returnDate: tripType === "round_trip" ? returnDate : "",
        returnTime: tripType === "round_trip" ? returnTime : "",
        returnFlightNumber: tripType === "round_trip" ? returnFlightNumber.trim() : "",
        adults,
        children,
        infants,
        largeBags,
        cabinBags,
        oversizedItems: oversizedItems.map((item) =>
          item.type === "other" ? { ...item, note: otherNote.trim() } : item,
        ),
        childSeats: { infant: infantSeat, child: childSeat, booster: boosterSeat },
        wheelchair,
        message: notes.trim(),
        website,
      };
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.error || copy.errGeneric);
        return;
      }

      trackEvent("booking_complete", {
        transaction_id: data.reference,
        booking_type: "transfer",
        item_name: journeyName,
        value: quote.requiresManualConfirmation ? 0 : quote.total,
        currency: "USD",
      });

      if (!data.whatsappSent && data.whatsappUrl) window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      window.sessionStorage.setItem(
        confirmationStorageKey(data.reference),
        JSON.stringify({
          reference: data.reference,
          customerName: name.trim(),
          serviceName: journeyName,
          date,
          time,
          travelers: `${totalPassengers} ${copy.passengers}`,
          total: quote.requiresManualConfirmation ? copy.manualTitle : `$${quote.total.toFixed(2)}`,
          customerEmailSent: Boolean(data.customerEmailSent),
          whatsappSent: Boolean(data.whatsappSent),
          bookingConfirmationPdf: String(data.bookingConfirmationPdf || ""),
        }),
      );
      router.push(`${localePath(language, "/booking/confirmation")}?reference=${encodeURIComponent(data.reference)}`);
    } catch {
      alert(copy.errNetwork);
    } finally {
      setSubmitting(false);
    }
  }

  const reasonKey = quote.reason ? (`reason_${quote.reason}` as keyof CopyShape) : null;

  return (
    <form onSubmit={submit} aria-busy={submitting} className="rounded-3xl bg-white p-6 shadow-2xl md:p-8">
      <input name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-ocean-tint p-3 text-ocean-dark"><Car /></div>
        <div>
          <h2 className="text-2xl font-bold text-ink">{copy.heading}</h2>
          <p className="mt-1 text-sm text-muted">{copy.sub}</p>
        </div>
      </div>

      {/* Step 1 — Journey */}
      <fieldset className="mt-7">
        <legend className="text-sm font-bold uppercase tracking-wide text-ocean-dark">1 · {copy.journey}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(["one_way", "round_trip"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTripType(value)}
              aria-pressed={tripType === value}
              className={`rounded-2xl border p-4 text-start font-bold transition ${tripType === value ? "border-ocean bg-ocean-tint ring-2 ring-ocean-tint" : "border-line hover:border-ocean-soft"}`}
            >
              {value === "one_way" ? copy.oneWay : copy.roundTrip}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Labelled icon={<Plane />} label={copy.direction}>
            <select value={direction} onChange={(event) => setDirection(event.target.value as Direction)}>
              <option value="airport_to_hotel">{copy.airportToHotel}</option>
              <option value="hotel_to_airport">{copy.hotelToAirport}</option>
              <option value="hotel_to_hotel">{copy.hotelToHotel}</option>
            </select>
          </Labelled>
          <Labelled icon={<Hotel />} label={copy.hotel} required>
            <input type="text" value={hotelName} onChange={(event) => setHotelName(event.target.value)} placeholder={copy.hotelPlaceholder} required={direction !== "hotel_to_hotel"} />
          </Labelled>
          {direction !== "hotel_to_hotel" ? (
            <Labelled icon={<Car />} label={copy.zone}>
              <select value={zoneOverride} onChange={(event) => setZoneOverride(event.target.value as TransferZoneKey | "")}>
                <option value="">{autoZone ? `${copy.zoneAuto}: ${ZONE_LABELS[autoZone]}` : copy.zoneManual}</option>
                {TRANSFER_ZONE_KEYS.map((key) => (
                  <option key={key} value={key}>{ZONE_LABELS[key]}</option>
                ))}
              </select>
            </Labelled>
          ) : null}
          <Labelled icon={<CalendarDays />} label={copy.date} required>
            <input type="date" value={date} min={minimumSlot.date} onChange={(event) => setDate(event.target.value)} required />
          </Labelled>
          <Labelled icon={<Clock3 />} label={copy.time} required>
            <input type="time" value={time} min={date === minimumSlot.date ? minimumSlot.time : undefined} onChange={(event) => { setTime(event.target.value); if (event.target.value) trackEvent("date_selected", { booking_type: "transfer" }); }} required />
            <p className="mt-2 text-xs leading-5 text-amber-700">{copy.leadTime}</p>
          </Labelled>
          <Labelled icon={<Plane />} label={copy.flight}>
            <input type="text" value={flightNumber} onChange={(event) => setFlightNumber(event.target.value)} placeholder="U2 1234" />
          </Labelled>
          {tripType === "round_trip" ? (
            <>
              <Labelled icon={<CalendarDays />} label={copy.returnDate} required>
                <input type="date" value={returnDate} min={date || minimumSlot.date} onChange={(event) => setReturnDate(event.target.value)} required />
              </Labelled>
              <Labelled icon={<Clock3 />} label={copy.returnTime} required>
                <input type="time" value={returnTime} onChange={(event) => setReturnTime(event.target.value)} required />
                <p className="mt-2 text-xs leading-5 text-muted">{copy.returnHint}</p>
              </Labelled>
              <Labelled icon={<Plane />} label={copy.returnFlight}>
                <input type="text" value={returnFlightNumber} onChange={(event) => setReturnFlightNumber(event.target.value)} placeholder="U2 1235" />
              </Labelled>
            </>
          ) : null}
        </div>
      </fieldset>

      {/* Step 2 — Passengers & luggage */}
      <fieldset className="mt-8">
        <legend className="text-sm font-bold uppercase tracking-wide text-ocean-dark">2 · {copy.paxLuggage}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stepper label={copy.adults} value={adults} min={1} onChange={(value) => { setAdults(value); trackEvent("travelers_changed", { booking_type: "transfer" }); }} />
          <Stepper label={copy.children} value={children} min={0} onChange={setChildren} />
          <Stepper label={copy.infants} value={infants} min={0} onChange={setInfants} />
        </div>
        <p className="mt-2 text-xs text-muted">{copy.paxNote}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Stepper label={copy.largeBags} value={largeBags} min={0} icon={<Luggage size={16} />} onChange={setLargeBags} />
          <Stepper label={copy.cabinBags} value={cabinBags} min={0} icon={<Luggage size={16} />} onChange={setCabinBags} />
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={oversizedOpen} onChange={(event) => setOversizedOpen(event.target.checked)} />
          {copy.oversizedToggle}
        </label>
        {oversizedOpen ? (
          <div className="mt-3 rounded-2xl border border-line p-4">
            <p className="text-xs text-muted">{copy.oversizedNote}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {OVERSIZED_TYPES.map((type) => (
                <div key={type} className="flex items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2">
                  <span className="text-sm text-ink">{copy.oversizedLabels[type]}</span>
                  <MiniStepper value={oversized[type] ?? 0} onChange={(delta) => bumpOversized(type, delta)} label={copy.oversizedLabels[type]} />
                </div>
              ))}
            </div>
            {(oversized.other ?? 0) > 0 ? (
              <label className="mt-3 block text-sm font-medium text-ink">
                {copy.otherLabel}
                <input type="text" value={otherNote} onChange={(event) => setOtherNote(event.target.value)} className="mt-1 w-full rounded-xl border border-line p-2 outline-none focus:border-ocean" />
              </label>
            ) : null}
          </div>
        ) : null}

        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={seatsOpen} onChange={(event) => setSeatsOpen(event.target.checked)} />
          {copy.seatsToggle}
        </label>
        {seatsOpen ? (
          <div className="mt-3 rounded-2xl border border-line p-4">
            <p className="text-xs text-muted">{copy.seatsNote}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <Stepper label={copy.infantSeat} value={infantSeat} min={0} onChange={setInfantSeat} />
              <Stepper label={copy.childSeat} value={childSeat} min={0} onChange={setChildSeat} />
              <Stepper label={copy.boosterSeat} value={boosterSeat} min={0} onChange={setBoosterSeat} />
            </div>
          </div>
        ) : null}

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-ink">{copy.wheelchair}</legend>
          <div className="mt-2 space-y-2">
            {(["none", "folding_manual", "powered_or_fixed"] as const).map((value) => (
              <label key={value} className="flex items-start gap-2 text-sm text-ink">
                <input type="radio" name="wheelchair" value={value} checked={wheelchair === value} onChange={() => setWheelchair(value)} className="mt-1" />
                <span>{value === "none" ? copy.wcNone : value === "folding_manual" ? copy.wcFolding : copy.wcPowered}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </fieldset>

      {/* Step 3 — Vehicle & price */}
      <section aria-live="polite" className="mt-8 rounded-2xl border border-ocean-soft bg-ocean-tint p-5">
        <p className="text-sm font-bold uppercase tracking-wide text-ocean-dark">3 · {copy.vehiclePrice}</p>
        {quote.requiresManualConfirmation ? (
          <div className="mt-3">
            <p className="text-lg font-bold text-ink">{copy.manualTitle}</p>
            {reasonKey ? <p className="mt-1 text-sm text-ink">{copy[reasonKey] as string}</p> : null}
            <p className="mt-2 text-sm leading-6 text-muted">{copy.manualBody}</p>
          </div>
        ) : (
          <div className="mt-3">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                {quote.allocatedVehicles.map((entry) => (
                  <p key={entry.vehicleClass} className="text-lg font-bold text-ink">
                    {entry.count}× {VEHICLE_LABELS[entry.vehicleClass] ?? entry.vehicleClass}
                  </p>
                ))}
                <p className="mt-1 text-sm text-muted">
                  {copy.yourGroup}: {totalPassengers} {copy.passengers} · {largeBags} {copy.suitcases}
                </p>
                <p className="mt-1 text-xs font-medium text-emerald-700">{copy.privateNotShared}</p>
              </div>
              <div className="text-end">
                <p className="text-sm text-muted">{copy.totalLabel}</p>
                <p className="text-3xl font-black text-ocean-dark">${quote.total.toFixed(2)}</p>
                <p className="text-xs text-muted">{copy.total}</p>
              </div>
            </div>
            {quote.vehicleCount > 1 ? <p className="mt-3 text-sm font-semibold text-ink">{copy.twoVehicles}</p> : null}
            {quote.warnings.length ? (
              <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm text-ink">
                {quote.warnings.map((warning) => {
                  const key = `warn_${warning}` as keyof CopyShape;
                  return copy[key] ? <li key={warning}>• {copy[key] as string}</li> : null;
                })}
              </ul>
            ) : null}
          </div>
        )}
      </section>

      {/* Step 4 — Customer details */}
      <fieldset className="mt-8">
        <legend className="text-sm font-bold uppercase tracking-wide text-ocean-dark">4 · {copy.contact}</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Labelled icon={<Users />} label={copy.name} required>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
          </Labelled>
          <Labelled icon={<MessageCircle />} label={copy.phone} required>
            <PhoneNumberInput defaultCountry="EG" value={phone} onChange={setPhone} language={language} required ariaLabel={copy.phone} />
            <p className="mt-2 text-xs leading-5 text-muted">{copy.phoneHint}</p>
          </Labelled>
          <Labelled icon={<MessageCircle />} label={copy.email} required>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required />
          </Labelled>
        </div>
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="transfer-notes">{copy.notes}</label>
        <textarea id="transfer-notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-line bg-white p-3 text-ink outline-none placeholder:text-muted focus:border-ocean" />
      </fieldset>

      {/* Step 5 — Review & submit */}
      <p className="mt-6 rounded-xl border border-line bg-surface-muted p-3 text-xs leading-5 text-muted">
        {copy.cancellationBefore}{" "}
        <Link href={localePath(language, "/terms-conditions#cancellations")} target="_blank" className="font-bold text-ocean-dark underline">{copy.cancellation}</Link>. {copy.agree}
      </p>
      <button type="submit" disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">
        <MessageCircle size={20} />
        {submitting ? copy.submitting : quote.requiresManualConfirmation ? copy.submit : `${copy.submit} · $${quote.total.toFixed(2)}`}
      </button>
    </form>
  );
}

function Labelled({ icon, label, children, required = false }: { icon: ReactNode; label: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-ink">
      <span className="mb-2 flex items-center gap-2 text-ink">
        <span className="text-ocean">{icon}</span>
        {label}
        {required ? <span aria-hidden="true" className="text-rose-600">*</span> : null}
      </span>
      <div className="[&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-line [&>input]:p-3 [&>input]:outline-none [&>input]:focus:border-ocean [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-line [&>select]:bg-white [&>select]:p-3 [&>select]:outline-none [&>select]:focus:border-ocean">
        {children}
      </div>
    </label>
  );
}

function Stepper({ label, value, min, onChange, icon }: { label: string; value: number; min: number; onChange: (value: number) => void; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <span className="flex items-center gap-1.5 text-sm font-medium text-ink">{icon}{label}</span>
      <div className="mt-2 flex items-center justify-between">
        <button type="button" aria-label={`${label} −`} onClick={() => onChange(Math.max(min, value - 1))} className="h-9 w-9 rounded-lg border border-line text-lg font-bold text-ink hover:bg-surface-muted">−</button>
        <span aria-live="polite" className="min-w-8 text-center text-lg font-bold text-ink">{value}</span>
        <button type="button" aria-label={`${label} +`} onClick={() => onChange(value + 1)} className="h-9 w-9 rounded-lg border border-line text-lg font-bold text-ink hover:bg-surface-muted">+</button>
      </div>
    </div>
  );
}

function MiniStepper({ value, onChange, label }: { value: number; onChange: (delta: number) => void; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <button type="button" aria-label={`${label} −`} onClick={() => onChange(-1)} className="h-7 w-7 rounded-md border border-line font-bold text-ink hover:bg-white">−</button>
      <span aria-live="polite" className="min-w-6 text-center text-sm font-bold text-ink">{value}</span>
      <button type="button" aria-label={`${label} +`} onClick={() => onChange(1)} className="h-7 w-7 rounded-md border border-line font-bold text-ink hover:bg-white">+</button>
    </span>
  );
}
