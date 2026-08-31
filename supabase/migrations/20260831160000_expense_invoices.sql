-- Uploaded supplier/vendor invoice documents that are read (OCR or PDF text
-- layer) in the browser and then reviewed before being posted as an expense.

create table if not exists public.expense_invoices (
  id uuid primary key default gen_random_uuid(),
  file_path text not null,
  file_name text not null,
  mime_type text,
  file_size integer check (file_size is null or file_size >= 0),
  status text not null default 'pending' check (status in ('pending', 'posted', 'rejected')),
  extraction_method text check (extraction_method is null or extraction_method in ('pdf_text', 'ocr', 'none')),
  ocr_confidence numeric(5,2),
  raw_text text,
  vendor text,
  suggested_description text,
  suggested_amount numeric(12,2),
  suggested_currency text,
  suggested_date date,
  suggested_expense_type text,
  suggested_category text,
  line_items jsonb,
  parsed jsonb,
  expense_id uuid references public.expenses(id) on delete set null,
  created_at timestamptz not null default now(),
  created_by text,
  reviewed_at timestamptz,
  reviewed_by text
);

create index if not exists expense_invoices_status_idx
  on public.expense_invoices (status, created_at desc);

alter table public.expense_invoices enable row level security;

drop policy if exists "Authorized admin manages expense invoices" on public.expense_invoices;
create policy "Authorized admin manages expense invoices" on public.expense_invoices
  for all to authenticated
  using (public.is_daily_red_sea_admin())
  with check (public.is_daily_red_sea_admin());

-- Private bucket for the raw invoice files. Signed upload/download URLs are
-- minted by the admin API using the service role key.
insert into storage.buckets (id, name, public)
values ('expense-invoices', 'expense-invoices', false)
on conflict (id) do nothing;

drop policy if exists "Authorized admin reads expense invoice files" on storage.objects;
create policy "Authorized admin reads expense invoice files" on storage.objects
  for select to authenticated
  using (bucket_id = 'expense-invoices' and public.is_daily_red_sea_admin());

drop policy if exists "Authorized admin writes expense invoice files" on storage.objects;
create policy "Authorized admin writes expense invoice files" on storage.objects
  for all to authenticated
  using (bucket_id = 'expense-invoices' and public.is_daily_red_sea_admin())
  with check (bucket_id = 'expense-invoices' and public.is_daily_red_sea_admin());
