-- Finance: extend the existing expenses table (no parallel table) with source
-- tracking, duplicate-detection keys, voiding, and USD conversion at the
-- invoice (expense) date.

alter table public.expenses alter column currency drop default;
alter table public.expenses alter column currency type public.finance_currency using upper(currency)::public.finance_currency;
alter table public.expenses alter column currency set default 'USD';

alter table public.expenses
  add column source text not null default 'manual' check (source in ('manual', 'invoice_upload', 'google_ads', 'gmail')),
  add column source_ref text,
  add column vendor text check (vendor is null or length(vendor) <= 200),
  add column normalized_vendor text generated always as (nullif(regexp_replace(lower(coalesce(vendor, '')), '[^a-z0-9]+', '', 'g'), '')) stored,
  add column invoice_number text check (invoice_number is null or length(invoice_number) <= 120),
  add column normalized_invoice_number text generated always as (nullif(regexp_replace(upper(coalesce(invoice_number, '')), '[^A-Z0-9]+', '', 'g'), '')) stored,
  add column gmail_message_id text unique,
  add column attachment_sha256 text check (attachment_sha256 is null or attachment_sha256 ~ '^[0-9a-f]{64}$'),
  add column voided_at timestamptz,
  add column voided_by uuid references auth.users(id) on delete set null,
  add column void_reason text,
  add column fx_rate_to_usd numeric(20,12),
  add column fx_rate_date date,
  add column fx_locked boolean not null default false,
  add column amount_usd numeric(14,2),
  add column updated_at timestamptz not null default now(),
  add constraint expenses_void_consistency check (
    (voided_at is null and void_reason is null)
    or (voided_at is not null and length(trim(coalesce(void_reason, ''))) >= 3));

create index expenses_attachment_sha256_idx on public.expenses (attachment_sha256) where attachment_sha256 is not null;
create unique index expenses_vendor_invoice_unique on public.expenses (normalized_vendor, normalized_invoice_number)
  where normalized_vendor is not null and normalized_invoice_number is not null;
create index expenses_pnl_idx on public.expenses (expense_date) where voided_at is null;

update public.expenses set source = 'google_ads', source_ref = external_reference
  where external_reference like 'google-ads:%';
update public.expenses e set source = 'invoice_upload', source_ref = i.id::text
  from public.expense_invoices i where i.expense_id = e.id and e.source = 'manual';

-- Converts to USD at the expense date. A locked rate is kept unless the
-- currency or date changes; an amount change reuses the stored rate.
create function public.finance_expense_before_write() returns trigger
language plpgsql set search_path = '' as $$
declare fx record;
begin
  if tg_op = 'UPDATE' and old.voided_at is not null then
    raise exception 'A voided expense cannot be changed.' using errcode = '55000';
  end if;
  if tg_op = 'INSERT' or not new.fx_locked or new.currency is distinct from old.currency
     or new.expense_date is distinct from old.expense_date or new.fx_rate_to_usd is null then
    select * into fx from public.finance_fx_lookup(new.currency, new.expense_date);
    new.fx_rate_to_usd := fx.usd_per_unit;
    new.fx_rate_date := fx.rate_date;
    new.fx_locked := coalesce(fx.locked, false);
  end if;
  new.amount_usd := public.finance_to_usd(new.amount, new.fx_rate_to_usd);
  new.updated_at := now();
  return new;
end $$;

create trigger expenses_finance_before_write before insert or update on public.expenses
  for each row execute function public.finance_expense_before_write();
create trigger expenses_finance_audit after insert or update or delete on public.expenses
  for each row execute function public.finance_audit_trigger('id');

-- Convert the existing rows (the trigger fills fx columns when rates exist).
update public.expenses set fx_locked = false;

revoke all on function public.finance_expense_before_write() from public, anon, authenticated;
