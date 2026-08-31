import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { expenseTypes } from "@/lib/admin-expense-write";

const STATUSES = new Set(["pending", "posted", "rejected"]);

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

function str(value: unknown, max: number) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : null;
}

export async function GET(request: NextRequest) {
  const { supabase, allowed } = await getAdminAuthorization("view_expenses");
  if (!allowed) return json({ error: "Expense-viewing permission required." }, 403);

  const requested = request.nextUrl.searchParams.get("status") || "pending";
  const status = STATUSES.has(requested) ? requested : "pending";

  let query = supabase
    .from("expense_invoices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    if (["42P01", "PGRST205"].includes(error.code)) return json({ invoices: [], migrationPending: true });
    console.error("Expense invoice list failed", { code: error.code, message: error.message });
    return json({ error: "Could not load invoices." }, 500);
  }
  return json({ invoices: data || [] });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { supabase, user, allowed } = await getAdminAuthorization("edit_expenses");
  if (!allowed) return json({ error: "Expense-editing permission required." }, 403);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const filePath = String(body?.file_path || "").trim();
  const fileName = str(body?.file_name, 200);
  if (!/^pending\/[a-zA-Z0-9._/-]{6,200}$/.test(filePath) || !fileName) {
    return json({ error: "The uploaded file reference is missing or invalid." }, 400);
  }

  const method = ["pdf_text", "ocr", "none"].includes(String(body?.extraction_method))
    ? String(body?.extraction_method)
    : "none";
  const confidenceRaw = Number(body?.ocr_confidence);
  const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(100, confidenceRaw)) : null;
  const amountRaw = Number(body?.suggested_amount);
  const suggestedAmount = Number.isFinite(amountRaw) && amountRaw > 0 && amountRaw <= 1_000_000 ? amountRaw : null;
  const suggestedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body?.suggested_date || ""))
    ? String(body?.suggested_date)
    : null;
  const suggestedType = expenseTypes.has(String(body?.suggested_expense_type))
    ? String(body?.suggested_expense_type)
    : null;
  const currency = /^[A-Z]{3}$/.test(String(body?.suggested_currency || "").toUpperCase())
    ? String(body?.suggested_currency).toUpperCase()
    : null;
  const lineItems = Array.isArray(body?.line_items) ? body!.line_items.slice(0, 100) : null;
  const parsed =
    body?.parsed && typeof body.parsed === "object" && !Array.isArray(body.parsed) ? body.parsed : null;

  const insert = {
    file_path: filePath,
    file_name: fileName,
    mime_type: str(body?.mime_type, 100),
    file_size: Number.isFinite(Number(body?.file_size)) ? Math.trunc(Number(body?.file_size)) : null,
    status: "pending",
    extraction_method: method,
    ocr_confidence: confidence,
    raw_text: str(body?.raw_text, 20_000),
    vendor: str(body?.vendor, 200),
    suggested_description: str(body?.suggested_description, 200),
    suggested_amount: suggestedAmount,
    suggested_currency: currency,
    suggested_date: suggestedDate,
    suggested_expense_type: suggestedType,
    suggested_category: str(body?.suggested_category, 80),
    line_items: lineItems,
    parsed,
    created_by: user?.email || null,
  };

  const { data, error } = await supabase.from("expense_invoices").insert(insert).select().single();
  if (error) {
    if (["42P01", "PGRST205"].includes(error.code)) {
      return json({ error: "The admin database migration is required before invoices can be saved." }, 503);
    }
    console.error("Expense invoice save failed", { code: error.code, message: error.message });
    return json({ error: "Could not save the uploaded invoice." }, 500);
  }

  await supabase.rpc("record_admin_audit", {
    action_name: "create",
    resource_name: "expense_invoice",
    resource_identifier: data.id,
    summary_text: `Uploaded invoice ${fileName}`,
    after_value: { ...data, actor: user?.email },
  });
  return json({ invoice: data }, 201);
}
