ALTER TABLE `app_settings` ADD `googleAnalyticsId` varchar(50);--> statement-breakpoint
ALTER TABLE `app_settings` ADD `socialMediaEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `facebookUrl` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `facebookEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `instagramUrl` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `instagramEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `whatsappNumber` varchar(30);--> statement-breakpoint
ALTER TABLE `app_settings` ADD `whatsappEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `twitterUrl` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `twitterEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `youtubeUrl` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `youtubeEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `tiktokUrl` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `tiktokEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `linkedinUrl` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `linkedinEnabled` boolean DEFAULT true NOT NULL;