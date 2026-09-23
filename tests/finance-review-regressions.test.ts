import { it, expect } from 'vitest';
import { createFinanceDatabase, createBooking, createSupplier, assignSupplier, setRate, lines, actAs, owner, n } from './support/finance-db';

it('keeps the automatic ledger USD value aligned after an exact-date FX backfill', async () => {
  const db = await createFinanceDatabase();
  try {
    await setRate(db, '2026-09-01', 'EUR', 0.8);
    const supplier = await createSupplier(db);
    const booking = await createBooking(db, { amount: 100, currency: 'EUR', date: '2026-09-02' });
    await assignSupplier(db, booking, supplier, 60, 'EUR');
    await setRate(db, '2026-09-02', 'EUR', 1);
    await db.query('select public.finance_refresh_unlocked_fx()');
    const [line] = await lines(db, booking);
    expect(n(line.drs_commission_usd)).toBe('40.00');
    const { rows } = await db.query<{total: string}>('select sum(amount_usd) as total from public.supplier_ledger where booking_id=$1', [booking]);
    expect(n(rows[0].total)).toBe('40.00');
  } finally { await db.close(); }
}, 120000);

it('does not apply an old supplier payment to the replacement supplier balance', async () => {
  const db = await createFinanceDatabase();
  try {
    const first = await createSupplier(db, 'First');
    const second = await createSupplier(db, 'Second');
    const booking = await createBooking(db, { amount: 100 });
    await assignSupplier(db, booking, first, 60);
    const [line] = await lines(db, booking);
    await actAs(db, owner);
    await db.query('select public.finance_update_line($1,$2)', [line.id, JSON.stringify({ collected_by: 'daily_red_sea' })]);
    await db.query("select public.finance_post_supplier_entry($1,'payment_to_supplier',60,'USD','2026-10-10',$2,null)", [first, line.id]);
    await db.query('select public.finance_update_line($1,$2)', [line.id, JSON.stringify({ supplier_id: second, supplier_cost: { mode: 'amount', amount: 60, currency: 'USD' } })]);
    const [updated] = await lines(db, booking);
    expect(n(updated.balance)).toBe('-60.00');
    expect(updated.supplier_cost_paid_status).toBe('unpaid');
  } finally { await db.close(); }
}, 120000);
