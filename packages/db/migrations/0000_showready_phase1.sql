create extension if not exists pgcrypto;

create type "lead_status" as enum ('pending', 'submitted', 'archived');
create type "lead_stage" as enum (
  'new',
  'ready_to_show',
  'appointment_booked',
  'nurture',
  'hold',
  'closed_won',
  'closed_lost',
  'archived'
);
create type "recommendation" as enum ('show', 'nurture', 'hold');
create type "notification_preference" as enum ('email', 'email_and_push');
create type "intake_type" as enum ('sale', 'rental');
create type "invite_status" as enum ('generated', 'opened', 'converted', 'expired');

create table "agents" (
  "id" uuid primary key not null references auth.users(id) on delete cascade,
  "email" text not null,
  "full_name" text not null,
  "brokerage" text,
  "license_number" text,
  "photo_url" text,
  "logo_url" text,
  "onboarded_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  constraint "agents_email_unique" unique("email")
);

create table "question_templates" (
  "id" text primary key not null,
  "agent_id" uuid not null references public.agents(id) on delete cascade,
  "intake_type" "intake_type" not null,
  "name" text not null,
  "intro_headline" text not null,
  "intro_body" text not null,
  "custom_questions" jsonb not null
);

create table "agent_settings" (
  "id" uuid primary key default gen_random_uuid() not null,
  "agent_id" uuid not null references public.agents(id) on delete cascade,
  "brand_name" text not null,
  "brand_color" text not null,
  "accent_color" text not null,
  "show_threshold" numeric(4, 2) not null,
  "question_template_id" text not null references public.question_templates(id) on delete cascade,
  "notification_preference" "notification_preference" not null,
  constraint "agent_settings_agent_id_unique" unique("agent_id")
);

create table "leads" (
  "id" uuid primary key default gen_random_uuid() not null,
  "agent_id" uuid not null references public.agents(id) on delete cascade,
  "buyer_name" text not null,
  "buyer_phone" text,
  "buyer_email" text,
  "intake_type" "intake_type" default 'sale' not null,
  "token" text not null,
  "token_expires_at" timestamp with time zone not null,
  "status" "lead_status" default 'pending' not null,
  "pipeline_stage" "lead_stage" default 'new' not null,
  "score" numeric(4, 2),
  "recommendation" "recommendation",
  "summary" text,
  "submitted_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  constraint "leads_token_unique" unique("token")
);

create table "invites" (
  "id" uuid primary key default gen_random_uuid() not null,
  "agent_id" uuid not null references public.agents(id) on delete cascade,
  "token" text not null,
  "status" "invite_status" default 'generated' not null,
  "token_expires_at" timestamp with time zone not null,
  "draft_payload" jsonb not null,
  "lead_id" uuid references public.leads(id) on delete set null,
  "opened_at" timestamp with time zone,
  "converted_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  constraint "invites_token_unique" unique("token")
);

create table "lead_answers" (
  "id" uuid primary key default gen_random_uuid() not null,
  "lead_id" uuid not null references public.leads(id) on delete cascade,
  "question_key" text not null,
  "answer_value" jsonb not null,
  "scored" boolean default true not null,
  "updated_at" timestamp with time zone default now() not null
);

create table "lead_scores" (
  "id" uuid primary key default gen_random_uuid() not null,
  "lead_id" uuid not null references public.leads(id) on delete cascade,
  "total" numeric(4, 2) not null,
  "recommendation" "recommendation" not null,
  "summary" text not null,
  "breakdown" jsonb not null,
  "overridden" boolean default false not null,
  "override_meta" jsonb,
  "created_at" timestamp with time zone default now() not null
);

create index "question_templates_agent_id_idx" on "question_templates" ("agent_id");
create unique index "question_templates_agent_id_intake_type_unique" on "question_templates" ("agent_id", "intake_type");
create index "agent_settings_agent_id_idx" on "agent_settings" ("agent_id");
create index "agent_settings_question_template_id_idx" on "agent_settings" ("question_template_id");
create index "leads_agent_id_idx" on "leads" ("agent_id");
create index "leads_agent_id_updated_at_idx" on "leads" ("agent_id", "updated_at" desc);
create index "leads_agent_id_pipeline_stage_updated_at_idx" on "leads" ("agent_id", "pipeline_stage", "updated_at" desc);
create index "invites_agent_id_idx" on "invites" ("agent_id");
create index "invites_agent_id_updated_at_idx" on "invites" ("agent_id", "updated_at" desc);
create index "lead_answers_lead_id_idx" on "lead_answers" ("lead_id");
create unique index "lead_answers_lead_id_question_key_idx" on "lead_answers" ("lead_id", "question_key");
create index "lead_scores_lead_id_idx" on "lead_scores" ("lead_id");

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_leads_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

create trigger set_invites_updated_at
before update on public.invites
for each row
execute function public.set_updated_at();

create trigger set_lead_answers_updated_at
before update on public.lead_answers
for each row
execute function public.set_updated_at();

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

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.agents enable row level security;
alter table public.agents force row level security;
alter table public.question_templates enable row level security;
alter table public.question_templates force row level security;
alter table public.agent_settings enable row level security;
alter table public.agent_settings force row level security;
alter table public.leads enable row level security;
alter table public.leads force row level security;
alter table public.invites enable row level security;
alter table public.invites force row level security;
alter table public.lead_answers enable row level security;
alter table public.lead_answers force row level security;
alter table public.lead_scores enable row level security;
alter table public.lead_scores force row level security;

create policy "agents_select_own"
on public.agents
for select
using ((select auth.uid()) = id);

create policy "agents_insert_own"
on public.agents
for insert
with check ((select auth.uid()) = id);

create policy "agents_update_own"
on public.agents
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "agent_settings_select_own"
on public.agent_settings
for select
using ((select auth.uid()) = agent_id);

create policy "agent_settings_insert_own"
on public.agent_settings
for insert
with check ((select auth.uid()) = agent_id);

create policy "agent_settings_update_own"
on public.agent_settings
for update
using ((select auth.uid()) = agent_id)
with check ((select auth.uid()) = agent_id);

create policy "agent_settings_delete_own"
on public.agent_settings
for delete
using ((select auth.uid()) = agent_id);

create policy "question_templates_select_own"
on public.question_templates
for select
using ((select auth.uid()) = agent_id);

create policy "question_templates_insert_own"
on public.question_templates
for insert
with check ((select auth.uid()) = agent_id);

create policy "question_templates_update_own"
on public.question_templates
for update
using ((select auth.uid()) = agent_id)
with check ((select auth.uid()) = agent_id);

create policy "question_templates_delete_own"
on public.question_templates
for delete
using ((select auth.uid()) = agent_id);

create policy "leads_select_own"
on public.leads
for select
using ((select auth.uid()) = agent_id);

create policy "leads_insert_own"
on public.leads
for insert
with check ((select auth.uid()) = agent_id);

create policy "leads_update_own"
on public.leads
for update
using ((select auth.uid()) = agent_id)
with check ((select auth.uid()) = agent_id);

create policy "invites_select_own"
on public.invites
for select
using ((select auth.uid()) = agent_id);

create policy "invites_insert_own"
on public.invites
for insert
with check ((select auth.uid()) = agent_id);

create policy "invites_update_own"
on public.invites
for update
using ((select auth.uid()) = agent_id)
with check ((select auth.uid()) = agent_id);

create policy "invites_delete_own"
on public.invites
for delete
using ((select auth.uid()) = agent_id);

create policy "leads_delete_own"
on public.leads
for delete
using ((select auth.uid()) = agent_id);

create policy "lead_answers_select_own"
on public.lead_answers
for select
using (
  exists (
    select 1
    from public.leads
    where leads.id = lead_answers.lead_id
      and leads.agent_id = (select auth.uid())
  )
);

create policy "lead_answers_insert_own"
on public.lead_answers
for insert
with check (
  exists (
    select 1
    from public.leads
    where leads.id = lead_answers.lead_id
      and leads.agent_id = (select auth.uid())
  )
);

create policy "lead_answers_update_own"
on public.lead_answers
for update
using (
  exists (
    select 1
    from public.leads
    where leads.id = lead_answers.lead_id
      and leads.agent_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.leads
    where leads.id = lead_answers.lead_id
      and leads.agent_id = (select auth.uid())
  )
);

create policy "lead_answers_delete_own"
on public.lead_answers
for delete
using (
  exists (
    select 1
    from public.leads
    where leads.id = lead_answers.lead_id
      and leads.agent_id = (select auth.uid())
  )
);

create policy "lead_scores_select_own"
on public.lead_scores
for select
using (
  exists (
    select 1
    from public.leads
    where leads.id = lead_scores.lead_id
      and leads.agent_id = (select auth.uid())
  )
);

create policy "lead_scores_insert_own"
on public.lead_scores
for insert
with check (
  exists (
    select 1
    from public.leads
    where leads.id = lead_scores.lead_id
      and leads.agent_id = (select auth.uid())
  )
);

create policy "lead_scores_update_own"
on public.lead_scores
for update
using (
  exists (
    select 1
    from public.leads
    where leads.id = lead_scores.lead_id
      and leads.agent_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.leads
    where leads.id = lead_scores.lead_id
      and leads.agent_id = (select auth.uid())
  )
);

create policy "lead_scores_delete_own"
on public.lead_scores
for delete
using (
  exists (
    select 1
    from public.leads
    where leads.id = lead_scores.lead_id
      and leads.agent_id = (select auth.uid())
  )
);
