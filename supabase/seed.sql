-- Local-only synthetic seed marker. Integration tests create their own data in
-- transactions and clean it up; no production or customer data belongs here.
insert into public.site_settings (key, value, category, public, description, updated_by)
values (
  'local_test_seed',
  '{"synthetic":true}'::jsonb,
  'testing',
  false,
  'Synthetic marker proving the repository-local seed completed.',
  null
)
on conflict (key) do update
set value = excluded.value,
    category = excluded.category,
    public = excluded.public,
    description = excluded.description,
    updated_by = null;
