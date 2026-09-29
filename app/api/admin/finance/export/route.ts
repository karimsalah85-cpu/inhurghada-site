import { NextRequest } from "next/server";
import { financeAuthorization, financeDbError, financeJson } from "@/lib/finance/api";
import { toCsv } from "@/lib/finance/csv";
import { TRANSACTION_COLUMNS, transactionsInRange } from "@/lib/finance/dashboard";
import { isoDateSchema } from "@/lib/finance/schemas";

const cell = (value: unknown) => (value === null || value === undefined ? "" : typeof value === "boolean" ? (value ? "yes" : "no") : String(value));

/** CSV of every transaction (trip sales, guest payments, partner entries, expenses) for the accountant. ?from=&to= */
export async function GET(request: NextRequest) {
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  const params = request.nextUrl.searchParams;
  const from = isoDateSchema.safeParse(params.get("from"));
  const to = isoDateSchema.safeParse(params.get("to"));
  if (!from.success || !to.success || from.data > to.data) return financeJson({ error: "Choose a valid date range." }, 400);
  try {
    const rows = await transactionsInRange(supabase, { from: from.data, to: to.data });
    const csv = toCsv([
      ["Daily Red Sea transactions", `${from.data} to ${to.data}`, "Reporting currency USD"],
      ["Partner entries: positive = the partner owes Daily Red Sea, negative = Daily Red Sea owes the partner."],
      [],
      TRANSACTION_COLUMNS.map(([, label]) => label),
      ...rows.map((row) => TRANSACTION_COLUMNS.map(([key]) => cell(row[key]))),
    ]);
    return new Response("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dailyredsea-transactions-${from.data}-to-${to.data}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return financeDbError(error);
  }
}
