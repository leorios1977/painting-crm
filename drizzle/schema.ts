import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users (Auth) ────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Leads ───────────────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  // Contact info
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  // Project info
  projectType: varchar("projectType", { length: 100 }),
  projectAddress: text("projectAddress"),
  projectDescription: text("projectDescription"),
  estimatedValue: decimal("estimatedValue", { precision: 10, scale: 2 }),
  // Pipeline
  stage: mysqlEnum("stage", [
    "lead",
    "quoted",
    "scheduled",
    "in_progress",
    "completed",
    "paid",
  ])
    .default("lead")
    .notNull(),
  // Metadata
  source: varchar("source", { length: 100 }),
  assignedTo: int("assignedTo"),
  lastContactedAt: timestamp("lastContactedAt"),
  scheduledDate: timestamp("scheduledDate"),
  completedDate: timestamp("completedDate"),
  // Stripe
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 100 }),
  stripePaymentLinkUrl: text("stripePaymentLinkUrl"),
  paidAt: timestamp("paidAt"),
  // Google Calendar
  calendarEventId: varchar("calendarEventId", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Email Templates ─────────────────────────────────────────────────────────
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  // Trigger info
  triggerStage: mysqlEnum("triggerStage", [
    "lead",
    "quoted",
    "scheduled",
    "in_progress",
    "completed",
    "paid",
    "manual",
  ]).default("manual"),
  isActive: boolean("isActive").default(true).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

// ─── Automation Rules ─────────────────────────────────────────────────────────
export const automationRules = mysqlTable("automation_rules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  triggerType: mysqlEnum("triggerType", [
    "stage_change",
    "scheduled",
    "manual",
    "days_after_stage",
  ]).notNull(),
  triggerStage: mysqlEnum("triggerStage", [
    "lead",
    "quoted",
    "scheduled",
    "in_progress",
    "completed",
    "paid",
  ]),
  delayHours: int("delayHours").default(0),
  templateId: int("templateId").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = typeof automationRules.$inferInsert;

// ─── Communication Log ────────────────────────────────────────────────────────
export const communicationLog = mysqlTable("communication_log", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  type: mysqlEnum("type", ["email", "call", "note", "sms", "system"]).notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound", "internal"]).default(
    "outbound"
  ),
  subject: varchar("subject", { length: 500 }),
  content: text("content").notNull(),
  templateId: int("templateId"),
  automationRuleId: int("automationRuleId"),
  sentBy: int("sentBy"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunicationLog = typeof communicationLog.$inferSelect;
export type InsertCommunicationLog = typeof communicationLog.$inferInsert;

// ─── Attachments ──────────────────────────────────────────────────────────────
export const attachments = mysqlTable("attachments", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  fileName: varchar("fileName", { length: 300 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

// ─── App Settings ─────────────────────────────────────────────────────────────
export const appSettings = mysqlTable("app_settings", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 200 }),
  companyEmail: varchar("companyEmail", { length: 320 }),
  reviewLink: text("reviewLink"),
  stripeSecretKey: text("stripeSecretKey"),
  googleCalendarId: varchar("googleCalendarId", { length: 300 }),
  googleServiceAccountKey: text("googleServiceAccountKey"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = typeof appSettings.$inferInsert;
