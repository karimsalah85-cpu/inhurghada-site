-- Supabase no longer exposes new public-schema tables to the Data API by
-- default. RLS still provides row-level authorization; these grants only make
-- the admin control-center tables visible to signed-in users.

do $$
begin
  grant select on table public.admin_profiles to authenticated;
  grant select on table public.admin_audit_log to authenticated;
  grant select on table public.system_health_checks to authenticated;

  grant select, insert, update, delete on table
    public.content_items,
    public.tour_availability,
    public.staff_members,
    public.booking_assignments,
    public.customer_notes,
    public.communication_templates,
    public.communication_queue,
    public.site_settings,
    public.redirect_rules
  to authenticated;
end
$$;
