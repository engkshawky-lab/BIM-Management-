ALTER TABLE `company_videos` ADD `placements` json;--> statement-breakpoint
CREATE TABLE `path_exams` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`path_id` varchar(40) NOT NULL,
	`question_ids` json NOT NULL,
	`started_at` datetime NOT NULL,
	`expires_at` datetime NOT NULL,
	`submitted_at` datetime,
	`score` int NOT NULL DEFAULT 0,
	`total` int NOT NULL DEFAULT 0,
	`pct` int NOT NULL DEFAULT 0,
	`passed` boolean NOT NULL DEFAULT false,
	CONSTRAINT `path_exams_id` PRIMARY KEY(`id`)
);--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` varchar(36) NOT NULL,
	`code` varchar(20) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`exam_id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`path_id` varchar(40) NOT NULL,
	`title` varchar(200) NOT NULL,
	`pct` int NOT NULL,
	`issuer` varchar(160) NOT NULL,
	`signatory_name` varchar(160) NOT NULL DEFAULT '',
	`signatory_title` varchar(160) NOT NULL DEFAULT '',
	`issued_at` datetime NOT NULL,
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_code` UNIQUE(`code`)
);--> statement-breakpoint
CREATE INDEX `path_exams_user` ON `path_exams` (`user_id`,`path_id`);--> statement-breakpoint
CREATE INDEX `certificates_user` ON `certificates` (`user_id`);
