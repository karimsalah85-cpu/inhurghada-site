import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { bookingLocale } from "@/lib/booking-communications-i18n";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const clean = (value: unknown, length: number) => typeof value === "string" ? value.trim().slice(0, length) : "";

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!(await hasLivePermission(supabase, user, "bookings"))) return json({ error: "Unauthorized." }, 401);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const customerName = clean(body?.customer_name, 120);
  const phone = clean(body?.phone, 40);
  const tourName = clean(body?.tour_name, 180);
  const date = clean(body?.date, 10);
  const type = body?.type === "transfer" ? "transfer" : "tour";
  const amount = Number(body?.amount);
  const guests = Math.max(1, Math.min(99, Number(body?.guests) || 1));
  if (!customerName || !phone || !tourName || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(amount) || amount < 0) {
    return json({ error: "Name, phone, service, date, guests, and a valid non-negative amount are required." }, 400);
  }
  const reference = `DRS-M-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const insert = {
    reference, type, customer_name: customerName,
    customer_email: clean(body?.customer_email, 180).toLowerCase() || null,
    phone, tour_name: tourName, date, guests,
    hotel: clean(body?.hotel, 180) || null,
    notes: clean(body?.notes, 2000) || null,
    amount, currency: ["USD", "EUR", "GBP", "EGP", "SAR"].includes(clean(body?.currency, 3).toUpperCase()) ? clean(body?.currency, 3).toUpperCase() : "USD",
    status: ["new", "confirmed", "completed", "cancelled"].includes(String(body?.status)) ? body?.status : "new",
    payment_status: ["unpaid", "paid", "refunded"].includes(String(body?.payment_status)) ? body?.payment_status : "unpaid",
    locale: bookingLocale(clean(body?.locale, 2)), booking_source: "manual",
  };
  const { data, error } = await supabase.from("bookings").insert(insert).select().single();
  if (error) {
    console.error("Manual booking creation failed", { message: error.message });
    return json({ error: "Could not create the manual booking." }, 500);
  }
  await supabase.rpc("record_admin_audit", { action_name: "create", resource_name: "booking", resource_identifier: data.id, summary_text: `Created manual booking ${reference}`, before_value: null, after_value: { ...data, actor: user?.email } });
  return json({ booking: data }, 201);
}
