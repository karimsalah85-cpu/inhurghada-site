import "server-only";
import { NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { createClient } from "@/utils/supabase/server";
import { FinanceNotConfiguredError } from "@/lib/finance/supplier-data";

export const financeJson = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export const NOT_CONFIGURED = { configured: false, error: "Finance is not set up yet: the finance database migrations have not been applied." };

/** Signed-in client plus a live permission check (view_finance or manage_finance). */
export async function financeAuthorization(permission: "view_finance" | "manage_finance") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const allowed = await hasLivePermission(supabase, user, permission);
  return { supabase, user, allowed };
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => uuidPattern.test(value);

const MISSING = new Set(["42P01", "42703", "42883", "PGRST200", "PGRST202", "PGRST205"]);

/**
 * Maps a database error from a finance RPC to an HTTP response. Messages from
 * our own finance_* functions (raised with SQLSTATE 22023/23514/P0002/42501)
 * are written for staff and passed through; anything else stays generic.
 */
export function financeDbError(error: { code?: string; message: string } | unknown) {
  if (error instanceof FinanceNotConfiguredError) return financeJson(NOT_CONFIGURED, 503);
  const { code = "", message = "" } = (error ?? {}) as { code?: string; message?: string };
  if (MISSING.has(code)) return financeJson(NOT_CONFIGURED, 503);
  if (code === "42501") return financeJson({ error: "Your role cannot change finance records." }, 403);
  if (code === "P0002") return financeJson({ error: message || "Not found." }, 404);
  if (["22023", "23514", "23505", "55000"].includes(code)) return financeJson({ error: message }, code === "23505" ? 409 : 400);
  if (["22P02", "23502", "23503"].includes(code)) return financeJson({ error: "One of the values is not valid for this record." }, 400);
  console.error("Finance database error", { code, message });
  return financeJson({ error: "The finance update failed. Nothing was saved." }, 500);
}
