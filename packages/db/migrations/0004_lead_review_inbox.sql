alter table "leads"
  add column "reviewed_stage" "lead_stage",
  add column "reviewed_at" timestamp with time zone;

update "leads"
set
  "reviewed_stage" = "pipeline_stage",
  "reviewed_at" = coalesce("submitted_at", "updated_at", "created_at")
where "pipeline_stage" <> 'new'
  and "reviewed_stage" is null;
