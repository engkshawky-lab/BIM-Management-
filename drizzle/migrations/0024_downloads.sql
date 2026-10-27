CREATE TABLE `resources` (
	`id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` varchar(2000) NOT NULL DEFAULT '',
	`category` varchar(40) NOT NULL,
	`part` varchar(16) NOT NULL DEFAULT '',
	`file_name` varchar(255) NOT NULL,
	`mime_type` varchar(120) NOT NULL,
	`size` bigint NOT NULL,
	`storage_key` varchar(255) NOT NULL,
	`downloads` int NOT NULL DEFAULT 0,
	`uploaded_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `resources_category` ON `resources` (`category`);