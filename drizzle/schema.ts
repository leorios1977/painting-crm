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
  index,
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
  tenantId: int("tenantId").default(1).notNull(),
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
  // Customer Portal
  portalToken: varchar("portalToken", { length: 64 }).unique(),
  portalPhotos: json("portalPhotos").$type<{ url: string; caption: string; type: "before" | "after" | "progress" }[]>(),
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
  /** Google Business review URL pasted by the owner */
  googleReviewLink: text("googleReviewLink"),
  /** When true, automatically send a review request SMS when a lead is moved to 'completed' */
  autoReviewEnabled: boolean("autoReviewEnabled").default(false).notNull(),
  // ─── White-label branding ───────────────────────────────────────────────────
  /** Business display name shown in sidebar and browser tab */
  businessName: varchar("businessName", { length: 200 }),
  /** S3/CDN URL of the uploaded business logo */
  logoUrl: text("logoUrl"),
  /** S3 key for the logo file (used for deletion) */
  logoKey: varchar("logoKey", { length: 500 }),
  /** Primary brand color as a hex string, e.g. '#1e40af' */
  primaryColor: varchar("primaryColor", { length: 20 }),
  /** Secondary brand color as a hex string */
  secondaryColor: varchar("secondaryColor", { length: 20 }),
  /** Stripe Publishable Key (pk_live_... or pk_test_...) stored in DB, overrides ENV */
  stripePublishableKey: text("stripePublishableKey"),
  // ─── Analytics ──────────────────────────────────────────────────────────────
  /** Google Analytics 4 Measurement ID, e.g. G-XXXXXXXXXX */
  googleAnalyticsId: varchar("googleAnalyticsId", { length: 50 }),
  // ─── Social Media ────────────────────────────────────────────────────────────
  /** Master toggle — show social media bar on website/portal */
  socialMediaEnabled: boolean("socialMediaEnabled").default(true).notNull(),
  facebookUrl: text("facebookUrl"),
  facebookEnabled: boolean("facebookEnabled").default(true).notNull(),
  instagramUrl: text("instagramUrl"),
  instagramEnabled: boolean("instagramEnabled").default(true).notNull(),
  whatsappNumber: varchar("whatsappNumber", { length: 30 }),
  whatsappEnabled: boolean("whatsappEnabled").default(true).notNull(),
  twitterUrl: text("twitterUrl"),
  twitterEnabled: boolean("twitterEnabled").default(true).notNull(),
  youtubeUrl: text("youtubeUrl"),
  youtubeEnabled: boolean("youtubeEnabled").default(true).notNull(),
  tiktokUrl: text("tiktokUrl"),
  tiktokEnabled: boolean("tiktokEnabled").default(true).notNull(),
  linkedinUrl: text("linkedinUrl"),
  linkedinEnabled: boolean("linkedinEnabled").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = typeof appSettings.$inferInsert;

// ─── SMS Conversations ────────────────────────────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").default(1).notNull(),
  leadId: int("leadId").notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  body: text("body").notNull(),
  fromNumber: varchar("fromNumber", { length: 30 }).notNull(),
  toNumber: varchar("toNumber", { length: 30 }).notNull(),
  /** Twilio message SID for deduplication and status tracking */
  twilioSid: varchar("twilioSid", { length: 64 }),
  /** Twilio delivery status: queued, sent, delivered, failed, received, etc. */
  status: varchar("status", { length: 30 }).default("queued").notNull(),
  /** Whether this message has been read by the user */
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ─── Appointments ───────────────────────────────────────────────────────────────────────────────
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").default(1).notNull(),
  /** Foreign key to leads.id */
  leadId: int("leadId").notNull(),
  /** Name(s) of crew member(s) assigned to this job */
  crewAssigned: varchar("crewAssigned", { length: 300 }),
  /** Type of job, e.g. Interior Paint, Exterior Paint, Deck Stain */
  jobType: varchar("jobType", { length: 200 }),
  /** Date of the appointment (stored as UTC timestamp) */
  scheduledDate: timestamp("scheduledDate").notNull(),
  /** Human-readable time slot, e.g. '8:00 AM – 12:00 PM' */
  timeSlot: varchar("timeSlot", { length: 100 }),
  /** Appointment status */
  status: mysqlEnum("status", [
    "scheduled",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
  ])
    .default("scheduled")
    .notNull(),
  /** Internal notes about this appointment */
  notes: text("notes"),
  /** Whether a confirmation SMS was sent to the customer */
  smsSent: boolean("smsSent").default(false).notNull(),
  /** Whether a confirmation email was sent to the customer */
  emailSent: boolean("emailSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// ─── Invoices ──────────────────────────────────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").default(1).notNull(),
  /** Foreign key to leads.id */
  leadId: int("leadId").notNull(),
  /** Human-readable invoice number, e.g. INV-0042 */
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull(),
  /**
   * JSON array of line items:
   * [{ description: string, quantity: number, unitPrice: number }]
   */
  lineItems: json("lineItems").notNull(),
  /** Subtotal before tax (sum of quantity * unitPrice) */
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  /** Tax amount in dollars */
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00").notNull(),
  /** Total = subtotal + tax */
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  /** Invoice lifecycle status */
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue"])
    .default("draft")
    .notNull(),
  /** Due date for payment */
  dueDate: timestamp("dueDate"),
  /** Timestamp when payment was confirmed */
  paidAt: timestamp("paidAt"),
  /** Stripe Payment Link URL sent to the customer */
  stripePaymentLink: text("stripePaymentLink"),
  /** Stripe Payment Link ID for webhook matching */
  stripePaymentLinkId: varchar("stripePaymentLinkId", { length: 100 }),
  /** Stripe Checkout Session ID (set when payment is initiated) */
  stripeSessionId: varchar("stripeSessionId", { length: 100 }),
  /** Internal notes */
  notes: text("notes"),
  /** Whether a payment link SMS was sent to the customer */
  smsSent: boolean("smsSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/** Typed line item stored in the lineItems JSON column */
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

// ─── Crew Members ────────────────────────────────────────────────────────────
export const crewMembers = mysqlTable("crew_members", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").default(1).notNull(),
  /** Full name of the crew member */
  name: varchar("name", { length: 200 }).notNull(),
  /** Contact phone number */
  phone: varchar("phone", { length: 30 }),
  /** Contact email */
  email: varchar("email", { length: 200 }),
  /** Job role, e.g. Lead Painter, Apprentice, Foreman */
  role: varchar("role", { length: 100 }),
  /** Active or inactive status */
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrewMember = typeof crewMembers.$inferSelect;
export type InsertCrewMember = typeof crewMembers.$inferInsert;

// ─── Job Photos ───────────────────────────────────────────────────────────────
export const jobPhotos = mysqlTable("job_photos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").default(1).notNull(),
  /** Foreign key to leads.id */
  leadId: int("leadId").notNull(),
  /** Public S3/CDN URL of the uploaded photo */
  photoUrl: text("photoUrl").notNull(),
  /** S3 object key for deletion */
  photoKey: varchar("photoKey", { length: 500 }).notNull(),
  /** Photo type: before the job or after the job */
  type: mysqlEnum("type", ["before", "after"]).notNull(),
  /** Optional caption or label */
  caption: varchar("caption", { length: 300 }),
  /** ID of the user who uploaded the photo */
  uploadedBy: int("uploadedBy"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type JobPhoto = typeof jobPhotos.$inferSelect;
export type InsertJobPhoto = typeof jobPhotos.$inferInsert;

// ─── Blog Posts ──────────────────────────────────────────────────────────────
export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").default(1).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 600 }).notNull().unique(),
  content: text("content"),
  excerpt: varchar("excerpt", { length: 500 }),
  seoTitle: varchar("seoTitle", { length: 200 }),
  seoKeywords: varchar("seoKeywords", { length: 500 }),
  seoDescription: varchar("seoDescription", { length: 200 }),
  featuredImageUrl: text("featuredImageUrl"),
  projectAddress: text("projectAddress"),
  projectLatitude: decimal("projectLatitude", { precision: 10, scale: 7 }),
  projectLongitude: decimal("projectLongitude", { precision: 10, scale: 7 }),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// ─── Blog Images ─────────────────────────────────────────────────────────────
export const blogImages = mysqlTable("blog_images", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  caption: varchar("caption", { length: 500 }),
  displayOrder: int("displayOrder").default(0).notNull(),
});
export type BlogImage = typeof blogImages.$inferSelect;
export type InsertBlogImage = typeof blogImages.$inferInsert;
