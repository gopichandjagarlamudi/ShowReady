begin;

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'lead_stage'
      and e.enumlabel = 'ready'
  ) and not exists (
    select 1
    from pg_type
    where typname = 'lead_stage_old'
  ) then
    execute 'alter type "lead_stage" rename to "lead_stage_old"';
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'lead_stage'
  ) then
    execute $sql$
      create type "lead_stage" as enum (
        'new',
        'ready_to_show',
        'appointment_booked',
        'nurture',
        'hold',
        'closed_won',
        'closed_lost',
        'archived'
      )
    $sql$;
  end if;
end
$$;

alter table "leads"
  alter column "pipeline_stage" drop default,
  alter column "pipeline_stage" type text using "pipeline_stage"::text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'reviewed_stage'
  ) then
    execute 'alter table "leads" alter column "reviewed_stage" type text using "reviewed_stage"::text';
  end if;
end
$$;

update public.leads
set "pipeline_stage" = case "pipeline_stage"
  when 'ready' then 'ready_to_show'
  when 'closed' then 'archived'
  else "pipeline_stage"
end;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'reviewed_stage'
  ) then
    execute $sql$
      update public.leads
      set "reviewed_stage" = case "reviewed_stage"
        when 'ready' then 'ready_to_show'
        when 'closed' then 'archived'
        else "reviewed_stage"
      end
    $sql$;
  end if;
end
$$;

alter table "leads"
  alter column "pipeline_stage" type "lead_stage" using "pipeline_stage"::"lead_stage",
  alter column "pipeline_stage" set default 'new';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'reviewed_stage'
  ) then
    execute 'alter table "leads" alter column "reviewed_stage" type "lead_stage" using "reviewed_stage"::"lead_stage"';
  end if;
end
$$;

alter table "leads"
  add column if not exists "reviewed_stage" "lead_stage",
  add column if not exists "reviewed_at" timestamp with time zone;

update "leads"
set
  "reviewed_stage" = "pipeline_stage",
  "reviewed_at" = coalesce("submitted_at", "updated_at", "created_at")
where "pipeline_stage" <> 'new'
  and "reviewed_stage" is null;

drop type if exists "lead_stage_old";

create table if not exists "appointments" (
  "id" uuid primary key default gen_random_uuid() not null,
  "lead_id" uuid not null references public.leads(id) on delete cascade,
  "date" date not null,
  "start_time" time not null,
  "status" text default 'scheduled' not null,
  "notes" text,
  "created_at" timestamp with time zone default now() not null,
  constraint "appointments_status_check" check ("status" in ('scheduled', 'completed', 'cancelled'))
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_status_check'
  ) then
    alter table public.appointments
      add constraint "appointments_status_check"
      check ("status" in ('scheduled', 'completed', 'cancelled'));
  end if;
end
$$;

create table if not exists "showings" (
  "id" uuid primary key default gen_random_uuid() not null,
  "appointment_id" uuid not null references public.appointments(id) on delete cascade,
  "address" text not null,
  "order_index" integer not null,
  "notes" text
);

create index if not exists "appointments_lead_id_idx" on "appointments" ("lead_id");
create index if not exists "appointments_date_start_time_idx" on "appointments" ("date", "start_time");
create unique index if not exists "appointments_lead_id_scheduled_unique"
  on "appointments" ("lead_id")
  where "status" = 'scheduled';

create index if not exists "showings_appointment_id_idx" on "showings" ("appointment_id");
create unique index if not exists "showings_appointment_id_order_index_unique"
  on "showings" ("appointment_id", "order_index");

commit;
