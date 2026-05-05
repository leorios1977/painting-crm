ALTER TABLE "app_settings" ADD COLUMN "ownerName" varchar(200);--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "phone" varchar(30);--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "state" varchar(50);--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "website" varchar(500);--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "plan" varchar(50) DEFAULT 'starter';