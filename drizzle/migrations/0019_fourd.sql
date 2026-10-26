CREATE TABLE `fourd_plans` (
	`project_id` varchar(36) NOT NULL,
	`file_id` varchar(36),
	`file_name` varchar(255) NOT NULL DEFAULT '',
	`file_version` int NOT NULL DEFAULT 0,
	`grid` json,
	`activities` json NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `fourd_plans_project_id` PRIMARY KEY(`project_id`)
);
