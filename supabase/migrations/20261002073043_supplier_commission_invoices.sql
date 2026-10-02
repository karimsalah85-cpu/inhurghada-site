-- Immutable document snapshots. Issuing a statement does not post a second ledger charge.
create table public.supplier_commission_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no bigint generated always as identity unique,
  reference text generated always as ('DRS-COM-' || lpad(invoice_no::text, 8, '0')) stored unique,
  supplier_id uuid not null references public.suppliers(id),
  document jsonb not null check (jsonb_typeof(document) = 'object'),
  status text not null default 'draft' check (status in ('draft', 'sending', 'sent', 'delivery_unknown')),
  recipient text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint commission_sent_metadata check (status <> 'sent' or (recipient is not null and sent_at is not null))
);
create index supplier_commission_invoices_supplier_created on public.supplier_commission_invoices(supplier_id, created_at desc);
alter table public.supplier_commission_invoices enable row level security;
revoke all on public.supplier_commission_invoices from anon, authenticated;
grant select on public.supplier_commission_invoices to authenticated;
grant all on public.supplier_commission_invoices to service_role;
grant usage, select on sequence public.supplier_commission_invoices_invoice_no_seq to service_role;
create policy "Finance staff read commission invoices" on public.supplier_commission_invoices
  for select to authenticated using (public.admin_has_permission('view_finance'));
comment on table public.supplier_commission_invoices is 'Commission statement snapshots; writes via permission-checked admin API only. Does not create or settle ledger entries.';
