do $$
begin
  create type "invite_status" as enum ('generated', 'opened', 'converted', 'expired');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.invites (
  "id" uuid primary key default gen_random_uuid() not null,
  "agent_id" uuid not null references public.agents(id) on delete cascade,
  "token" text not null unique,
  "status" "invite_status" default 'generated' not null,
  "token_expires_at" timestamp with time zone not null,
  "draft_payload" jsonb not null default '{"contact":{"fullName":""}}'::jsonb,
  "lead_id" uuid references public.leads(id) on delete set null,
  "opened_at" timestamp with time zone,
  "converted_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create index if not exists "invites_agent_id_idx"
on public.invites ("agent_id");

create index if not exists "invites_agent_id_updated_at_idx"
on public.invites ("agent_id", "updated_at" desc);

drop trigger if exists set_invites_updated_at on public.invites;
create trigger set_invites_updated_at
before update on public.invites
for each row
execute function public.set_updated_at();

alter table public.invites enable row level security;
alter table public.invites force row level security;

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
