import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createReportPdf } from "@/lib/report-service";
import { createClient } from "@/utils/supabase/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const safeCell = (value: unknown) =>
  typeof value === "string" && /^[=+\-@]/.test(value) ? `'${value}` : value;

type ReportRow = {
  Reference: unknown;
  Trip: unknown;
  "Service date": string;
  People: number;
  Status: string;
  Amount: number;
  Currency: string;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAuthorizedAdmin(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });

  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format");
  const from = searchParams.get("from") || "1900-01-01";
  const to = searchParams.get("to") || "2999-12-31";
  const trip = searchParams.get("trip") || "all";
  const status = searchParams.get("status") || "all";
  let query = supabase
    .from("bookings")
    .select("reference,tour_name,date,guests,status,amount,currency,created_at")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false });

  if (trip !== "all") query = query.eq("tour_name", trip);
  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Could not generate report." }, { status: 500 });
  }

  const rows: ReportRow[] = (data || []).map((item) => ({
    Reference: safeCell(item.reference),
    Trip: safeCell(item.tour_name || "Private transfer"),
    "Service date": item.date || "To confirm",
    People: item.guests || 0,
    Status: item.status,
    Amount: Number(item.amount || 0),
    Currency: item.currency,
  }));
  const active = rows.filter((item) => item.Status !== "cancelled");
  const summary = [
    ["Situation report"],
    ["Period", `${from} to ${to}`],
    ["Generated", new Date().toISOString()],
    ["Filters", `Trip: ${trip}; Status: ${status}`],
    ["Bookings", rows.length],
    ["People (excluding cancelled)", active.reduce((sum, item) => sum + Number(item.People), 0)],
    ["Cancelled", rows.length - active.length],
    [
      "Revenue (excluding cancelled)",
      active.reduce((sum, item) => sum + Number(item.Amount), 0),
    ],
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
    detailsSheet.columns = Object.keys(rows[0] || { Reference: "", Trip: "", "Service date": "", People: 0, Status: "", Amount: 0, Currency: "" }).map((header) => ({ header, key: header, width: header === "Trip" ? 34 : 18 }));
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
      generatedAt: new Date().toISOString(),
      bookings: rows.length,
      people: active.reduce((sum, item) => sum + Number(item.People), 0),
      cancelled: rows.length - active.length,
      revenue: active.reduce((sum, item) => sum + Number(item.Amount), 0),
      rows: rows.map((row) => ({
        reference: String(row.Reference ?? ""),
        trip: String(row.Trip ?? ""),
        serviceDate: row["Service date"],
        people: row.People,
        status: row.Status,
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
