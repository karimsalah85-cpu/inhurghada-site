type BookingInput = Record<string, unknown>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+\d][\d\s()-]{6,24}$/;

function text(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
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
  const amount = Number(body.amount ?? 0);
  const date = text(body.date, 10);

  if (customerName.length < 2 || !phonePattern.test(phone) || !hotel) return { error: "Enter a valid name, phone number, and pickup location." as const };
  if (customerEmail && !emailPattern.test(customerEmail)) return { error: "Enter a valid email address." as const };
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000) return { error: "Invalid booking amount." as const };
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Invalid booking date." as const };

  return {
    data: {
      type,
      customerName,
      phone,
      customerEmail,
      hotel,
      amount,
      currency: text(body.currency, 3).toLowerCase() || "usd",
      date,
      tourName: text(body.tourName, 160),
      location: text(body.location, 100),
      duration: text(body.duration, 80),
      price: text(body.price, 60),
      guests: text(body.guests, 80),
      message: text(body.message, 2000),
    },
  };
}
