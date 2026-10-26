CREATE TABLE `mrm_rows` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`discipline` varchar(40) NOT NULL,
	`system` varchar(80) NOT NULL DEFAULT '',
	`element` varchar(160) NOT NULL,
	`cells` json NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	CONSTRAINT `mrm_rows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `mrm_project` ON `mrm_rows` (`project_id`);