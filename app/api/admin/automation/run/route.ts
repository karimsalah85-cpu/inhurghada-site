import { NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { runAdminAutomation } from "@/lib/admin-automation";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAuthorizedAdmin(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json({ ok: true, ...(await runAdminAutomation()) }); }
  catch (error) { console.error("Manual admin automation failed", error); return NextResponse.json({ error: "Automation failed. Check Vercel environment variables and logs." }, { status: 500 }); }
}
