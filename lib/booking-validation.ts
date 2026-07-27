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
    const todayInCairo = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    if (Number.isNaN(selected.getTime()) || date < todayInCairo) return { error: "Choose today or a future date." as const };
  }
  if (type === "transfer" && !isTransferLeadTimeValid(date, time, now)) {
    return { error: "Transfer bookings require at least 1 hour to arrange. Choose a later pickup time." as const };
  }
  const tourSlug = text(body.tourSlug, 80);
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
      locale: body.locale === "de" ? "de" : "en",
      customerName,
      phone,
      customerEmail,
      hotel,
      currency: "usd",
      date,
      time,
      tourName: text(body.tourName, 160),
      tourSlug,
      divingLicenseConfirmed,
      quadMinimumAgeConfirmed,
      extras: extras(body.extras),
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
