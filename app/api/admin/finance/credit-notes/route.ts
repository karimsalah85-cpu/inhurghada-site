import { NextRequest } from "next/server";
import { financeAuthorization, financeDbError, financeJson } from "@/lib/finance/api";

const STATUSES = new Set(["open", "partly_used", "used", "expired", "void"]);

/** Credit notes with their remaining balance. ?q= number, guest name or email; ?status= open | partly_used | used | expired | void. */
export async function GET(request: NextRequest) {
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  const q = (request.nextUrl.searchParams.get("q") || "").trim().replace(/[^\p{L}\p{N}@.\- ]/gu, "").slice(0, 80);
  const status = request.nextUrl.searchParams.get("status") || "";
  let query = supabase.from("credit_note_balances")
    .select("id,number,booking_id,customer_name,customer_email,currency,amount,redeemed,remaining,status,issued_on,expires_on,reason")
    .order("created_at", { ascending: false }).limit(200);
  if (STATUSES.has(status)) query = query.eq("status", status);
  if (q) query = query.or(`number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) return financeDbError(error);
  return financeJson({ creditNotes: data });
}
