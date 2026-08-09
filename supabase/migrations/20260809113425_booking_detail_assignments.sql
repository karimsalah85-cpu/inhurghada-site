alter table public.suppliers add column if not exists type text not null default 'other';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'suppliers_type_check') then
    alter table public.suppliers add constraint suppliers_type_check check (type in ('boat', 'driver', 'guide', 'other'));
  end if;
end $$;

create index if not exists expenses_booking_id_idx on public.expenses (booking_id);
create index if not exists expenses_supplier_id_idx on public.expenses (supplier_id);
create index if not exists booking_assignments_booking_id_idx on public.booking_assignments (booking_id);
create index if not exists booking_assignments_supplier_id_idx on public.booking_assignments (supplier_id);
create index if not exists booking_assignments_staff_member_id_idx on public.booking_assignments (staff_member_id);
