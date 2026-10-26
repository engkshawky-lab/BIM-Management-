CREATE TABLE `activity` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`action` varchar(40) NOT NULL,
	`summary` varchar(500) NOT NULL,
	`link` varchar(200) NOT NULL DEFAULT '',
	`created_at` datetime NOT NULL,
	CONSTRAINT `activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`document_id` varchar(36),
	`file_id` varchar(36),
	`section_id` varchar(60),
	`user_id` varchar(36) NOT NULL,
	`body` text NOT NULL,
	`resolved` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_revisions` (
	`id` varchar(36) NOT NULL,
	`document_id` varchar(36) NOT NULL,
	`revision` varchar(12) NOT NULL,
	`state` varchar(16) NOT NULL,
	`suitability` varchar(8) NOT NULL,
	`note` varchar(500) NOT NULL,
	`values` json NOT NULL,
	`author_id` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `document_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`template_id` varchar(40) NOT NULL,
	`title` varchar(255) NOT NULL,
	`container_name` varchar(120) NOT NULL DEFAULT '',
	`revision` varchar(12) NOT NULL,
	`state` varchar(16) NOT NULL,
	`suitability` varchar(8) NOT NULL,
	`author_id` varchar(36) NOT NULL,
	`values` json NOT NULL,
	`reviewer_id` varchar(36),
	`review_status` varchar(16) NOT NULL DEFAULT 'none',
	`locked_by` varchar(36),
	`locked_at` datetime,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_versions` (
	`id` varchar(36) NOT NULL,
	`file_id` varchar(36) NOT NULL,
	`version` int NOT NULL,
	`storage_key` varchar(255) NOT NULL,
	`size` bigint NOT NULL,
	`mime_type` varchar(160) NOT NULL,
	`note` varchar(500) NOT NULL DEFAULT '',
	`uploaded_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `file_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`folder_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`container_name` varchar(120) NOT NULL DEFAULT '',
	`state` varchar(16) NOT NULL DEFAULT 'WIP',
	`suitability` varchar(8) NOT NULL DEFAULT 'S0',
	`revision` varchar(12) NOT NULL DEFAULT 'P01.01',
	`current_version` int NOT NULL DEFAULT 1,
	`document_id` varchar(36),
	`uploaded_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`parent_id` varchar(36),
	`name` varchar(160) NOT NULL,
	`cde_state` varchar(16),
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`role` varchar(16) NOT NULL,
	`invited_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	`accepted_at` datetime,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`project_id` varchar(36),
	`message` varchar(500) NOT NULL,
	`link` varchar(200) NOT NULL DEFAULT '',
	`read` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_members` (
	`project_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role` varchar(16) NOT NULL,
	`joined_at` datetime NOT NULL,
	CONSTRAINT `project_members_project_id_user_id_pk` PRIMARY KEY(`project_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` varchar(36) NOT NULL,
	`name` varchar(200) NOT NULL,
	`code` varchar(16) NOT NULL,
	`description` text,
	`appointing_party` varchar(200) NOT NULL DEFAULT '',
	`location` varchar(200) NOT NULL DEFAULT '',
	`standards` json NOT NULL,
	`stage` varchar(60) NOT NULL DEFAULT '',
	`owner_id` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(120) NOT NULL,
	`password_hash` varchar(100) NOT NULL,
	`organization` varchar(160) NOT NULL DEFAULT '',
	`job_title` varchar(120) NOT NULL DEFAULT '',
	`phone` varchar(40) NOT NULL DEFAULT '',
	`bio` text,
	`role` varchar(16) NOT NULL DEFAULT 'user',
	`created_at` datetime NOT NULL,
	`last_login_at` datetime,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `workflow_progress` (
	`project_id` varchar(36) NOT NULL,
	`workflow_id` varchar(40) NOT NULL,
	`data` json NOT NULL,
	`updated_by` varchar(36) NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `workflow_progress_project_id_workflow_id_pk` PRIMARY KEY(`project_id`,`workflow_id`)
);
--> statement-breakpoint
CREATE INDEX `activity_project` ON `activity` (`project_id`);--> statement-breakpoint
CREATE INDEX `comments_document` ON `comments` (`document_id`);--> statement-breakpoint
CREATE INDEX `comments_file` ON `comments` (`file_id`);--> statement-breakpoint
CREATE INDEX `revisions_document` ON `document_revisions` (`document_id`);--> statement-breakpoint
CREATE INDEX `documents_project` ON `documents` (`project_id`);--> statement-breakpoint
CREATE INDEX `versions_file` ON `file_versions` (`file_id`);--> statement-breakpoint
CREATE INDEX `files_project` ON `files` (`project_id`);--> statement-breakpoint
CREATE INDEX `files_folder` ON `files` (`folder_id`);--> statement-breakpoint
CREATE INDEX `folders_project` ON `folders` (`project_id`);--> statement-breakpoint
CREATE INDEX `invitations_email` ON `invitations` (`email`);--> statement-breakpoint
CREATE INDEX `notifications_user` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `members_user` ON `project_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_user` ON `sessions` (`user_id`);