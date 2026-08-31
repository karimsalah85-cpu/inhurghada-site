import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { DEFAULT_EXPENSE_TYPES, slugifyExpenseType } from "@/lib/admin-expense-write";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

const DEFAULT_ROWS = DEFAULT_EXPENSE_TYPES.map((type, index) => ({
  ...type,
  sort_order: (index + 1) * 10,
  is_system: true,
}));

export async function GET() {
  const { supabase, allowed } = await getAdminAuthorization("view_expenses");
  if (!allowed) return json({ error: "Expense-viewing permission required." }, 403);

  const { data, error } = await supabase
    .from("expense_types")
    .select("*")
    .order("is_system", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    if (["42P01", "PGRST205"].includes(error.code)) return json({ types: DEFAULT_ROWS, migrationPending: true });
    console.error("Expense type list failed", { code: error.code, message: error.message });
    return json({ error: "Could not load expense types." }, 500);
  }
  return json({ types: data?.length ? data : DEFAULT_ROWS });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { supabase, user, allowed } = await getAdminAuthorization("edit_expenses");
  if (!allowed) return json({ error: "Expense-editing permission required." }, 403);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const label = String(body?.label || "").trim().slice(0, 80);
  const key = slugifyExpenseType(label);
  if (label.length < 2 || key.length < 2) {
    return json({ error: "Enter an expense type name of at least two letters." }, 400);
  }

  const { data, error } = await supabase
    .from("expense_types")
    .insert({ key, label, is_system: false, created_by: user?.email || null })
    .select()
    .single();

  if (error) {
    if (["42P01", "PGRST205"].includes(error.code)) {
      return json({ error: "The admin database migration is required before expense types can be added." }, 503);
    }
    if (error.code === "23505") return json({ error: "That expense type already exists." }, 409);
    console.error("Expense type create failed", { code: error.code, message: error.message });
    return json({ error: "Could not add the expense type." }, 500);
  }

  await supabase.rpc("record_admin_audit", {
    action_name: "create",
    resource_name: "expense_type",
    resource_identifier: data.key,
    summary_text: `Added expense type ${label}`,
    after_value: { ...data, actor: user?.email },
  });
  return json({ type: data }, 201);
}
