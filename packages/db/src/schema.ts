import {
  boolean,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const leadStatusEnum = pgEnum("lead_status", [
  "pending",
  "submitted",
  "archived"
]);

export const leadStageEnum = pgEnum("lead_stage", [
  "new",
  "ready",
  "nurture",
  "hold",
  "closed"
]);

export const recommendationEnum = pgEnum("recommendation", [
  "show",
  "nurture",
  "hold"
]);

export const notificationPreferenceEnum = pgEnum("notification_preference", [
  "email",
  "email_and_push"
]);

export const intakeTypeEnum = pgEnum("intake_type", ["sale", "rental"]);
export const inviteStatusEnum = pgEnum("invite_status", [
  "generated",
  "opened",
  "converted",
  "expired"
]);

const auth = pgSchema("auth");

export const authUsers = auth.table("users", {
  id: uuid("id").primaryKey()
});

export const agents = pgTable("agents", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, {
      onDelete: "cascade"
    }),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  brokerage: text("brokerage"),
  licenseNumber: text("license_number"),
  photoUrl: text("photo_url"),
  logoUrl: text("logo_url"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const questionTemplates = pgTable(
  "question_templates",
  {
    id: text("id").primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, {
        onDelete: "cascade"
      }),
    intakeType: intakeTypeEnum("intake_type").notNull(),
    name: text("name").notNull(),
    introHeadline: text("intro_headline").notNull(),
    introBody: text("intro_body").notNull(),
    customQuestions: jsonb("custom_questions").notNull()
  },
  (table) => ({
    agentIdIdx: index("question_templates_agent_id_idx").on(table.agentId),
    agentTypeUnique: uniqueIndex("question_templates_agent_id_intake_type_unique").on(
      table.agentId,
      table.intakeType
    )
  })
);

export const agentSettings = pgTable(
  "agent_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, {
        onDelete: "cascade"
      }),
    brandName: text("brand_name").notNull(),
    brandColor: text("brand_color").notNull(),
    accentColor: text("accent_color").notNull(),
    showThreshold: numeric("show_threshold", {
      precision: 4,
      scale: 2,
      mode: "number"
    }).notNull(),
    questionTemplateId: text("question_template_id")
      .notNull()
      .references(() => questionTemplates.id, {
        onDelete: "cascade"
      }),
    notificationPreference: notificationPreferenceEnum("notification_preference")
      .notNull()
  },
  (table) => ({
    agentIdIdx: index("agent_settings_agent_id_idx").on(table.agentId),
    questionTemplateIdIdx: index("agent_settings_question_template_id_idx").on(
      table.questionTemplateId
    ),
    agentIdUnique: uniqueIndex("agent_settings_agent_id_unique").on(table.agentId)
  })
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, {
        onDelete: "cascade"
      }),
    buyerName: text("buyer_name").notNull(),
    buyerPhone: text("buyer_phone"),
    buyerEmail: text("buyer_email"),
    intakeType: intakeTypeEnum("intake_type").default("sale").notNull(),
    token: text("token").notNull().unique(),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }).notNull(),
    status: leadStatusEnum("status").default("pending").notNull(),
    pipelineStage: leadStageEnum("pipeline_stage").default("new").notNull(),
    score: numeric("score", {
      precision: 4,
      scale: 2,
      mode: "number"
    }),
    recommendation: recommendationEnum("recommendation"),
    reviewedStage: leadStageEnum("reviewed_stage"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    summary: text("summary"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    agentIdIdx: index("leads_agent_id_idx").on(table.agentId),
    agentUpdatedIdx: index("leads_agent_id_updated_at_idx").on(
      table.agentId,
      table.updatedAt
    ),
    agentStageUpdatedIdx: index("leads_agent_id_pipeline_stage_updated_at_idx").on(
      table.agentId,
      table.pipelineStage,
      table.updatedAt
    )
  })
);

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, {
        onDelete: "cascade"
      }),
    token: text("token").notNull().unique(),
    status: inviteStatusEnum("status").default("generated").notNull(),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }).notNull(),
    draftPayload: jsonb("draft_payload").notNull(),
    leadId: uuid("lead_id").references(() => leads.id, {
      onDelete: "set null"
    }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    agentIdIdx: index("invites_agent_id_idx").on(table.agentId),
    agentUpdatedIdx: index("invites_agent_id_updated_at_idx").on(
      table.agentId,
      table.updatedAt
    )
  })
);

export const leadAnswers = pgTable(
  "lead_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, {
        onDelete: "cascade"
      }),
    questionKey: text("question_key").notNull(),
    answerValue: jsonb("answer_value").notNull(),
    scored: boolean("scored").default(true).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    leadIdIdx: index("lead_answers_lead_id_idx").on(table.leadId),
    leadQuestionUnique: uniqueIndex("lead_answers_lead_id_question_key_idx").on(
      table.leadId,
      table.questionKey
    )
  })
);

export const leadScores = pgTable(
  "lead_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, {
        onDelete: "cascade"
      }),
    total: numeric("total", {
      precision: 4,
      scale: 2,
      mode: "number"
    }).notNull(),
    recommendation: recommendationEnum("recommendation").notNull(),
    summary: text("summary").notNull(),
    breakdown: jsonb("breakdown").notNull(),
    overridden: boolean("overridden").default(false).notNull(),
    overrideMeta: jsonb("override_meta"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    leadIdIdx: index("lead_scores_lead_id_idx").on(table.leadId)
  })
);
