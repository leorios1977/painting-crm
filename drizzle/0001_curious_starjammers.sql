CREATE TABLE `attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`fileName` varchar(300) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`mimeType` varchar(100),
	`fileSize` int,
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`triggerType` enum('stage_change','scheduled','manual','days_after_stage') NOT NULL,
	`triggerStage` enum('lead','quoted','scheduled','in_progress','completed','paid'),
	`delayHours` int DEFAULT 0,
	`templateId` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communication_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`type` enum('email','call','note','sms','system') NOT NULL,
	`direction` enum('inbound','outbound','internal') DEFAULT 'outbound',
	`subject` varchar(500),
	`content` text NOT NULL,
	`templateId` int,
	`automationRuleId` int,
	`sentBy` int,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`triggerStage` enum('lead','quoted','scheduled','in_progress','completed','paid','manual') DEFAULT 'manual',
	`isActive` boolean NOT NULL DEFAULT true,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(30),
	`projectType` varchar(100),
	`projectAddress` text,
	`projectDescription` text,
	`estimatedValue` decimal(10,2),
	`stage` enum('lead','quoted','scheduled','in_progress','completed','paid') NOT NULL DEFAULT 'lead',
	`source` varchar(100),
	`assignedTo` int,
	`lastContactedAt` timestamp,
	`scheduledDate` timestamp,
	`completedDate` timestamp,
	`stripeCustomerId` varchar(100),
	`stripeInvoiceId` varchar(100),
	`stripePaymentLinkUrl` text,
	`paidAt` timestamp,
	`calendarEventId` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
