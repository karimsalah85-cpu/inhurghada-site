-- Local-only SYNTHETIC finance demo data (loaded by `supabase db reset --local`
-- after seed.sql). Every name, phone and amount is made up. References start
-- with DEMO- and ids with 00000000-0000-4000-8000-, so it is easy to spot.
-- Safe to re-run: every insert is idempotent. Never load this into production.
--
-- Scenario (September 2026, manual exchange rates):
--   DEMO-1001 Orange Bay, Hurghada, EUR 90, boat partner costs EGP 2,400
--   DEMO-1002 Dolphin House, Marsa Alam, GBP 120, dive company costs EGP 3,000
--   DEMO-1003 Desert safari, Hurghada, USD 70, cancelled (partner cost reversed)
--   DEMO-1004 Basic diver, Jeddah, SAR 450, no partner yet
--   DEMO-1005 Airport transfer, EGP 1,200, driver costs EGP 600
--   Expenses: boat fuel (EGP, linked to DEMO-1001), Google Ads (USD), office rent (EGP)

insert into public.fx_rates (rate_date, currency, units_per_usd, source, note)
select d::date, c.currency::public.finance_currency, c.units, 'manual', 'Synthetic demo rate'
from generate_series('2026-09-01'::date, '2026-09-30'::date, interval '1 day') d
cross join (values ('EUR', 0.86::numeric), ('GBP', 0.74), ('EGP', 48.50), ('SAR', 3.75)) as c(currency, units)
on conflict (rate_date, currency) do nothing;

insert into public.finance_tour_dimensions (tour_slug, tour_name, destination, product_line) values
  ('orange-bay', 'Orange Bay Island Trip', 'hurghada', 'Island Trip'),
  ('safari', 'Desert Safari', 'hurghada', 'Desert Safari'),
  ('dolphin-house-marsa-alam', 'Dolphin House Snorkeling', 'marsa-alam', 'Snorkeling'),
  ('basic-diver-jeddah', 'Basic Diver Jeddah', 'jeddah', 'Diving')
on conflict (tour_slug) do nothing;

insert into public.suppliers (id, name, type, contact_name, phone, whatsapp, payment_method, payment_details, default_currency, notes) values
  ('00000000-0000-4000-8000-000000000101', 'Demo Captain Boat', 'boat', 'Demo Captain', '+201000000101', '+201000000101', 'instapay', 'demo-captain@instapay', 'EGP', 'Synthetic demo partner'),
  ('00000000-0000-4000-8000-000000000102', 'Demo Guide', 'guide', null, '+201000000102', '+201000000102', 'cash', null, 'EGP', 'Synthetic demo partner'),
  ('00000000-0000-4000-8000-000000000103', 'Demo Driver', 'driver', null, '+201000000103', '+201000000103', 'vodafone_cash', '010 0000 0103', 'EGP', 'Synthetic demo partner'),
  ('00000000-0000-4000-8000-000000000104', 'Demo Beach Hotel', 'hotel', 'Front desk', '+201000000104', null, 'bank_transfer', 'DEMO BANK 0000104', 'EGP', 'Synthetic demo partner'),
  ('00000000-0000-4000-8000-000000000105', 'Demo Safari Company', 'company', 'Operations desk', '+201000000105', '+201000000105', 'bank_transfer', 'DEMO BANK 0000105', 'EGP', 'Synthetic demo partner'),
  ('00000000-0000-4000-8000-000000000106', 'Demo Marsa Alam Dive Co', 'company', 'Dive desk', '+201000000106', '+201000000106', 'cash', null, 'EGP', 'Synthetic demo partner')
on conflict (id) do nothing;

insert into public.sales_people (id, name, phone, commission_percent, notes) values
  ('00000000-0000-4000-8000-000000000201', 'Demo Hotel Desk', '+201000000201', 10, 'Synthetic demo sales person')
on conflict (id) do nothing;

insert into public.bookings (id, reference, type, customer_name, customer_email, phone, tour_name, tour_slug, date, guests, adults, youth,
  amount, subtotal, currency, status, payment_status, sales_person_id, sales_commission_percent, notes) values
  ('00000000-0000-4000-8000-000000001001', 'DEMO-1001', 'tour', 'Demo Guest One', 'demo1@example.com', '+440000001001', 'Orange Bay Island Trip', 'orange-bay', '2026-09-12', 2, 2, 0, 90, 90, 'EUR', 'confirmed', 'paid', '00000000-0000-4000-8000-000000000201', 10, 'Synthetic demo booking'),
  ('00000000-0000-4000-8000-000000001002', 'DEMO-1002', 'tour', 'Demo Guest Two', 'demo2@example.com', '+440000001002', 'Dolphin House Snorkeling', 'dolphin-house-marsa-alam', '2026-09-15', 2, 2, 0, 120, 120, 'GBP', 'completed', 'paid', null, null, 'Synthetic demo booking'),
  ('00000000-0000-4000-8000-000000001003', 'DEMO-1003', 'tour', 'Demo Guest Three', 'demo3@example.com', '+490000001003', 'Desert Safari', 'safari', '2026-09-18', 2, 2, 0, 70, 70, 'USD', 'cancelled', 'unpaid', null, null, 'Synthetic demo booking: cancelled for weather'),
  ('00000000-0000-4000-8000-000000001004', 'DEMO-1004', 'tour', 'Demo Guest Four', 'demo4@example.com', '+966000001004', 'Basic Diver Jeddah', 'basic-diver-jeddah', '2026-09-20', 1, 1, 0, 450, 450, 'SAR', 'confirmed', 'paid', null, null, 'Synthetic demo booking'),
  ('00000000-0000-4000-8000-000000001005', 'DEMO-1005', 'transfer', 'Demo Guest Five', 'demo5@example.com', '+200000001005', 'Airport transfer', null, '2026-09-22', 3, 3, 0, 1200, 1200, 'EGP', 'confirmed', 'unpaid', null, null, 'Synthetic demo booking')
on conflict (id) do nothing;

insert into public.booking_assignments (id, booking_id, supplier_id, assignment_type, internal_cost, currency, status, notes) values
  ('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000101', 'supplier', 2400, 'EGP', 'accepted', 'Synthetic demo'),
  ('00000000-0000-4000-8000-000000002002', '00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000000106', 'supplier', 3000, 'EGP', 'completed', 'Synthetic demo'),
  ('00000000-0000-4000-8000-000000002003', '00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000000105', 'supplier', 1500, 'EGP', 'cancelled', 'Synthetic demo'),
  ('00000000-0000-4000-8000-000000002005', '00000000-0000-4000-8000-000000001005', '00000000-0000-4000-8000-000000000103', 'supplier', 600, 'EGP', 'accepted', 'Synthetic demo')
on conflict (id) do nothing;

insert into public.expenses (id, description, amount, currency, expense_date, category, expense_type, booking_id, supplier_id, vendor) values
  ('00000000-0000-4000-8000-000000003001', 'Extra boat fuel (demo)', 800, 'EGP', '2026-09-12', 'Fuel', 'other', '00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000101', 'Demo Fuel Station'),
  ('00000000-0000-4000-8000-000000003002', 'Google Ads spend (demo)', 45.30, 'USD', '2026-09-15', 'Advertising', 'other', null, null, 'Demo Ads'),
  ('00000000-0000-4000-8000-000000003003', 'Office rent September (demo)', 15000, 'EGP', '2026-09-01', 'Rent', 'other', null, null, 'Demo Landlord')
on conflict (id) do nothing;

-- Paid online bookings were collected by Daily Red Sea (so DRS owes the partner
-- its cost). The unpaid transfer is paid to the driver in cash on the day (so
-- the driver owes DRS the difference).
update public.booking_financial_lines l
set collected_by = 'daily_red_sea', collection_status = 'collected', collected_amount = l.net_selling_price
from public.bookings b
where b.id = l.booking_id and b.reference in ('DEMO-1001', 'DEMO-1002', 'DEMO-1004')
  and l.collected_by is distinct from 'daily_red_sea';
