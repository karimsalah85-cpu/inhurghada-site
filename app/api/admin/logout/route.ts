import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { hasValidRequestOrigin } from "@/lib/request-origin";

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
