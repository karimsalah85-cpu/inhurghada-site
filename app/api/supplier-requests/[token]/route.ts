import { NextRequest, NextResponse } from "next/server";
import { rateLimitShared } from "@/lib/rate-limit";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { formatMoney, supplierActions, supplierTransition, type SupplierAction } from "@/lib/supplier-dispatch";
import { notifyOffice, recordEvent, type SupplierRequestRow } from "@/lib/supplier-dispatch-server";
import { verifySupplierRequestToken } from "@/lib/supplier-request-token";
import { siteUrl } from "@/lib/seo";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

const officeSubject: Record<SupplierAction, string> = {
  confirm: "confirmed",
  decline: "DECLINED",
  change: "asked for a CHANGE on",
  payment_received: "confirmed payment received for",
  payment_disputed: "says payment NOT received for",
};

/**
 * A supplier's answer from /supplier/<token>. Plain form POST (works without
 * JavaScript on any phone), then a 303 back to the page with the outcome.
 * The signed token is the supplier's only credential, so it is rate-limited.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const back = new URL(`/supplier/${encodeURIComponent(token)}`, request.url);
  const redirect = (key: "done" | "error", value: string) => { back.searchParams.set(key, value); return NextResponse.redirect(back, 303); };
  if (!hasValidRequestOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const requestId = verifySupplierRequestToken(token);
  if (!requestId) return NextResponse.json({ error: "This link is not valid." }, { status: 404 });

  const clientAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await rateLimitShared(`supplier-request:${requestId}:${clientAddress}`, 20, 15 * 60 * 1000);
  if (!limit.allowed) return redirect("error", "busy");

  const form = await request.formData().catch(() => null);
  const action = String(form?.get("action") || "") as SupplierAction;
  if (!supplierActions.includes(action)) return redirect("error", "invalid");
  const note = String(form?.get("note") || "").trim().slice(0, 1000) || null;
  const responderName = String(form?.get("name") || "").trim().slice(0, 60) || null;

  const database = createAdminClient();
  if (!database) return redirect("error", "unavailable");
  const { data: current, error } = await database.from("supplier_booking_requests").select("*").eq("id", requestId).maybeSingle();
  if (error || !current) return redirect("error", error ? "unavailable" : "missing");
  const row = current as SupplierRequestRow;

  const transition = supplierTransition(row, action, note);
  if (!transition.ok) return redirect("error", transition.reason);
  if (transition.noop) return redirect("done", action);

  const now = new Date().toISOString();
  const { data: supplier } = await database.from("suppliers").select("name").eq("id", row.supplier_id).maybeSingle();
  const supplierName = String(supplier?.name || "Supplier");
  const actor = `Supplier: ${supplierName}${responderName ? ` (${responderName})` : ""}`;
  const patch: Record<string, unknown> = { updated_at: now };
  if (transition.status) Object.assign(patch, { status: transition.status, responded_at: now, responded_by: actor.slice(0, 120), supplier_note: note });
  if (transition.paymentStatus) Object.assign(patch, { payment_status: transition.paymentStatus, payment_confirmed_at: transition.paymentStatus === "received" ? now : null });

  const { data: updated, error: updateError } = await database.from("supplier_booking_requests")
    .update(patch).eq("id", requestId).eq("updated_at", row.updated_at).select("id").maybeSingle();
  if (updateError) {
    console.error("Supplier response not saved", { requestId, action, code: updateError.code, message: updateError.message });
    return redirect("error", "unavailable");
  }
  if (!updated) return redirect("error", "changed");
  await recordEvent(database, requestId, transition.event, actor, note, { via: "supplier_link" });

  const details = row.details;
  const trip = details?.trips?.[0];
  await notifyOffice(`${supplierName} ${officeSubject[action]} booking ${details?.reference || ""}`.trim(), [
    `${actor} ${officeSubject[action]} booking ${details?.reference}.`,
    `Trip: ${trip?.name || "—"} · ${trip?.date || "date pending"}${trip?.time ? ` ${trip.time}` : ""} · guest ${details?.guestName || "—"}`,
    ...(action.startsWith("payment") && row.payment_amount != null && row.payment_currency ? [`Payment: ${formatMoney(Number(row.payment_amount), row.payment_currency)}`] : []),
    ...(note ? [`Their note: ${note}`] : []),
    `Open the booking in the admin: ${new URL("/admin", siteUrl).toString()}`,
  ]);
  return redirect("done", action);
}
