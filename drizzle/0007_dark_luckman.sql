ALTER TABLE `app_settings` ADD `googleReviewLink` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `autoReviewEnabled` boolean DEFAULT false NOT NULL;