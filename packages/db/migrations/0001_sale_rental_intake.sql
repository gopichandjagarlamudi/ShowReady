do $$
begin
  create type "intake_type" as enum ('sale', 'rental');
exception
  when duplicate_object then null;
end
$$;

alter table public.question_templates
add column if not exists "intake_type" "intake_type";

update public.question_templates
set intake_type = 'sale'
where intake_type is null;

alter table public.question_templates
alter column "intake_type" set not null;

create unique index if not exists "question_templates_agent_id_intake_type_unique"
on public.question_templates ("agent_id", "intake_type");

insert into public.question_templates (
  id,
  agent_id,
  intake_type,
  name,
  intro_headline,
  intro_body,
  custom_questions
)
select
  gen_random_uuid()::text,
  agents.id,
  'rental',
  'ShowReady Rental',
  'A quick step before your rental tour',
  'This takes about two minutes and helps your agent focus on rentals that fit your timing, budget, and application readiness.',
  '[]'::jsonb
from public.agents as agents
where not exists (
  select 1
  from public.question_templates as templates
  where templates.agent_id = agents.id
    and templates.intake_type = 'rental'
);

alter table public.leads
add column if not exists "intake_type" "intake_type" default 'sale';

update public.leads
set intake_type = 'sale'
where intake_type is null;

alter table public.leads
alter column "intake_type" set not null;
