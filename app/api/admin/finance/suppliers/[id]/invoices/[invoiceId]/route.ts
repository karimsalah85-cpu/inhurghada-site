import { NextRequest } from "next/server";
import { z } from "zod";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { commissionInvoiceSchema } from "@/lib/finance/commission-invoice";
import { createCommissionInvoicePdf } from "@/lib/finance/commission-invoice-pdf";
import { buildCommissionInvoiceEmail } from "@/lib/finance/commission-invoice-email";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { sendBookingEmail } from "@/lib/booking-service";
import { createRequiredAdminClient } from "@/utils/supabase/admin";
import { loadMonthlyCommission } from "@/lib/finance/monthly-commission-data";
import { assertCurrentCommission } from "@/lib/finance/monthly-commission";

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
  const parsed = z.object({ recipient: z.string().trim().email().max(254), confirm: z.literal(true),
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/), generatedAt: z.string().datetime(),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return financeJson({ error: "Confirm the recipient before sending." }, 400);
  try {
    const { data, error } = await supabase.from("supplier_commission_invoices").select("*").eq("id", invoiceId).eq("supplier_id", id).maybeSingle();
    if (error) return financeDbError(error);
    if (!data) return financeJson({ error: "Invoice not found." }, 404);
    if (data.status !== "draft") return financeJson({ error: "This invoice has already been sent or has a pending delivery check." }, 409);
    const document = commissionInvoiceSchema.parse(data.document);
    if (document.source?.fingerprint !== parsed.data.fingerprint || document.source?.generatedAt !== parsed.data.generatedAt) {
      return financeJson({ error: "The draft changed since you reviewed it. Reload and preview it before sending." }, 409);
    }
    assertCurrentCommission(document, await loadMonthlyCommission(supabase, id, document.period, document.currency));
    const pdf = await createCommissionInvoicePdf(document, data.reference);
    const email = buildCommissionInvoiceEmail(document, data.reference);
    const db = createRequiredAdminClient();
    // Claim once before calling the provider: concurrent requests cannot send twice.
    const claim = await db.from("supplier_commission_invoices").update({ status: "sending", recipient: parsed.data.recipient })
      .eq("id", invoiceId).eq("supplier_id", id).eq("status", "draft")
      .eq("document->source->>fingerprint", document.source!.fingerprint)
      .eq("document->source->>generatedAt", document.source!.generatedAt).select("id").maybeSingle();
    if (claim.error) return financeDbError(claim.error);
    if (!claim.data) return financeJson({ error: "Sending has already started." }, 409);
    // Rendering may take time. Recheck after claiming, before any provider call.
    try { assertCurrentCommission(document, await loadMonthlyCommission(supabase, id, document.period, document.currency)); }
    catch (error) {
      const release = await db.from("supplier_commission_invoices").update({ status: "draft", recipient: null }).eq("id", invoiceId).eq("status", "sending");
      if (release.error) return financeJson({ error: "No email was sent, but the draft could not be unlocked. Ask an administrator to restore its draft status." }, 500);
      return financeDbError(error);
    }
    let success = false;
    try { success = (await sendBookingEmail(parsed.data.recipient, email.subject, email.html, { filename: `${data.reference}.pdf`, content: pdf })).success; }
    catch { /* Delivery can be ambiguous after a network timeout; never automatically retry. */ }
    const result = await db.from("supplier_commission_invoices").update({ status: success ? "sent" : "delivery_unknown", sent_at: success ? new Date().toISOString() : null }).eq("id", invoiceId).eq("status", "sending");
    if (result.error) return financeJson({ error: "Delivery was attempted but its status could not be saved. Check the sent mailbox before any further action." }, 502);
    if (!success) return financeJson({ error: "Delivery was not confirmed. Check the sent mailbox and email configuration before creating a replacement." }, 502);
    return financeJson({ sent: true, recipient: parsed.data.recipient });
  } catch (error) { return financeDbError(error); }
}

/** Refresh an existing unsent draft; old previews remain viewable but cannot be sent unchecked. */
export async function PATCH(request: NextRequest, context: Context) {
  if (!hasValidRequestOrigin(request)) return financeJson({ error: "Invalid origin." }, 403);
  const { id, invoiceId } = await context.params;
  if (!isUuid(id) || !isUuid(invoiceId)) return financeJson({ error: "Invalid invoice." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("manage_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance management access required." }, 403);
  try {
    const result = await supabase.from("supplier_commission_invoices").select("*").eq("id", invoiceId).eq("supplier_id", id).maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return financeJson({ error: "Invoice not found." }, 404);
    if (result.data.status !== "draft") return financeJson({ error: "Only unsent drafts can be refreshed." }, 409);
    const old = commissionInvoiceSchema.parse(result.data.document);
    const current = await loadMonthlyCommission(supabase, id, old.period, old.currency);
    let update = createRequiredAdminClient().from("supplier_commission_invoices").update({ document: { ...current, notes: old.source ? old.notes : "" } })
      .eq("id", invoiceId).eq("supplier_id", id).eq("status", "draft");
    update = old.source ? update.eq("document->source->>fingerprint", old.source.fingerprint).eq("document->source->>generatedAt", old.source.generatedAt)
      : update.is("document->source", null);
    const updated = await update.select().maybeSingle();
    if (updated.error) throw updated.error;
    if (!updated.data) return financeJson({ error: "The draft changed. Reload and try again." }, 409);
    return financeJson({ invoice: updated.data });
  } catch (error) { return financeDbError(error); }
}
