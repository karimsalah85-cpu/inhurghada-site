alter table public.admin_profiles drop constraint if exists admin_profiles_role_check;
update public.admin_profiles set role='operations' where role='operator';
alter table public.admin_profiles add constraint admin_profiles_role_check check (role in ('owner','manager','sales','finance','operations','content_editor'));

create table if not exists public.admin_role_permissions (
  role text not null check (role in ('owner','manager','sales','finance','operations','content_editor')),
  permission text not null check (permission in ('view_bookings','edit_bookings','view_expenses','edit_expenses','view_suppliers','edit_suppliers','view_analytics','view_reports','manage_operations','manage_content','manage_settings','manage_users')),
  allowed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(role,permission)
);
alter table public.admin_role_permissions enable row level security;

insert into public.admin_role_permissions(role,permission,allowed)
select role,permission, role='owner' or role='manager' or
  (role='sales' and permission in ('view_bookings','edit_bookings','view_reports')) or
  (role='finance' and permission in ('view_bookings','view_expenses','edit_expenses','view_suppliers','edit_suppliers','view_analytics','view_reports')) or
  (role='operations' and permission in ('view_bookings','edit_bookings','view_suppliers','edit_suppliers','manage_operations')) or
  (role='content_editor' and permission='manage_content')
from unnest(array['owner','manager','sales','finance','operations','content_editor']) role
cross join unnest(array['view_bookings','edit_bookings','view_expenses','edit_expenses','view_suppliers','edit_suppliers','view_analytics','view_reports','manage_operations','manage_content','manage_settings','manage_users']) permission
on conflict(role,permission) do nothing;

create or replace function public.admin_has_permission(permission_name text)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.admin_profiles p
    where p.id=auth.uid() and p.active and (
      p.role='owner' or exists(select 1 from public.admin_role_permissions rp where rp.role=p.role and rp.permission=(case permission_name
        when 'bookings' then 'edit_bookings' when 'reports' then 'view_reports' when 'finance' then 'edit_expenses'
        when 'suppliers' then 'edit_suppliers' when 'operations' then 'manage_operations' when 'content' then 'manage_content'
        when 'settings' then 'manage_settings' when 'staff' then 'manage_users' else permission_name end) and rp.allowed)
    )
  ) or lower(coalesce(auth.jwt()->>'email',''))='info@dailyredsea.com';
$$;
revoke all on function public.admin_has_permission(text) from public,anon;
grant execute on function public.admin_has_permission(text) to authenticated;

drop policy if exists "Authenticated staff reads role permissions" on public.admin_role_permissions;
create policy "Authenticated staff reads role permissions" on public.admin_role_permissions for select to authenticated using (public.is_daily_red_sea_admin());
drop policy if exists "Owner manages role permissions" on public.admin_role_permissions;
create policy "Owner manages role permissions" on public.admin_role_permissions for all to authenticated using (public.admin_has_permission('manage_users')) with check (public.admin_has_permission('manage_users'));

grant select,insert,update on public.admin_role_permissions to authenticated;
