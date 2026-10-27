CREATE TABLE `adoption_progress` (
	`user_id` varchar(36) NOT NULL,
	`data` json NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `adoption_progress_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `course_assignments` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`course_id` varchar(40) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`due_date` varchar(10) NOT NULL DEFAULT '',
	`assigned_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `course_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `course_assignments_unique` UNIQUE(`project_id`,`course_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `house_templates` (
	`id` varchar(36) NOT NULL,
	`organization` varchar(160) NOT NULL,
	`name` varchar(160) NOT NULL,
	`template_id` varchar(40) NOT NULL,
	`values` json NOT NULL,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `house_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hs_items` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`number` int NOT NULL,
	`hazard` varchar(255) NOT NULL,
	`location` varchar(160) NOT NULL DEFAULT '',
	`phase` varchar(24) NOT NULL DEFAULT 'Construction',
	`description` varchar(1000) NOT NULL DEFAULT '',
	`controls` varchar(1000) NOT NULL DEFAULT '',
	`residual` varchar(8) NOT NULL DEFAULT 'Medium',
	`audience` varchar(160) NOT NULL DEFAULT '',
	`file_id` varchar(36),
	`owner_id` varchar(36),
	`status` varchar(16) NOT NULL DEFAULT 'Open',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `hs_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `feedback` ADD `screenshot` mediumtext;--> statement-breakpoint
ALTER TABLE `feedback` ADD `reply` varchar(4000) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `feedback` ADD `replied_at` datetime;--> statement-breakpoint
CREATE INDEX `course_assignments_project` ON `course_assignments` (`project_id`);--> statement-breakpoint
CREATE INDEX `house_templates_org` ON `house_templates` (`organization`);--> statement-breakpoint
CREATE INDEX `hs_project` ON `hs_items` (`project_id`);