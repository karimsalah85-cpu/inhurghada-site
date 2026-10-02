import { NextRequest } from "next/server";
import { z } from "zod";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { commissionInvoiceSchema } from "@/lib/finance/commission-invoice";
import { createCommissionInvoicePdf } from "@/lib/finance/commission-invoice-pdf";
import { buildCommissionInvoiceEmail } from "@/lib/finance/commission-invoice-email";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { sendBookingEmail } from "@/lib/booking-service";
import { createRequiredAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string; invoiceId: string }> };
export async function GET(request: NextRequest, context: Context) {
  const { id, invoiceId } = await context.params;
  if (!isUuid(id) || !isUuid(invoiceId)) return financeJson({ error: "Invalid invoice." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  try {
    const { data, error } = await supabase.from("supplier_commission_invoices").select("*").eq("id", invoiceId).eq("supplier_id", id).maybeSingle();
    if (error) return financeDbError(error);
    if (!data) return financeJson({ error: "Invoice not found." }, 404);
    const document = commissionInvoiceSchema.parse(data.document);
    const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
    if (request.nextUrl.searchParams.get("format") === "email") return new Response(buildCommissionInvoiceEmail(document, data.reference).html, { headers: { ...headers, "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "default-src 'none'; img-src https://dailyredsea.com; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; sandbox" } });
    const pdf = await createCommissionInvoicePdf(document, data.reference);
    return new Response(new Uint8Array(pdf), { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${data.reference}.pdf"` } });
  } catch (error) { return financeDbError(error); }
}
export async function POST(request: NextRequest, context: Context) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { id, invoiceId } = await context.params;
  if (!isUuid(id) || !isUuid(invoiceId)) return financeJson({ error: "Invalid invoice." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  const parsed = z.object({ recipient: z.string().trim().email().max(254), confirm: z.literal(true) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return financeJson({ error: "Confirm the recipient before sending." }, 400);
  try {
    const { data, error } = await supabase.from("supplier_commission_invoices").select("*").eq("id", invoiceId).eq("supplier_id", id).maybeSingle();
    if (error) return financeDbError(error);
    if (!data) return financeJson({ error: "Invoice not found." }, 404);
    if (data.status !== "draft") return financeJson({ error: "This invoice has already been sent or has a pending delivery check." }, 409);
    const document = commissionInvoiceSchema.parse(data.document);
    const pdf = await createCommissionInvoicePdf(document, data.reference);
    const email = buildCommissionInvoiceEmail(document, data.reference);
    const db = createRequiredAdminClient();
    // Claim once before calling the provider: concurrent requests cannot send twice.
    const claim = await db.from("supplier_commission_invoices").update({ status: "sending", recipient: parsed.data.recipient }).eq("id", invoiceId).eq("supplier_id", id).eq("status", "draft").select("id").maybeSingle();
    if (claim.error) return financeDbError(claim.error);
    if (!claim.data) return financeJson({ error: "Sending has already started." }, 409);
    let success = false;
    try { success = (await sendBookingEmail(parsed.data.recipient, email.subject, email.html, { filename: `${data.reference}.pdf`, content: pdf })).success; }
    catch { /* Delivery can be ambiguous after a network timeout; never automatically retry. */ }
    const result = await db.from("supplier_commission_invoices").update({ status: success ? "sent" : "delivery_unknown", sent_at: success ? new Date().toISOString() : null }).eq("id", invoiceId).eq("status", "sending");
    if (result.error) return financeJson({ error: "Delivery was attempted but its status could not be saved. Check the sent mailbox before any further action." }, 502);
    if (!success) return financeJson({ error: "Delivery was not confirmed. Check the sent mailbox and email configuration before creating a replacement." }, 502);
    return financeJson({ sent: true, recipient: parsed.data.recipient });
  } catch (error) { return financeDbError(error); }
}
