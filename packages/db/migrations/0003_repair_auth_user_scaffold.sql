create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sale_template_id text;
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'ShowReady Agent'
  );

  insert into public.agents (
    id,
    email,
    full_name
  )
  values (
    new.id,
    coalesce(new.email, concat(new.id::text, '@showready.local')),
    display_name
  )
  on conflict (id) do update
  set email = excluded.email;

  select id
  into sale_template_id
  from public.question_templates
  where agent_id = new.id
    and intake_type = 'sale'
  limit 1;

  if sale_template_id is null then
    sale_template_id := gen_random_uuid()::text;

    insert into public.question_templates (
      id,
      agent_id,
      intake_type,
      name,
      intro_headline,
      intro_body,
      custom_questions
    )
    values (
      sale_template_id,
      new.id,
      'sale',
      'ShowReady Standard',
      'A quick step before your first showing',
      'This takes about two minutes and helps your agent focus on homes that actually fit your timeline and budget.',
      '[]'::jsonb
    );
  end if;

  insert into public.question_templates (
    id,
    agent_id,
    intake_type,
    name,
    intro_headline,
    intro_body,
    custom_questions
  )
  values (
    gen_random_uuid()::text,
    new.id,
    'rental',
    'ShowReady Rental',
    'A quick step before your rental tour',
    'This takes about two minutes and helps your agent focus on rentals that fit your timing, budget, and application readiness.',
    '[]'::jsonb
  )
  on conflict ("agent_id", "intake_type") do nothing;

  insert into public.agent_settings (
    agent_id,
    brand_name,
    brand_color,
    accent_color,
    show_threshold,
    question_template_id,
    notification_preference
  )
  values (
    new.id,
    'ShowReady',
    '#0F766E',
    '#A16207',
    8.00,
    sale_template_id,
    'email'
  )
  on conflict (agent_id) do nothing;

  return new;
end;
$$;
