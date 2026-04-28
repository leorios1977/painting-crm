CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."automation_trigger_type" AS ENUM('stage_change', 'scheduled', 'manual', 'days_after_stage');--> statement-breakpoint
CREATE TYPE "public"."blog_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."communication_direction" AS ENUM('inbound', 'outbound', 'internal');--> statement-breakpoint
CREATE TYPE "public"."communication_type" AS ENUM('email', 'call', 'note', 'sms', 'system');--> statement-breakpoint
CREATE TYPE "public"."conversation_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."crew_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."lead_stage" AS ENUM('lead', 'quoted', 'scheduled', 'in_progress', 'completed', 'paid');--> statement-breakpoint
CREATE TYPE "public"."photo_type" AS ENUM('before', 'after');--> statement-breakpoint
CREATE TYPE "public"."template_trigger_stage" AS ENUM('lead', 'quoted', 'scheduled', 'in_progress', 'completed', 'paid', 'manual');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer DEFAULT 1 NOT NULL,
	"companyName" varchar(200),
	"companyEmail" varchar(320),
	"reviewLink" text,
	"stripeSecretKey" text,
	"googleCalendarId" varchar(300),
	"googleServiceAccountKey" text,
	"googleReviewLink" text,
	"autoReviewEnabled" boolean DEFAULT false NOT NULL,
	"businessName" varchar(200),
	"logoUrl" text,
	"logoKey" varchar(500),
	"primaryColor" varchar(20),
	"secondaryColor" varchar(20),
	"stripePublishableKey" text,
	"googleAnalyticsId" varchar(50),
	"socialMediaEnabled" boolean DEFAULT true NOT NULL,
	"facebookUrl" text,
	"facebookEnabled" boolean DEFAULT true NOT NULL,
	"instagramUrl" text,
	"instagramEnabled" boolean DEFAULT true NOT NULL,
	"whatsappNumber" varchar(30),
	"whatsappEnabled" boolean DEFAULT true NOT NULL,
	"twitterUrl" text,
	"twitterEnabled" boolean DEFAULT true NOT NULL,
	"youtubeUrl" text,
	"youtubeEnabled" boolean DEFAULT true NOT NULL,
	"tiktokUrl" text,
	"tiktokEnabled" boolean DEFAULT true NOT NULL,
	"linkedinUrl" text,
	"linkedinEnabled" boolean DEFAULT true NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer DEFAULT 1 NOT NULL,
	"leadId" integer NOT NULL,
	"crewAssigned" varchar(300),
	"jobType" varchar(200),
	"scheduledDate" timestamp NOT NULL,
	"timeSlot" varchar(100),
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"smsSent" boolean DEFAULT false NOT NULL,
	"emailSent" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer DEFAULT 1 NOT NULL,
	"leadId" integer NOT NULL,
	"fileName" varchar(300) NOT NULL,
	"fileKey" varchar(500) NOT NULL,
	"fileUrl" text NOT NULL,
	"mimeType" varchar(100),
	"fileSize" integer,
	"uploadedBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer DEFAULT 1 NOT NULL,
	"name" varchar(200) NOT NULL,
	"triggerType" "automation_trigger_type" NOT NULL,
	"triggerStage" "lead_stage",
	"delayHours" integer DEFAULT 0,
	"templateId" integer NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"postId" integer NOT NULL,
	"imageUrl" text NOT NULL,
	"caption" varchar(500),
	"displayOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer DEFAULT 1 NOT NULL,
	"title" varchar(500) NOT NULL,
	"slug" varchar(600) NOT NULL,
	"content" text,
	"excerpt" varchar(500),
	"seoTitle" varchar(200),
	"seoKeywords" varchar(500),
	"seoDescription" varchar(200),
	"featuredImageUrl" text,
	"projectAddress" text,
	"projectLatitude" numeric(10, 7),
	"projectLongitude" numeric(10, 7),
	"status" "blog_status" DEFAULT 'draft' NOT NULL,
	"publishedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "communication_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer DEFAULT 1 NOT NULL,
	"leadId" integer NOT NULL,
	"type" "communication_type" NOT NULL,
	"direction" "communication_direction" DEFAULT 'outbound',
	"subject" varchar(500),
	"content" text NOT NULL,
	"templateId" integer,
	"automationRuleId" integer,
	"sentBy" integer,
	"sentAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer DEFAULT 1 NOT NULL,
	"leadId" integer NOT NULL,
	"direction" "conversation_direction" NOT NULL,
	"body" text NOT NULL,
	"fromNumber" varchar(30) NOT NULL,
	"toNumber" varchar(30) NOT NULL,
	"twilioSid" varchar(64),
	"status" varchar(30) DEFAULT 'queued' NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crew_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer DEFAULT 1 NOT NULL,
	"name" varchar(200) NOT NULL,
	"phone" varchar(30),
	"email" varchar(200),
	"role" varchar(100),
	"status" "crew_status" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer DEFAULT 1 NOT NULL,
	"name" varchar(200) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"triggerStage" "template_trigger_stage" DEFAULT 'manual',
	"isActive" boolean DEFAULT true NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer DEFAULT 1 NOT NULL,
	"leadId" integer NOT NULL,
	"invoiceNumber" varchar(50) NOT NULL,
	"lineItems" jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"dueDate" timestamp,
	"paidAt" timestamp,
	"stripePaymentLink" text,
	"stripePaymentLinkId" varchar(100),
	"stripeSessionId" varchar(100),
	"notes" text,
	"smsSent" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer
);
--> statement-breakpoint
CREATE TABLE "job_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer DEFAULT 1 NOT NULL,
	"leadId" integer NOT NULL,
	"photoUrl" text NOT NULL,
	"photoKey" varchar(500) NOT NULL,
	"type" "photo_type" NOT NULL,
	"caption" varchar(300),
	"uploadedBy" integer,
	"uploadedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer DEFAULT 1 NOT NULL,
	"firstName" varchar(100) NOT NULL,
	"lastName" varchar(100) NOT NULL,
	"email" varchar(320),
	"phone" varchar(30),
	"projectType" varchar(100),
	"projectAddress" text,
	"projectDescription" text,
	"estimatedValue" numeric(10, 2),
	"stage" "lead_stage" DEFAULT 'lead' NOT NULL,
	"source" varchar(100),
	"assignedTo" integer,
	"lastContactedAt" timestamp,
	"scheduledDate" timestamp,
	"completedDate" timestamp,
	"stripeCustomerId" varchar(100),
	"stripeInvoiceId" varchar(100),
	"stripePaymentLinkUrl" text,
	"paidAt" timestamp,
	"calendarEventId" varchar(200),
	"portalToken" varchar(64),
	"portalPhotos" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer,
	CONSTRAINT "leads_portalToken_unique" UNIQUE("portalToken")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE INDEX "app_settings_tenantId_idx" ON "app_settings" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "attachments_tenantId_idx" ON "attachments" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "automation_rules_tenantId_idx" ON "automation_rules" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "blog_posts_tenantId_idx" ON "blog_posts" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "communication_log_tenantId_idx" ON "communication_log" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "conversations_tenantId_idx" ON "conversations" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "crew_members_tenantId_idx" ON "crew_members" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "email_templates_tenantId_idx" ON "email_templates" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "job_photos_tenantId_idx" ON "job_photos" USING btree ("tenantId");