-- Finance phase 0: financial records are never hard-deleted, every money
-- change is audited, the audit log itself is immutable, partners gain the
-- fields needed for payouts, finance access is owner + accountant only, and the
-- legacy supplier_payments table is frozen in favour of supplier_ledger.
--
-- NO HARD DELETES: rows in the tables below are archived, voided, deactivated or
-- cancelled instead. A DBA who must remove a row for a legal reason (e.g. a
-- data-subject erasure request) can do so from a direct SQL session with
--   set local app.allow_financial_delete = 'on';
-- The API cannot set that, so it never deletes financial rows.

create function public.finance_block_delete() returns trigger
language plpgsql set search_path = '' as $$
begin
  if coalesce(current_setting('app.allow_financial_delete', true), '') = 'on' then
    return case when tg_level = 'ROW' then old end;
  end if;
  raise exception '% records are never deleted; archive, void or deactivate them instead.', tg_table_name
    using errcode = '55000';
end $$;
revoke all on function public.finance_block_delete() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'bookings', 'booking_assignments', 'booking_financials', 'booking_financial_lines', 'expenses', 'expense_invoices',
    'suppliers', 'sales_people', 'supplier_prices', 'supplier_payments', 'fx_rates'
  ] loop
    execute format('create trigger %I before delete on public.%I for each row execute function public.finance_block_delete()', t || '_no_delete', t);
    execute format('create trigger %I before truncate on public.%I for each statement execute function public.finance_block_delete()', t || '_no_truncate', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- The audit log is append-only.
-- ---------------------------------------------------------------------------
create function public.admin_audit_log_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'admin_audit_log is append-only.' using errcode = '55000';
end $$;
revoke all on function public.admin_audit_log_append_only() from public, anon, authenticated;
create trigger admin_audit_log_no_change before update or delete on public.admin_audit_log
  for each row execute function public.admin_audit_log_append_only();
create trigger admin_audit_log_no_truncate before truncate on public.admin_audit_log
  for each statement execute function public.admin_audit_log_append_only();
revoke update, delete, truncate on public.admin_audit_log from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Audit: partner, cost and receipt tables use the generic finance trigger.
-- Bookings are audited only when a money-relevant field changes, and only
-- those fields are logged (the full row carries guest contact details).
-- ---------------------------------------------------------------------------
create trigger suppliers_finance_audit after insert or update or delete on public.suppliers
  for each row execute function public.finance_audit_trigger('id');
create trigger sales_people_finance_audit after insert or update or delete on public.sales_people
  for each row execute function public.finance_audit_trigger('id');
create trigger supplier_prices_finance_audit after insert or update or delete on public.supplier_prices
  for each row execute function public.finance_audit_trigger('id');
create trigger booking_assignments_finance_audit after insert or update or delete on public.booking_assignments
  for each row execute function public.finance_audit_trigger('id');
create trigger expense_invoices_finance_audit after insert or update or delete on public.expense_invoices
  for each row execute function public.finance_audit_trigger('id');

create function public.finance_booking_money_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  before_row jsonb := case when tg_op = 'UPDATE' then jsonb_build_object(
    'reference', old.reference, 'amount', old.amount, 'currency', old.currency, 'subtotal', old.subtotal,
    'discount_amount', old.discount_amount, 'status', old.status, 'payment_status', old.payment_status,
    'archived_at', old.archived_at, 'sales_person_id', old.sales_person_id,
    'sales_commission_percent', old.sales_commission_percent) end;
  after_row jsonb := jsonb_build_object(
    'reference', new.reference, 'amount', new.amount, 'currency', new.currency, 'subtotal', new.subtotal,
    'discount_amount', new.discount_amount, 'status', new.status, 'payment_status', new.payment_status,
    'archived_at', new.archived_at, 'sales_person_id', new.sales_person_id,
    'sales_commission_percent', new.sales_commission_percent);
begin
  if tg_op = 'UPDATE' and before_row = after_row then return null; end if;
  insert into public.admin_audit_log (actor_id, actor_email, action, resource_type, resource_id, summary, before_data, after_data)
  values (
    auth.uid(),
    coalesce(nullif(lower(coalesce(auth.jwt() ->> 'email', '')), ''), 'system'),
    lower(tg_op),
    'bookings',
    new.id::text,
    format('Booking %s money fields %s', new.reference, case when tg_op = 'INSERT' then 'created' else 'changed' end),
    before_row,
    after_row
  );
  return null;
end $$;
revoke all on function public.finance_booking_money_audit() from public, anon, authenticated;
create trigger bookings_money_audit after insert or update on public.bookings
  for each row execute function public.finance_booking_money_audit();

-- ---------------------------------------------------------------------------
-- Partners (the suppliers table): hotel / company types, WhatsApp and how
-- they are paid. Sales people can be deactivated instead of deleted.
-- ---------------------------------------------------------------------------
alter table public.suppliers drop constraint if exists suppliers_type_check;
alter table public.suppliers add constraint suppliers_type_check
  check (type in ('boat', 'driver', 'guide', 'hotel', 'company', 'other'));

alter table public.suppliers
  add column whatsapp text check (whatsapp is null or length(whatsapp) <= 40),
  add column payment_method text check (payment_method is null
    or payment_method in ('cash', 'bank_transfer', 'instapay', 'vodafone_cash', 'other')),
  add column payment_details text check (payment_details is null or length(payment_details) <= 500);

alter table public.sales_people add column active boolean not null default true;

-- ---------------------------------------------------------------------------
-- Finance access: owner (always) and the accountant ("finance" role) only.
-- The owner can still change this in the permissions matrix.
-- ---------------------------------------------------------------------------
update public.admin_role_permissions set allowed = false, updated_at = now()
where role <> 'finance' and role <> 'owner'
  and permission in ('view_finance', 'manage_finance', 'view_expenses', 'edit_expenses')
  and allowed;

-- ---------------------------------------------------------------------------
-- supplier_payments is superseded by supplier_ledger (payments, settlements
-- and balances). Existing rows stay readable for reference; nothing new is
-- written to it.
-- ---------------------------------------------------------------------------
create function public.supplier_payments_frozen() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'supplier_payments is retired; record partner payments in the supplier ledger.' using errcode = '55000';
end $$;
revoke all on function public.supplier_payments_frozen() from public, anon, authenticated;
create trigger supplier_payments_frozen before insert or update on public.supplier_payments
  for each row execute function public.supplier_payments_frozen();
comment on table public.supplier_payments is 'Retired 2026-09-29: read-only history. Partner payments live in supplier_ledger.';
