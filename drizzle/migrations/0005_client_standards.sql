CREATE TABLE `client_standards` (
	`id` varchar(36) NOT NULL,
	`owner_id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`client` varchar(160) NOT NULL DEFAULT '',
	`data` json NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `client_standards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `standard_id` varchar(36);--> statement-breakpoint
ALTER TABLE `projects` ADD `standard_stage` varchar(80) DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `standards_owner` ON `client_standards` (`owner_id`);