CREATE TABLE `estimates` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`kind` varchar(10) NOT NULL,
	`title` varchar(160) NOT NULL,
	`input` json NOT NULL,
	`summary` varchar(300) NOT NULL DEFAULT '',
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `estimates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `talent_profiles` (
	`user_id` varchar(36) NOT NULL,
	`visible` boolean NOT NULL DEFAULT false,
	`show_results` boolean NOT NULL DEFAULT false,
	`headline` varchar(160) NOT NULL DEFAULT '',
	`skills` json NOT NULL,
	`certifications` json NOT NULL,
	`years` int NOT NULL DEFAULT 0,
	`location` varchar(120) NOT NULL DEFAULT '',
	`availability` varchar(20) NOT NULL DEFAULT 'Not looking',
	`updated_at` datetime NOT NULL,
	CONSTRAINT `talent_profiles_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `talent_views` (
	`id` varchar(36) NOT NULL,
	`recruiter_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `talent_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `estimates_project` ON `estimates` (`project_id`);--> statement-breakpoint
CREATE INDEX `talent_views_user` ON `talent_views` (`user_id`);