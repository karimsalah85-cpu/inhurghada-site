-- Internal operational analytics: authoritative persisted events, not browser button clicks.
-- Remains service-only; no customer contacts are exposed or sent to an external vendor.
create view public.referral_analytics_events with (security_invoker = true) as
 select id::text||':earned' as event_id,'referral_reward_earned'::text as event_name,booking_id,created_at,reward_units from public.referral_reward_transactions where type='EARN'
 union all select id::text||':qualified','referral_qualified',booking_id,created_at,reward_units from public.referral_reward_transactions where type='EARN'
 union all select id::text||':redeemed','referral_reward_redeemed',booking_id,created_at,-reward_units from public.referral_reward_transactions where type='REDEEM'
 union all select id::text||':attempt',case outcome when 'rejected' then 'referral_rejected' when 'pending_review' then 'referral_pending_review' else 'referral_rejected' end,booking_id,created_at,0 from public.referral_attempts where outcome in ('rejected','pending_review')
 union all select id::text||':created','referred_booking_created',referred_booking_id,created_at,0 from public.referrals;
revoke all on public.referral_analytics_events from public,anon,authenticated;
grant select on public.referral_analytics_events to service_role;
