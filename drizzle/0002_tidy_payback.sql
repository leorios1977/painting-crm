CREATE TABLE `app_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(200),
	`companyEmail` varchar(320),
	`reviewLink` text,
	`stripeSecretKey` text,
	`googleCalendarId` varchar(300),
	`googleServiceAccountKey` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_id` PRIMARY KEY(`id`)
);
