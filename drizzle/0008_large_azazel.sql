CREATE TABLE `job_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`photoUrl` text NOT NULL,
	`photoKey` varchar(500) NOT NULL,
	`type` enum('before','after') NOT NULL,
	`caption` varchar(300),
	`uploadedBy` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_photos_id` PRIMARY KEY(`id`)
);
