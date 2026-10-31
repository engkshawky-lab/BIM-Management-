CREATE TABLE `company_videos` (
	`id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` varchar(2000) NOT NULL DEFAULT '',
	`topic` varchar(60) NOT NULL,
	`lang` varchar(8) NOT NULL DEFAULT 'en',
	`source` varchar(8) NOT NULL,
	`url` varchar(500) NOT NULL DEFAULT '',
	`file_name` varchar(255) NOT NULL DEFAULT '',
	`mime_type` varchar(120) NOT NULL DEFAULT '',
	`size` bigint NOT NULL DEFAULT 0,
	`storage_key` varchar(255) NOT NULL DEFAULT '',
	`views` int NOT NULL DEFAULT 0,
	`uploaded_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `company_videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `company_videos_topic` ON `company_videos` (`topic`);