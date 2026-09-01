import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createReportPdf } from "@/lib/report-service";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { countDistinctCustomers } from "@/lib/customer-count";

export const runtime = "nodejs";

const safeCell = (value: unknown) =>
  typeof value === "string" && /^[=+\-@]/.test(value) ? `'${value}` : value;

type ReportRow = {
  Reference: unknown;
  Trip: unknown;
  "Service date": string;
  People: number;
  Status: string;
  Payment: string;
  Amount: number;
  Currency: string;
  Supplier: unknown;
  Expenses: number;
  Margin: number;
  "Other currency costs": unknown;
};

export async function GET(request: NextRequest) {
  const { supabase, allowed } = await getAdminAuthorization("view_reports");
  if (!allowed) return NextResponse.json({ error: "Reports permission required." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });

  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format");
  const from = searchParams.get("from") || "1900-01-01";
  const to = searchParams.get("to") || "2999-12-31";
  const trip = searchParams.get("trip") || "all";
  const status = searchParams.get("status") || "all";
  const payment = searchParams.get("payment") || "all";
  const idsValue = searchParams.get("ids") || "";
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const ids = idsValue ? [...new Set(idsValue.split(","))] : [];
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(from) || !datePattern.test(to) || from > to || trip.length > 200 || ids.length > 100 || ids.some((id) => !uuidPattern.test(id)) || !["all", "new", "confirmed", "completed", "cancelled"].includes(status) || !["all", "unpaid", "paid", "refunded"].includes(payment)) {
    return NextResponse.json({ error: "Invalid report filters." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
  const reportRowLimit = 10000;
  let query = supabase
    .from("bookings")
    .select("id,reference,tour_name,date,guests,status,payment_status,amount,currency,created_at,phone,customer_email")
    .order("date", { ascending: false })
    .limit(reportRowLimit);

  if (ids.length) query = query.in("id", ids);
  else query = query.is("archived_at", null).gte("date", from).lte("date", to);

  if (trip !== "all") query = query.eq("tour_name", trip);
  if (status !== "all") query = query.eq("status", status);
  if (payment !== "all") query = query.eq("payment_status", payment);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Could not generate report." }, { status: 500 });
  }
  const rowsMayBeTruncated = (data?.length || 0) >= reportRowLimit;

  const bookingIds = (data || []).map(item => item.id).filter(Boolean);
  const { data: expenseRows } = bookingIds.length ? await supabase.from("expenses").select("booking_id,amount,currency,supplier_id,suppliers(name)").in("booking_id", bookingIds) : { data: [] };
  const linkedExpenses = new Map<string, { byCurrency: Record<string, number>; suppliers: Set<string> }>();
  for (const expense of expenseRows || []) { if (!expense.booking_id) continue; const summary = linkedExpenses.get(expense.booking_id) || { byCurrency: {}, suppliers: new Set<string>() }; const currency = expense.currency || "USD"; summary.byCurrency[currency] = (summary.byCurrency[currency] || 0) + Number(expense.amount || 0); const relation = expense.suppliers as unknown as { name?: string } | Array<{ name?: string }> | null; const supplier = Array.isArray(relation) ? relation[0]?.name : relation?.name; if (supplier) summary.suppliers.add(supplier); linkedExpenses.set(expense.booking_id, summary); }
  const rows: ReportRow[] = (data || []).map((item) => {
    const costs = linkedExpenses.get(item.id) || { byCurrency: {}, suppliers: new Set<string>() };
    const bookingCurrency = item.currency || "USD";
    const sameCurrencyExpenses = costs.byCurrency[bookingCurrency] || 0;
    const otherCurrencyEntries = Object.entries(costs.byCurrency).filter(([currency]) => currency !== bookingCurrency);
    return ({
    Reference: safeCell(item.reference),
    Trip: safeCell(item.tour_name || "Private transfer"),
    "Service date": item.date || "To confirm",
    People: item.guests || 0,
    Status: item.status,
    Payment: item.payment_status,
    Amount: Number(item.amount || 0),
    Currency: item.currency,
    Supplier: safeCell([...costs.suppliers].join(", ") || "Unassigned"),
    Expenses: sameCurrencyExpenses,
    Margin: Number(item.amount || 0) - sameCurrencyExpenses,
    "Other currency costs": safeCell(otherCurrencyEntries.length ? otherCurrencyEntries.map(([currency, amount]) => `${amount.toFixed(2)} ${currency}`).join(" + ") : ""),
  }); });
  const active = rows.filter((item) => item.Status !== "cancelled" && item.Payment !== "refunded");
  const customers = countDistinctCustomers((data || []).filter((item) => item.status !== "cancelled" && item.payment_status !== "refunded"));
  const revenueByCurrency = active.reduce<Record<string, number>>((totals, item) => {
    totals[item.Currency || "USD"] = (totals[item.Currency || "USD"] || 0) + item.Amount;
    return totals;
  }, {});
  const revenueLabel = Object.entries(revenueByCurrency).map(([currency, amount]) => `${amount.toFixed(2)} ${currency}`).join(" + ") || "0.00 USD";
  const summary = [
    ["Situation report"],
    ["Period", `${from} to ${to}`],
    ["Generated", new Date().toISOString()],
    ["Filters", `Trip: ${trip}; Status: ${status}; Payment: ${payment}`],
    ["Bookings", rows.length],
    ["Customers (excluding cancelled)", customers],
    ["People (excluding cancelled)", active.reduce((sum, item) => sum + Number(item.People), 0)],
    ["Cancelled", rows.length - active.length],
    [
      "Revenue (excluding cancelled)",
      revenueLabel,
    ],
    ...(rowsMayBeTruncated
      ? [["Warning", `This report hit its ${reportRowLimit}-row safety limit — narrow the date range to confirm totals are complete.`]]
      : []),
  ];

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Daily Red Sea";
    workbook.created = new Date();
    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.addRows(summary);
    summarySheet.getColumn(1).width = 30;
    summarySheet.getColumn(2).width = 48;
    summarySheet.getRow(1).font = { bold: true, size: 16 };

    const detailsSheet = workbook.addWorksheet("Detailed data");
    detailsSheet.columns = Object.keys(rows[0] || { Reference: "", Trip: "", "Service date": "", People: 0, Status: "", Payment: "", Amount: 0, Currency: "", Supplier: "", Expenses: 0, Margin: 0, "Other currency costs": "" }).map((header) => ({ header, key: header, width: header === "Trip" ? 34 : header === "Other currency costs" ? 26 : 18 }));
    detailsSheet.addRows(rows);
    detailsSheet.getRow(1).font = { bold: true };
    detailsSheet.views = [{ state: "frozen", ySplit: 1 }];
    const output = await workbook.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(output), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=\"daily-red-sea-situation-report.xlsx\"",
        "Cache-Control": "private, no-store",
      },
    });
  }

  if (format === "pdf") {
    const output = createReportPdf({
      from,
      to,
      trip,
      status,
      payment,
      generatedAt: new Date().toISOString(),
      bookings: rows.length,
      customers,
      people: active.reduce((sum, item) => sum + Number(item.People), 0),
      cancelled: rows.length - active.length,
      revenue: active.reduce((sum, item) => sum + Number(item.Amount), 0),
      revenueLabel,
      rows: rows.map((row) => ({
        reference: String(row.Reference ?? ""),
        trip: String(row.Trip ?? ""),
        serviceDate: row["Service date"],
        people: row.People,
        status: row.Status,
        paymentStatus: row.Payment,
        amount: row.Amount,
        currency: row.Currency,
      })),
    });
    return new NextResponse(new Uint8Array(output), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"daily-red-sea-situation-report.pdf\"",
        "Cache-Control": "private, no-store",
      },
    });
  }

  return NextResponse.json({ error: "Choose pdf or xlsx." }, { status: 400 });
}
