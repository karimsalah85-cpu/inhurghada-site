type BookingInput = Record<string, unknown>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+\d][\d\s()-]{6,24}$/;

function text(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function number(value: unknown) {
  return Number(value ?? 0);
}

function extras(value: unknown) {
  return Array.isArray(value) ? value.slice(0, 10).map((item) => text(item, 60)).filter(Boolean) : [];
}

function extraQuantities(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 12).map(([key, quantity]) => [text(key, 60), number(quantity)]).filter(([key]) => key));
}

function cartItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 6).map((entry) => {
    const item = entry && typeof entry === "object" && !Array.isArray(entry) ? entry as BookingInput : {};
    return {
      tourSlug: text(item.tourSlug, 80),
      date: text(item.date, 10),
      time: text(item.time, 80),
      adults: number(item.adults),
      youth: number(item.youth),
      infants: number(item.infants),
      extras: extras(item.extras),
      selectedBoatOption: text(item.selectedBoatOption, 60),
      extraQuantities: extraQuantities(item.extraQuantities),
      transferRequired: item.transferRequired === true,
      transferArea: text(item.transferArea, 80),
      divingLicenseConfirmed: item.divingLicenseConfirmed === true,
      quadMinimumAgeConfirmed: item.quadMinimumAgeConfirmed === true,
    };
  });
}

function cairoDateTimeParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || "";
  return { date: `${part("year")}-${part("month")}-${part("day")}`, time: `${part("hour")}:${part("minute")}` };
}

export function minimumTransferSlot(now = new Date()) {
  return cairoDateTimeParts(new Date(now.getTime() + 60 * 60 * 1000 + 59_999));
}

export function isTransferLeadTimeValid(date: string, time: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
  const minimum = minimumTransferSlot(now);
  return `${date}T${time}` >= `${minimum.date}T${minimum.time}`;
}

export function validateBookingInput(input: unknown, now = new Date()) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Invalid booking request." as const };
  const body = input as BookingInput;
  if (text(body.website, 200)) return { spam: true as const };

  const customerName = text(body.customerName, 100);
  const phone = text(body.phone, 30);
  const customerEmail = text(body.customerEmail, 254).toLowerCase();
  const hotel = text(body.hotel, 200);
  const type: "tour" | "transfer" = body.type === "transfer" ? "transfer" : "tour";
  const date = text(body.date, 10);
  const time = text(body.time, 5);

  if (customerName.length < 2 || !phonePattern.test(phone) || !hotel) return { error: "Enter a valid name, phone number, and pickup location." as const };
  if (!customerEmail || !emailPattern.test(customerEmail)) return { error: "Enter a valid email address." as const };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Choose a valid booking date." as const };
  if (date) {
    const selected = new Date(`${date}T00:00:00Z`);
    const todayInCairo = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    if (Number.isNaN(selected.getTime()) || date < todayInCairo) return { error: "Choose today or a future date." as const };
  }
  if (type === "transfer" && !isTransferLeadTimeValid(date, time, now)) {
    return { error: "Transfer bookings require at least 1 hour to arrange. Choose a later pickup time." as const };
  }
  const tourSlug = text(body.tourSlug, 80);
  if (type === "tour" && tourSlug === "orange-bay") {
    const todayInCairo = cairoDateTimeParts(now).date;
    if (date <= todayInCairo) return { error: "Orange Bay bookings must be made at least one day before the trip." as const };
  }
  if (type === "tour" && ["orange-bay-half-day-speedboat", "magawish-speedboat"].includes(tourSlug)) {
    const cairo = cairoDateTimeParts(now);
    const tomorrow = new Date(`${cairo.date}T12:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const nextDay = tomorrow.toISOString().slice(0, 10);
    if (date <= cairo.date || (date === nextDay && cairo.time >= "15:00")) return { error: "After 3:00 PM, private half-day speedboat trips require at least two days' notice." as const };
  }
  const selectedCartItems = cartItems(body.cartItems);
  if (tourSlug === "multi-trip") {
    if (selectedCartItems.length < 1) return { error: "Add at least one trip to your cart." as const };
    const todayInCairo = cairoDateTimeParts(now).date;
    for (const item of selectedCartItems) {
      if (!item.tourSlug || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || item.date < todayInCairo) return { error: "Choose a valid future date for every trip." as const };
      if (item.tourSlug === "full-day-diving" && !item.divingLicenseConfirmed) return { error: "Every diver must hold a valid diving license and bring proof on the trip." as const };
      if (["quad-safari-morning", "quad-safari-sunset"].includes(item.tourSlug) && !item.quadMinimumAgeConfirmed) return { error: "Every quad-tour participant must be at least 9 years old." as const };
    }
  }
  const divingLicenseConfirmed = body.divingLicenseConfirmed === true;
  if (type === "tour" && tourSlug === "full-day-diving" && !divingLicenseConfirmed) {
    return { error: "Every diver must hold a valid diving license and bring proof on the trip." as const };
  }
  const quadMinimumAgeConfirmed = body.quadMinimumAgeConfirmed === true;
  if (type === "tour" && ["quad-safari-morning", "quad-safari-sunset"].includes(tourSlug) && !quadMinimumAgeConfirmed) {
    return { error: "Every quad-tour participant must be at least 9 years old." as const };
  }

  return {
    data: {
      type,
      locale: body.locale === "de" ? "de" : body.locale === "ru" ? "ru" : body.locale === "ar" ? "ar" : "en",
      customerName,
      phone,
      customerEmail,
      hotel,
      currency: "usd",
      date,
      time,
      tourName: text(body.tourName, 160),
      tourSlug,
      cartItems: selectedCartItems,
      divingLicenseConfirmed,
      quadMinimumAgeConfirmed,
      extras: extras(body.extras),
      selectedBoatOption: text(body.selectedBoatOption, 60),
      extraQuantities: extraQuantities(body.extraQuantities),
      transferRequired: body.transferRequired === true,
      transferArea: text(body.transferArea, 80),
      location: text(body.location, 100),
      duration: text(body.duration, 80),
      price: text(body.price, 60),
      guests: text(body.guests, 80),
      message: text(body.message, 2000),
      adults: number(body.adults),
      youth: number(body.youth),
      infants: number(body.infants),
      service: text(body.service, 20),
      pickup: text(body.pickup, 80),
      dropoff: text(body.dropoff, 80),
      passengers: number(body.passengers),
      travelBags: number(body.travelBags),
    },
  };
}
