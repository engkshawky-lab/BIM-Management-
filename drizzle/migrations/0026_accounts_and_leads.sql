CREATE TABLE `email_verifications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_at` datetime NOT NULL,
	CONSTRAINT `email_verifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_verifications_token` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` varchar(36) NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(255) NOT NULL,
	`company` varchar(160) NOT NULL DEFAULT '',
	`phone` varchar(40) NOT NULL DEFAULT '',
	`interest` varchar(40) NOT NULL DEFAULT '',
	`message` varchar(4000) NOT NULL DEFAULT '',
	`source` varchar(120) NOT NULL DEFAULT '',
	`status` varchar(16) NOT NULL DEFAULT 'New',
	`note` varchar(2000) NOT NULL DEFAULT '',
	`created_at` datetime NOT NULL,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified_at` datetime;--> statement-breakpoint
CREATE INDEX `email_verifications_user` ON `email_verifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `leads_created` ON `leads` (`created_at`);--> statement-breakpoint
UPDATE `users` SET `email_verified_at` = `created_at` WHERE `email_verified_at` IS NULL;