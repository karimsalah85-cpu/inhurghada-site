type BookingInput = Record<string, unknown>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+\d][\d\s()-]{6,24}$/;

function text(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function number(value: unknown) {
  return Number(value ?? 0);
}

export function validateBookingInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Invalid booking request." as const };
  const body = input as BookingInput;
  if (text(body.website, 200)) return { spam: true as const };

  const customerName = text(body.customerName, 100);
  const phone = text(body.phone, 30);
  const customerEmail = text(body.customerEmail, 254).toLowerCase();
  const hotel = text(body.hotel, 200);
  const type: "tour" | "transfer" = body.type === "transfer" ? "transfer" : "tour";
  const date = text(body.date, 10);

  if (customerName.length < 2 || !phonePattern.test(phone) || !hotel) return { error: "Enter a valid name, phone number, and pickup location." as const };
  if (!customerEmail || !emailPattern.test(customerEmail)) return { error: "Enter a valid email address." as const };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Choose a valid booking date." as const };
  if (date) {
    const selected = new Date(`${date}T00:00:00Z`);
    const todayInCairo = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    if (Number.isNaN(selected.getTime()) || date < todayInCairo) return { error: "Choose today or a future date." as const };
  }

  return {
    data: {
      type,
      customerName,
      phone,
      customerEmail,
      hotel,
      currency: "usd",
      date,
      tourName: text(body.tourName, 160),
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
