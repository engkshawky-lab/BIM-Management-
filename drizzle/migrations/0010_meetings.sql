CREATE TABLE `meetings` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`number` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` varchar(40) NOT NULL,
	`date` varchar(16) NOT NULL DEFAULT '',
	`location` varchar(160) NOT NULL DEFAULT '',
	`attendees` json NOT NULL,
	`agenda` json NOT NULL,
	`actions` json NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'Planned',
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `meetings_project` ON `meetings` (`project_id`);