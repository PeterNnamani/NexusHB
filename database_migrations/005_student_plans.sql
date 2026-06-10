-- Student subscription plans (separate from tutor/teaching plans)
insert into public.subscription_plans (slug, name, description, price, feature_flags, role_upgrade, sort_order)
values
  (
    'learner_plus',
    'Learner Plus',
    'Join live classes, certificates, and offline downloads.',
    4500,
    '{"live_classroom":false,"live_classroom_join":true,"max_courses":0,"premium_analytics":false,"agency_dashboard":false,"priority_support":true,"certificates":true,"offline_downloads":true}'::jsonb,
    null,
    0
  ),
  (
    'learner_pro',
    'Learner Pro',
    'Premium learning with mentor support and advanced analytics.',
    8500,
    '{"live_classroom":false,"live_classroom_join":true,"max_courses":0,"premium_analytics":true,"agency_dashboard":false,"priority_support":true,"certificates":true,"offline_downloads":true}'::jsonb,
    null,
    0
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  feature_flags = excluded.feature_flags,
  role_upgrade = excluded.role_upgrade,
  sort_order = excluded.sort_order,
  active = true;
