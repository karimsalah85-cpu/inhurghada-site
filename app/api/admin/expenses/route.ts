import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/utils/supabase/server";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return json({ error: "Unauthorized." }, 401);

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const description = String(body?.description || "").trim().slice(0, 200);
  const category = String(body?.category || "").trim().slice(0, 80);
  const date = String(body?.date || "").trim();
  const amount = Number(body?.amount);
  if (description.length < 2 || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: "Enter a description, positive amount, and valid date." }, 400);
  }

  const { data, error } = await supabase.from("expenses").insert({ description, amount, currency: "USD", expense_date: date, category: category || null }).select().single();
  if (error) return json({ error: "Could not save the expense." }, 500);
  return json({ expense: data }, 201);
}
