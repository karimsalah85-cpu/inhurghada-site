import { NextRequest, NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { createClient } from "@/utils/supabase/server";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!(await hasLivePermission(supabase, user, "content"))) return json({ error: "Unauthorized." }, 401);

  const status = request.nextUrl.searchParams.get("status");
  let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });
  if (status && ["pending", "approved", "rejected"].includes(status)) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return json({ error: error.message }, 500);
  return json({ reviews: data || [] });
}
