CREATE TABLE `notebooks` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`sources` json NOT NULL,
	`notes` json NOT NULL,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `notebooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `notebooks_project` ON `notebooks` (`project_id`);