-- Painting CRM - PostgreSQL Schema
-- Generated from Drizzle schema.ts
-- Compatible with PostgreSQL and Supabase

-- ─── Users (Auth) ────────────────────────────────────────────────────────────
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  "name" TEXT,
  "email" VARCHAR(320),
  "loginMethod" VARCHAR(64),
  "role" VARCHAR(10) NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Leads ───────────────────────────────────────────────────────────────────
CREATE TABLE "leads" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL DEFAULT 1,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  "email" VARCHAR(320),
  "phone" VARCHAR(30),
  "projectType" VARCHAR(100),
  "projectAddress" TEXT,
  "projectDescription" TEXT,
  "estimatedValue" NUMERIC(10, 2),
  "stage" VARCHAR(20) NOT NULL DEFAULT 'lead',
  "source" VARCHAR(100),
  "assignedTo" INTEGER,
  "lastContactedAt" TIMESTAMP,
  "scheduledDate" TIMESTAMP,
  "completedDate" TIMESTAMP,
  "stripeCustomerId" VARCHAR(100),
  "stripeInvoiceId" VARCHAR(100),
  "stripePaymentLinkUrl" TEXT,
  "paidAt" TIMESTAMP,
  "calendarEventId" VARCHAR(200),
  "portalToken" VARCHAR(64) UNIQUE,
  "portalPhotos" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" INTEGER
);

-- ─── Email Templates ─────────────────────────────────────────────────────────
CREATE TABLE "email_templates" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL DEFAULT 1,
  "name" VARCHAR(200) NOT NULL,
  "subject" VARCHAR(500) NOT NULL,
  "body" TEXT NOT NULL,
  "triggerStage" VARCHAR(20) DEFAULT 'manual',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "email_templates_tenantId_idx" ON "email_templates" ("tenantId");

-- ─── Automation Rules ─────────────────────────────────────────────────────────
CREATE TABLE "automation_rules" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL DEFAULT 1,
  "name" VARCHAR(200) NOT NULL,
  "triggerType" VARCHAR(30) NOT NULL,
  "triggerStage" VARCHAR(20),
  "delayHours" INTEGER DEFAULT 0,
  "templateId" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "automation_rules_tenantId_idx" ON "automation_rules" ("tenantId");

-- ─── Communication Log ────────────────────────────────────────────────────────
CREATE TABLE "communication_log" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL DEFAULT 1,
  "leadId" INTEGER NOT NULL,
  "type" VARCHAR(20) NOT NULL,
  "direction" VARCHAR(20) DEFAULT 'outbound',
  "subject" VARCHAR(500),
  "content" TEXT NOT NULL,
  "templateId" INTEGER,
  "automationRuleId" INTEGER,
  "sentBy" INTEGER,
  "sentAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "communication_log_tenantId_idx" ON "communication_log" ("tenantId");

-- ─── Attachments ──────────────────────────────────────────────────────────────
CREATE TABLE "attachments" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL DEFAULT 1,
  "leadId" INTEGER NOT NULL,
  "fileName" VARCHAR(300) NOT NULL,
  "fileKey" VARCHAR(500) NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "mimeType" VARCHAR(100),
  "fileSize" INTEGER,
  "uploadedBy" INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "attachments_tenantId_idx" ON "attachments" ("tenantId");

-- ─── App Settings ──────────────────────────────────────────────────────────────
CREATE TABLE "app_settings" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL DEFAULT 1,
  "companyName" VARCHAR(200),
  "companyEmail" VARCHAR(320),
  "reviewLink" TEXT,
  "stripeSecretKey" TEXT,
  "googleCalendarId" VARCHAR(300),
  "googleServiceAccountKey" TEXT,
  "googleReviewLink" TEXT,
  "autoReviewEnabled" BOOLEAN NOT NULL DEFAULT false,
  "businessName" VARCHAR(200),
  "logoUrl" TEXT,
  "logoKey" VARCHAR(500),
  "primaryColor" VARCHAR(20),
  "secondaryColor" VARCHAR(20),
  "stripePublishableKey" TEXT,
  "googleAnalyticsId" VARCHAR(50),
  "socialMediaEnabled" BOOLEAN NOT NULL DEFAULT true,
  "facebookUrl" TEXT,
  "facebookEnabled" BOOLEAN NOT NULL DEFAULT true,
  "instagramUrl" TEXT,
  "instagramEnabled" BOOLEAN NOT NULL DEFAULT true,
  "whatsappNumber" VARCHAR(30),
  "whatsappEnabled" BOOLEAN NOT NULL DEFAULT true,
  "twitterUrl" TEXT,
  "twitterEnabled" BOOLEAN NOT NULL DEFAULT true,
  "youtubeUrl" TEXT,
  "youtubeEnabled" BOOLEAN NOT NULL DEFAULT true,
  "tiktokUrl" TEXT,
  "tiktokEnabled" BOOLEAN NOT NULL DEFAULT true,
  "linkedinUrl" TEXT,
  "linkedinEnabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "app_settings_tenantId_idx" ON "app_settings" ("tenantId");

-- ─── SMS Conversations ────────────────────────────────────────────────────────
CREATE TABLE "conversations" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL DEFAULT 1,
  "leadId" INTEGER NOT NULL,
  "direction" VARCHAR(20) NOT NULL,
  "body" TEXT NOT NULL,
  "fromNumber" VARCHAR(30) NOT NULL,
  "toNumber" VARCHAR(30) NOT NULL,
  "twilioSid" VARCHAR(64),
  "status" VARCHAR(30) NOT NULL DEFAULT 'queued',
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "conversations_tenantId_idx" ON "conversations" ("tenantId");

-- ─── Appointments ───────────────────────────────────────────────────────────────
CREATE TABLE "appointments" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL DEFAULT 1,
  "leadId" INTEGER NOT NULL,
  "crewAssigned" VARCHAR(300),
  "jobType" VARCHAR(200),
  "scheduledDate" TIMESTAMP NOT NULL,
  "timeSlot" VARCHAR(100),
  "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  "notes" TEXT,
  "smsSent" BOOLEAN NOT NULL DEFAULT false,
  "emailSent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" INTEGER
);

-- ─── Invoices ──────────────────────────────────────────────────────────────────
CREATE TABLE "invoices" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL DEFAULT 1,
  "leadId" INTEGER NOT NULL,
  "invoiceNumber" VARCHAR(50) NOT NULL,
  "lineItems" JSONB NOT NULL,
  "subtotal" NUMERIC(10, 2) NOT NULL,
  "tax" NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  "total" NUMERIC(10, 2) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
  "dueDate" TIMESTAMP,
  "paidAt" TIMESTAMP,
  "stripePaymentLink" TEXT,
  "stripePaymentLinkId" VARCHAR(100),
  "stripeSessionId" VARCHAR(100),
  "notes" TEXT,
  "smsSent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" INTEGER
);

-- ─── Crew Members ────────────────────────────────────────────────────────────
CREATE TABLE "crew_members" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL DEFAULT 1,
  "name" VARCHAR(200) NOT NULL,
  "phone" VARCHAR(30),
  "email" VARCHAR(200),
  "role" VARCHAR(100),
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "crew_members_tenantId_idx" ON "crew_members" ("tenantId");

-- ─── Job Photos ───────────────────────────────────────────────────────────────
CREATE TABLE "job_photos" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL DEFAULT 1,
  "leadId" INTEGER NOT NULL,
  "photoUrl" TEXT NOT NULL,
  "photoKey" VARCHAR(500) NOT NULL,
  "type" VARCHAR(20) NOT NULL,
  "caption" VARCHAR(300),
  "uploadedBy" INTEGER,
  "uploadedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "job_photos_tenantId_idx" ON "job_photos" ("tenantId");

-- ─── Blog Posts ──────────────────────────────────────────────────────────────
CREATE TABLE "blog_posts" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL DEFAULT 1,
  "title" VARCHAR(500) NOT NULL,
  "slug" VARCHAR(600) NOT NULL UNIQUE,
  "content" TEXT,
  "excerpt" VARCHAR(500),
  "seoTitle" VARCHAR(200),
  "seoKeywords" VARCHAR(500),
  "seoDescription" VARCHAR(200),
  "featuredImageUrl" TEXT,
  "projectAddress" TEXT,
  "projectLatitude" NUMERIC(10, 7),
  "projectLongitude" NUMERIC(10, 7),
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
  "publishedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "blog_posts_tenantId_idx" ON "blog_posts" ("tenantId");

-- ─── Blog Images ─────────────────────────────────────────────────────────────
CREATE TABLE "blog_images" (
  "id" SERIAL PRIMARY KEY,
  "postId" INTEGER NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "caption" VARCHAR(500),
  "displayOrder" INTEGER NOT NULL DEFAULT 0
);

-- ─── Constraints and Foreign Keys (Optional - uncomment if needed) ────────────
-- ALTER TABLE "leads" ADD CONSTRAINT "leads_createdBy_fk" FOREIGN KEY ("createdBy") REFERENCES "users"("id");
-- ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedTo_fk" FOREIGN KEY ("assignedTo") REFERENCES "users"("id");
-- ALTER TABLE "communication_log" ADD CONSTRAINT "communication_log_leadId_fk" FOREIGN KEY ("leadId") REFERENCES "leads"("id");
-- ALTER TABLE "communication_log" ADD CONSTRAINT "communication_log_sentBy_fk" FOREIGN KEY ("sentBy") REFERENCES "users"("id");
-- ALTER TABLE "attachments" ADD CONSTRAINT "attachments_leadId_fk" FOREIGN KEY ("leadId") REFERENCES "leads"("id");
-- ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedBy_fk" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id");
-- ALTER TABLE "conversations" ADD CONSTRAINT "conversations_leadId_fk" FOREIGN KEY ("leadId") REFERENCES "leads"("id");
-- ALTER TABLE "appointments" ADD CONSTRAINT "appointments_leadId_fk" FOREIGN KEY ("leadId") REFERENCES "leads"("id");
-- ALTER TABLE "appointments" ADD CONSTRAINT "appointments_createdBy_fk" FOREIGN KEY ("createdBy") REFERENCES "users"("id");
-- ALTER TABLE "invoices" ADD CONSTRAINT "invoices_leadId_fk" FOREIGN KEY ("leadId") REFERENCES "leads"("id");
-- ALTER TABLE "invoices" ADD CONSTRAINT "invoices_createdBy_fk" FOREIGN KEY ("createdBy") REFERENCES "users"("id");
-- ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_leadId_fk" FOREIGN KEY ("leadId") REFERENCES "leads"("id");
-- ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_uploadedBy_fk" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id");
-- ALTER TABLE "blog_images" ADD CONSTRAINT "blog_images_postId_fk" FOREIGN KEY ("postId") REFERENCES "blog_posts"("id");
