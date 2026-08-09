create or replace function public.normalize_admin_business_role() returns trigger language plpgsql set search_path='' as $$
begin
  if new.role='operator' then new.role='operations'; end if;
  return new;
end $$;
drop trigger if exists normalize_admin_business_role on public.admin_profiles;
create trigger normalize_admin_business_role before insert or update of role on public.admin_profiles for each row execute function public.normalize_admin_business_role();
revoke execute on function public.normalize_admin_business_role() from public,anon,authenticated;;
