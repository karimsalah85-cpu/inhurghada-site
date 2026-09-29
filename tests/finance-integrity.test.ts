import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  actAs, assignSupplier, createBooking, createFinanceDatabase, createStaff, createSupplier, owner, system, type FinanceDb,
} from "./support/finance-db";

let db: FinanceDb;

beforeAll(async () => { db = await createFinanceDatabase(); }, 120_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => { await actAs(db, system); });

const auditRows = async (resourceType: string, resourceId: string) =>
  (await db.query<{ action: string; actor_email: string; before_data: Record<string, unknown> | null; after_data: Record<string, unknown> | null }>(
    "select action, actor_email, before_data, after_data from public.admin_audit_log where resource_type = $1 and resource_id = $2 order by id",
    [resourceType, resourceId])).rows;

describe("financial records are never hard-deleted", () => {
  it("blocks deleting bookings, expenses, partners, assignments and receipts", async () => {
    const supplier = await createSupplier(db, "Delete Guard Boat");
    const booking = await createBooking(db, { amount: 80, status: "new", payment_status: "unpaid" });
    await assignSupplier(db, booking, supplier, 40);
    const { rows: [expense] } = await db.query<{ id: string }>(
      "insert into public.expenses(description, amount, currency, expense_date) values ('Fuel', 10, 'EGP', '2026-10-01') returning id");
    const { rows: [salesPerson] } = await db.query<{ id: string }>("insert into public.sales_people(name) values ('Hotel desk') returning id");
    const { rows: [invoice] } = await db.query<{ id: string }>(
      "insert into public.expense_invoices(file_path, file_name) values ('x/receipt.jpg', 'receipt.jpg') returning id");

    const attempts: [string, string][] = [
      ["bookings", booking], ["expenses", expense.id], ["suppliers", supplier], ["sales_people", salesPerson.id],
      ["expense_invoices", invoice.id], ["booking_financials", booking],
    ];
    for (const [table, id] of attempts) {
      const key = table === "booking_financials" ? "booking_id" : "id";
      await expect(db.query(`delete from public.${table} where ${key} = $1`, [id]), table).rejects.toThrow(/never deleted/);
    }
    await expect(db.query("delete from public.booking_assignments where booking_id = $1", [booking])).rejects.toThrow(/never deleted/);
    await expect(db.query("delete from public.booking_financial_lines where booking_id = $1", [booking])).rejects.toThrow(/never deleted/);
    await expect(db.query("truncate public.expenses cascade")).rejects.toThrow(/never deleted/);
  });

  it("allows a deliberate DBA erasure only inside an explicit session override", async () => {
    const { rows: [expense] } = await db.query<{ id: string }>(
      "insert into public.expenses(description, amount, currency, expense_date) values ('Erasure test', 1, 'USD', '2026-10-01') returning id");
    await db.exec("begin");
    await db.exec("set local app.allow_financial_delete = 'on'");
    await db.query("delete from public.expenses where id = $1", [expense.id]);
    await db.exec("commit");
    const { rows } = await db.query("select 1 from public.expenses where id = $1", [expense.id]);
    expect(rows).toHaveLength(0);
    // The override does not persist past the transaction.
    const { rows: [again] } = await db.query<{ id: string }>(
      "insert into public.expenses(description, amount, currency, expense_date) values ('After override', 1, 'USD', '2026-10-01') returning id");
    await expect(db.query("delete from public.expenses where id = $1", [again.id])).rejects.toThrow(/never deleted/);
  });
});

describe("audit trail", () => {
  it("is append-only", async () => {
    await db.query("insert into public.admin_audit_log(action, resource_type, summary) values ('test', 'test', 'immutable')");
    await expect(db.query("update public.admin_audit_log set summary = 'edited' where resource_type = 'test'")).rejects.toThrow(/append-only/);
    await expect(db.query("delete from public.admin_audit_log where resource_type = 'test'")).rejects.toThrow(/append-only/);
  });

  it("still lets a staff login be deleted, keeping who did what by email", async () => {
    const staff = await createStaff(db, "finance");
    await actAs(db, staff);
    const supplier = await createSupplier(db, "Audit Actor Boat");
    await actAs(db, system);
    await db.query("delete from public.admin_profiles where id = $1", [staff.uid]);
    await db.query("delete from auth.users where id = $1", [staff.uid]);
    const [row] = await auditRows("suppliers", supplier);
    expect(row.actor_email).toBe(staff.email);
    await expect(db.query("update public.admin_audit_log set actor_id = null, summary = 'x' where resource_id = $1", [supplier])).rejects.toThrow(/append-only/);
  });

  it("records who changed a booking's money fields, and only those fields", async () => {
    await actAs(db, owner);
    const booking = await createBooking(db, { amount: 120, status: "new", payment_status: "unpaid" });
    await db.query("update public.bookings set notes = 'pickup at 8' where id = $1", [booking]);
    await db.query("update public.bookings set amount = 110, payment_status = 'paid' where id = $1", [booking]);
    const rows = await auditRows("bookings", booking);
    expect(rows.map((row) => row.action)).toEqual(["insert", "update"]);
    expect(rows[1].actor_email).toBe("info@dailyredsea.com");
    expect([rows[1].before_data?.amount, rows[1].after_data?.amount]).toEqual([120, 110]);
    expect(rows[1].after_data?.payment_status).toBe("paid");
    expect(rows[1].after_data).not.toHaveProperty("customer_name");
    expect(rows[1].after_data).not.toHaveProperty("phone");
  });

  it("audits partner and assignment cost changes", async () => {
    const supplier = await createSupplier(db, "Audit Driver");
    await db.query("update public.suppliers set payment_method = 'instapay' where id = $1", [supplier]);
    const rows = await auditRows("suppliers", supplier);
    expect(rows.map((row) => row.action)).toEqual(["insert", "update"]);
    expect(rows[1].after_data?.payment_method).toBe("instapay");
  });
});

describe("partners", () => {
  it("accepts hotel and company partners with WhatsApp and a payment method", async () => {
    const { rows: [row] } = await db.query<Record<string, unknown>>(
      "insert into public.suppliers(name, type, whatsapp, payment_method, payment_details) values ('Sunrise Hotel', 'hotel', '+201001234567', 'bank_transfer', 'CIB 1234') returning *");
    expect([row.type, row.payment_method]).toEqual(["hotel", "bank_transfer"]);
    await db.query("insert into public.suppliers(name, type) values ('Red Sea Co', 'company')");
    await expect(db.query("insert into public.suppliers(name, type) values ('X', 'airline')")).rejects.toThrow(/suppliers_type_check/);
    await expect(db.query("insert into public.suppliers(name, payment_method) values ('X', 'crypto')")).rejects.toThrow(/payment_method/);
  });

  it("freezes the retired supplier_payments table", async () => {
    const supplier = await createSupplier(db, "Legacy Boat");
    await expect(db.query("insert into public.supplier_payments(supplier_id, amount) values ($1, 10)", [supplier])).rejects.toThrow(/retired/);
  });
});

describe("finance access", () => {
  it("is limited to the owner and the accountant", async () => {
    const check = async (role: string) => {
      await actAs(db, await createStaff(db, role));
      const { rows: [row] } = await db.query<{ view: boolean; manage: boolean; expenses: boolean }>(
        "select public.admin_has_permission('view_finance') as view, public.admin_has_permission('manage_finance') as manage, public.admin_has_permission('finance') as expenses");
      return [row.view, row.manage, row.expenses];
    };
    expect(await check("finance")).toEqual([true, true, true]);
    for (const role of ["manager", "sales", "operations", "content_editor"]) expect(await check(role), role).toEqual([false, false, false]);
    await actAs(db, owner);
    const { rows: [row] } = await db.query<{ ok: boolean }>("select public.admin_has_permission('manage_finance') as ok");
    expect(row.ok).toBe(true);
  });
});
