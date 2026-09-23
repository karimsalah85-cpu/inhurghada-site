import { NextRequest } from "next/server";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { supplierDetail } from "@/lib/finance/supplier-data";
import { buildStatement, statementCsv } from "@/lib/finance/supplier-ledger";
import { createSupplierStatementPdf } from "@/lib/finance/statement-pdf";
import { isoDateSchema } from "@/lib/finance/schemas";

export const runtime = "nodejs";

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "supplier";

/** Supplier statement as CSV or PDF for a date range (defaults: all history up to today). */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid supplier." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  const params = request.nextUrl.searchParams;
  const format = params.get("format") === "pdf" ? "pdf" : "csv";
  const today = new Date().toISOString().slice(0, 10);
  const from = params.get("from") || "2000-01-01";
  const to = params.get("to") || today;
  if (!isoDateSchema.safeParse(from).success || !isoDateSchema.safeParse(to).success || from > to) {
    return financeJson({ error: "Choose a valid date range." }, 400);
  }
  try {
    const detail = await supplierDetail(supabase, id);
    if (!detail) return financeJson({ error: "Supplier not found." }, 404);
    const statement = buildStatement({ supplierName: detail.supplier.name, from, to, generatedAt: today, entries: detail.entries, rates: detail.rates });
    const filename = `statement-${slug(detail.supplier.name)}-${from}-to-${to}.${format}`;
    const headers = { "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" };
    if (format === "csv") return new Response(statementCsv(statement), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" } });
    const pdf = await createSupplierStatementPdf(statement);
    return new Response(new Uint8Array(pdf), { headers: { ...headers, "Content-Type": "application/pdf" } });
  } catch (error) {
    return financeDbError(error);
  }
}
