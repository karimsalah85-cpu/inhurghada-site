-- Assign bookings to sales people and preserve the commission rate used for each sale.
alter table public.bookings
  add column if not exists sales_person_id uuid references public.sales_people(id) on delete set null,
  add column if not exists sales_commission_percent numeric(5,2)
    check (sales_commission_percent is null or (sales_commission_percent >= 0 and sales_commission_percent <= 100));

create index if not exists bookings_sales_person_idx
  on public.bookings(sales_person_id, date, status)
  where sales_person_id is not null;
