import { describe, expect, it } from 'vitest';
import { supplierCostFromSplit } from '@/lib/finance/booking-split';
describe('booking share entry', () => {
 it('turns a DRS cut into the complementary supplier cost exactly', () => {
  expect(supplierCostFromSplit('100.10','20.05','drs_cut','EGP')).toEqual({mode:'amount',amount:'80.05',currency:'EGP'});
 });
 it('accepts supplier amount directly, including zero', () => {
  expect(supplierCostFromSplit('100','80','supplier_amount','USD').amount).toBe('80.00');
  expect(supplierCostFromSplit('100','0','drs_cut','USD').amount).toBe('100.00');
 });
 it('rejects negative, excessive and fractional-cent shares', () => {
  for(const cut of ['-1','101','0.001']) expect(()=>supplierCostFromSplit('100',cut,'drs_cut','USD')).toThrow();
 });
});

it('persists the split and reverses the amount due when the collector changes', async () => {
 const {createFinanceDatabase,createSupplier,createBooking,assignSupplier,actAs,owner,lines,n}=await import('./support/finance-db');
 const db=await createFinanceDatabase();
 try {
  const supplier=await createSupplier(db);
  const booking=await createBooking(db,{amount:100});
  await assignSupplier(db,booking,supplier);
  const [line]=await lines(db,booking);
  await actAs(db,owner);
  await db.query('select public.finance_update_line($1,$2)',[line.id,JSON.stringify({supplier_cost:supplierCostFromSplit('100','20','drs_cut','USD'),collected_by:'supplier'})]);
  expect(n((await lines(db,booking))[0].balance)).toBe('20.00');
  await db.query('select public.finance_update_line($1,$2)',[line.id,JSON.stringify({collected_by:'daily_red_sea'})]);
  expect(n((await lines(db,booking))[0].balance)).toBe('-80.00');
    await expect(db.query('select public.finance_update_line($1,$2)', [line.id, JSON.stringify({ collection_status: 'partial', collected_amount: '100.01' })])).rejects.toThrow(/cannot exceed the net selling price/);
 } finally {await db.close();}
},120000);
