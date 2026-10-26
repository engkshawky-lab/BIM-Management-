CREATE TABLE `requirements` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`ref` varchar(40) NOT NULL,
	`text` varchar(2000) NOT NULL,
	`source` varchar(160) NOT NULL DEFAULT '',
	`category` varchar(60) NOT NULL DEFAULT '',
	`response` varchar(2000) NOT NULL DEFAULT '',
	`deliverable_ids` json NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `requirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `requirements_project` ON `requirements` (`project_id`);