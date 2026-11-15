import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
const mocks = vi.hoisted(() => ({ from: vi.fn(), load: vi.fn(), permission: vi.fn(), allowed: true }));
vi.mock("@/lib/admin-permission", () => ({
  getAdminAuthorization: async () => ({ supabase: { from: mocks.from }, user: { id: "owner" }, allowed: mocks.allowed }),
  hasLivePermission: mocks.permission,
}));
vi.mock("@/lib/finance/load-booking-report", () => ({ loadBookingReports: mocks.load }));
vi.mock("@/lib/report-service", () => ({ createReportPdf: vi.fn(async () => Buffer.from("pdf")) }));
import { GET } from "@/app/api/admin/reports/route";
import { GET as metrics } from "@/app/api/admin/reports/metrics/route";
import { createReportPdf } from "@/lib/report-service";
const booking = { id: "b", reference: "DRS-20261114-212931", tour_name: "Quad", date: "2026-11-15", guests: 3, amount: 110.38, currency: "USD", status: "completed", payment_status: "paid" };
beforeEach(() => {
  vi.clearAllMocks(); mocks.allowed = true; mocks.permission.mockResolvedValue(true);
  mocks.load.mockResolvedValue({ b: { revenue: 88.30, costs: 68.48, margin: 19.82, received: 110.38, refunded: 22.08, netPaid: 88.30, outstanding: 0, paymentRecorded: true, costComplete: true } });
  mocks.from.mockImplementation(() => {
    const q: Record<string, unknown> = {};
    for (const method of ["select", "order", "limit", "is", "gte", "lte", "eq", "in", "range"]) q[method] = () => q;
    q.then = (resolve: (r: unknown) => unknown) => Promise.resolve({ data: [booking], error: null }).then(resolve);
    return q;
  });
});
const request = (format: string) => new NextRequest(`https://dailyredsea.com/api/admin/reports?format=${format}`);
describe("financial report delivery", () => {
  it("exports recorded refunds and partner costs to Excel", async () => {
    const response = await GET(request("xlsx")); expect(response.status).toBe(200);
    const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(Buffer.from(await response.arrayBuffer()) as never);
    const details = workbook.getWorksheet("Detailed data")!;
    const headings = details.getRow(1).values as string[];
    const row = details.getRow(2);
    expect(row.getCell(headings.indexOf("Expenses")).value).toBe(68.48);
    expect(row.getCell(headings.indexOf("Margin")).value).toBe(19.82);
    expect(row.getCell(headings.indexOf("Net paid")).value).toBe(88.30);
    expect(row.getCell(headings.indexOf("Refunds / credits")).value).toBe(22.08);
  });
  it("uses the same payment summary in PDF", async () => {
    expect((await GET(request("pdf"))).status).toBe(200);
    expect(createReportPdf).toHaveBeenCalledWith(expect.objectContaining({ paymentSummary: expect.arrayContaining([["Net paid", "88.30 USD"], ["Refunds / credits", "22.08 USD"]]) }));
  });
  it("denies finance totals when finance permission is missing", async () => {
    mocks.permission.mockResolvedValue(false);
    expect((await GET(request("xlsx"))).status).toBe(403);
    expect((await metrics()).status).toBe(403); expect(mocks.load).not.toHaveBeenCalled();
  });
  it("fails explicitly on missing finance rather than fabricating zero costs", async () => {
    mocks.load.mockRejectedValue(new Error("missing"));
    expect((await GET(request("xlsx"))).status).toBe(503);
    expect((await metrics()).status).toBe(503);
  });
});
