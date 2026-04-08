CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`body` text NOT NULL,
	`fromNumber` varchar(30) NOT NULL,
	`toNumber` varchar(30) NOT NULL,
	`twilioSid` varchar(64),
	`status` varchar(30) NOT NULL DEFAULT 'queued',
	`tenantId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
