CREATE TABLE `feedback` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`kind` varchar(16) NOT NULL,
	`message` varchar(4000) NOT NULL,
	`page` varchar(255) NOT NULL DEFAULT '',
	`status` varchar(16) NOT NULL DEFAULT 'New',
	`created_at` datetime NOT NULL,
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_at` datetime NOT NULL,
	CONSTRAINT `password_resets_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_resets_token` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` varchar(60) NOT NULL,
	`value` json NOT NULL,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `disabled` int DEFAULT 0 NOT NULL;