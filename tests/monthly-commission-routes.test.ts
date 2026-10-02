import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { buildMonthlyCommission } from "@/lib/finance/monthly-commission";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), origin: vi.fn(), admin: vi.fn(), monthly: vi.fn() }));
vi.mock("@/lib/finance/api", () => ({ financeAuthorization: mocks.auth, isUuid: (v: string) => /^[0-9a-f-]{36}$/.test(v), financeJson: (body: unknown, status = 200) => Response.json(body, { status }), financeDbError: () => Response.json({ error: "Source changed" }, { status: 400 }) }));
vi.mock("@/lib/request-origin", () => ({ hasValidRequestOrigin: mocks.origin }));
vi.mock("@/utils/supabase/admin", () => ({ createRequiredAdminClient: mocks.admin }));
vi.mock("@/lib/finance/monthly-commission-data", () => ({ loadMonthlyCommission: mocks.monthly }));
import { GET } from "@/app/api/admin/finance/suppliers/[id]/invoices/monthly/route";
import { POST } from "@/app/api/admin/finance/suppliers/[id]/invoices/route";
const id = "45b9782c-c235-4db3-b9dc-124d49021a9f";
const invoiceId = "45b9782c-c235-4db3-b9dc-124d49021a9e";
const context = { params: Promise.resolve({ id }) };
const doc = buildMonthlyCommission({ id, name: "Supplier" }, "2026-09", "USD", [{ id, trip_date: "2026-09-21", tour_name: "Boat trip", guests: 1, currency: "USD", recognised_revenue: "100", fx_locked: true, fx_rate_to_usd: "1", supplier_fx_locked: true, supplier_cost_source: "manual_amount", destination: "Jeddah", reference: "DRS-TEST" }], [{ line_id: id, currency: "USD", balance: "25", obligation: "25" }]);
let insert: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetAllMocks(); mocks.origin.mockReturnValue(true); mocks.monthly.mockResolvedValue(doc);
  const supplier = { select: () => supplier, eq: () => supplier, maybeSingle: async () => ({ data: { id }, error: null }) };
  mocks.auth.mockResolvedValue({ user: { id: "user" }, allowed: true, supabase: { from: () => supplier } });
  insert = vi.fn((value: unknown) => ({ select: () => ({ single: async () => ({ data: value, error: null }) }) }));
  const invoices = { select: () => invoices, eq: () => invoices, maybeSingle: async () => ({ data: null, error: null }), insert };
  mocks.admin.mockReturnValue({ from: () => invoices });
});
const req = (document = doc) => new NextRequest("http://localhost/api/invoices", { method: "POST", body: JSON.stringify({ id: invoiceId, document }) });
it("loads a month only for finance users and validates the month", async () => {
  const valid = new NextRequest("http://localhost/monthly?period=2026-09&currency=USD");
  mocks.auth.mockResolvedValueOnce({ user: null, allowed: false });
  expect((await GET(valid, context)).status).toBe(401);
  mocks.auth.mockResolvedValueOnce({ user: { id }, allowed: false });
  expect((await GET(valid, context)).status).toBe(403);
  expect((await GET(new NextRequest("http://localhost/monthly?period=2026-13&currency=USD"), context)).status).toBe(400);
  expect((await GET(valid, context)).status).toBe(200);
  expect(mocks.monthly).toHaveBeenCalledWith(expect.anything(), id, "2026-09", "USD");
});
it("saves canonical finance rows and user notes without creating ledger entries", async () => {
  expect((await POST(req({ ...doc, notes: "Bank transfer" }), context)).status).toBe(201);
  expect(insert).toHaveBeenCalledWith({ id: invoiceId, supplier_id: id, document: { ...doc, notes: "Bank transfer" }, created_by: "user" });
});
it("blocks forged amounts and stale source fingerprints", async () => {
  const forged = structuredClone(doc); forged.rows[0].commissionAmount = "100";
  expect((await POST(req(forged), context)).status).toBe(400);
  mocks.monthly.mockResolvedValue({ ...doc, source: { ...doc.source, fingerprint: "b".repeat(64) } });
  expect((await POST(req(), context)).status).toBe(400);
  expect(insert).not.toHaveBeenCalled();
});
it("requires origin and management permission before saving", async () => {
  mocks.origin.mockReturnValueOnce(false);
  expect((await POST(req(), context)).status).toBe(403);
  mocks.auth.mockResolvedValueOnce({ user: { id }, allowed: false });
  expect((await POST(req(), context)).status).toBe(403);
  expect(insert).not.toHaveBeenCalled();
});
it("keeps finance-edited ticket prices but recomputes everything else", async () => {
  const edited = structuredClone(doc); edited.rows[0].ticketPrice = "110.00";
  expect((await POST(req(edited), context)).status).toBe(201);
  expect(insert.mock.calls[0][0].document.rows[0]).toMatchObject({ ticketPrice: "110.00", commissionAmount: "25.00" });
});
