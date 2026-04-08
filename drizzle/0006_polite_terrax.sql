ALTER TABLE `leads` ADD `portalToken` varchar(64);--> statement-breakpoint
ALTER TABLE `leads` ADD `portalPhotos` json;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_portalToken_unique` UNIQUE(`portalToken`);