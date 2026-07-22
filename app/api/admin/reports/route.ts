import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import { createClient } from "@/utils/supabase/server";

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

function createPdfStream(summary: unknown[][], rows: ReportRow[]) {
  let document: PDFKit.PDFDocument | undefined;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      try {
        document = new PDFDocument({ margin: 42 });
        document.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
        document.on("end", () => controller.close());
        document.on("error", (error: Error) => controller.error(error));

        document.fontSize(18).text("Daily Red Sea - Situation Report");
        document.moveDown();
        summary
          .slice(1)
          .forEach((line) => document?.fontSize(10).text(`${line[0]}: ${line[1]}`));
        document.moveDown();
        rows.forEach((row, index) => {
          if (!document) return;
          if (document.y > 720) document.addPage();
          document
            .fontSize(9)
            .text(
              `${index + 1}. ${row.Reference} | ${row.Trip} | ${row["Service date"]} | ${row.People} people | ${row.Status} | ${row.Amount.toFixed(2)} ${row.Currency}`,
            );
        });
        document.end();
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      document?.destroy();
    },
  });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), "Summary");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Detailed data");
    const output = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(new Uint8Array(output), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=\"daily-red-sea-situation-report.xlsx\"",
        "Cache-Control": "private, no-store",
      },
    });
  }

  if (format === "pdf") {
    return new Response(createPdfStream(summary, rows), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"daily-red-sea-situation-report.pdf\"",
        "Cache-Control": "private, no-store",
      },
    });
  }

  return NextResponse.json({ error: "Choose pdf or xlsx." }, { status: 400 });
}
