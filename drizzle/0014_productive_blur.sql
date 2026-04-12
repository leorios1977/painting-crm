CREATE TABLE `blog_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`caption` varchar(500),
	`displayOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `blog_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`title` varchar(500) NOT NULL,
	`slug` varchar(600) NOT NULL,
	`content` text,
	`excerpt` varchar(500),
	`seoTitle` varchar(200),
	`seoKeywords` varchar(500),
	`seoDescription` varchar(200),
	`featuredImageUrl` text,
	`projectAddress` text,
	`projectLatitude` decimal(10,7),
	`projectLongitude` decimal(10,7),
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`)
);
