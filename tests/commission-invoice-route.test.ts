import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { septemberHaddadInvoice } from "@/lib/finance/commission-invoice";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), origin: vi.fn(), admin: vi.fn(), send: vi.fn(), pdf: vi.fn() }));
vi.mock("@/lib/finance/api", () => ({ financeAuthorization: mocks.auth, isUuid: (v: string) => /^[0-9a-f-]{36}$/.test(v), financeJson: (body: unknown, status = 200) => Response.json(body, { status }), financeDbError: () => Response.json({ error: "Database failed" }, { status: 500 }) }));
vi.mock("@/lib/request-origin", () => ({ hasValidRequestOrigin: mocks.origin }));
vi.mock("@/utils/supabase/admin", () => ({ createRequiredAdminClient: mocks.admin }));
vi.mock("@/lib/booking-service", () => ({ sendBookingEmail: mocks.send }));
vi.mock("@/lib/finance/commission-invoice-pdf", () => ({ createCommissionInvoicePdf: mocks.pdf }));
import { POST, GET } from "@/app/api/admin/finance/suppliers/[id]/invoices/[invoiceId]/route";
const supplierId = "45b9782c-c235-4db3-b9dc-124d49021a9f";
const invoiceId = "45b9782c-c235-4db3-b9dc-124d49021a9e";
const context = { params: Promise.resolve({ id: supplierId, invoiceId }) };
const request = (body: unknown = { recipient: "supplier@example.com", confirm: true }) => new NextRequest(`http://localhost/api/admin/finance/suppliers/${supplierId}/invoices/${invoiceId}`, { method: "POST", body: JSON.stringify(body) });
let record: { status: string; document: typeof septemberHaddadInvoice; reference: string };
let claimed: boolean;
let writes: unknown[];
beforeEach(() => {
  vi.clearAllMocks(); claimed = false; writes = [];
  record = { status: "draft", document: septemberHaddadInvoice, reference: "DRS-COM-00000001" };
  const query = { select: () => query, eq: vi.fn(() => query), maybeSingle: async () => ({ data: record, error: null }) };
  mocks.auth.mockResolvedValue({ user: { id: "user" }, allowed: true, supabase: { from: () => query } });
  mocks.origin.mockReturnValue(true); mocks.pdf.mockResolvedValue(Buffer.from("pdf")); mocks.send.mockResolvedValue({ success: true });
  mocks.admin.mockReturnValue({ from: () => ({ update: (value: { status: string }) => {
    writes.push(value);
    const update = { eq: () => update, select: () => update, maybeSingle: async () => { if (claimed) return { data: null, error: null }; claimed = true; return { data: { id: invoiceId }, error: null }; }, then: (resolve: (r: unknown) => void) => resolve({ error: null }) };
    return update;
  } }) });
});
it("blocks unauthenticated and non-finance users before delivery", async () => {
  mocks.auth.mockResolvedValueOnce({ user: null, allowed: false });
  expect((await POST(request(), context)).status).toBe(401);
  mocks.auth.mockResolvedValueOnce({ user: { id: "u" }, allowed: false });
  expect((await POST(request(), context)).status).toBe(403);
  expect(mocks.send).not.toHaveBeenCalled();
});
it("blocks foreign origins and unconfirmed recipients", async () => {
  mocks.origin.mockReturnValueOnce(false);
  expect((await POST(request(), context)).status).toBe(403);
  expect((await POST(request({ recipient: "supplier@example.com" }), context)).status).toBe(400);
  expect((await POST(request({ recipient: "bad", confirm: true }), context)).status).toBe(400);
  expect(mocks.send).not.toHaveBeenCalled();
});
it("sends the saved PDF once even with concurrent requests", async () => {
  const results = await Promise.all([POST(request(), context), POST(request(), context)]);
  expect(results.map(r => r.status).sort()).toEqual([200, 409]);
  expect(mocks.send).toHaveBeenCalledTimes(1);
  expect(mocks.send.mock.calls[0][3]).toEqual({ filename: "DRS-COM-00000001.pdf", content: Buffer.from("pdf") });
  expect(writes).toContainEqual(expect.objectContaining({ status: "sent" }));
});
it("blocks previously sent statements", async () => {
  record.status = "sent";
  expect((await POST(request(), context)).status).toBe(409);
  expect(mocks.send).not.toHaveBeenCalled();
});
it("records ambiguous provider failures without automatically retrying", async () => {
  mocks.send.mockRejectedValue(new Error("timeout"));
  expect((await POST(request(), context)).status).toBe(502);
  expect(writes).toContainEqual({ status: "delivery_unknown", sent_at: null });
  expect(mocks.send).toHaveBeenCalledTimes(1);
});
it("preview is private and never sends an email", async () => {
  const response = await GET(new NextRequest(`http://localhost/invoice?format=email`), context);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("content-security-policy")).toContain("sandbox");
  expect(await response.text()).toContain("$123.50");
  expect(mocks.send).not.toHaveBeenCalled();
});
