ALTER TABLE `blog_posts` MODIFY COLUMN `tenantId` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `conversations` MODIFY COLUMN `tenantId` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `crew_members` ADD `tenantId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `job_photos` ADD `tenantId` int DEFAULT 1 NOT NULL;