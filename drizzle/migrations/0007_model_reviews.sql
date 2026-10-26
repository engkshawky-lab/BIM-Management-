CREATE TABLE `model_reviews` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`number` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`discipline` varchar(40) NOT NULL,
	`task_team_id` varchar(36),
	`file_id` varchar(36),
	`milestone` varchar(120) NOT NULL DEFAULT '',
	`reviewer_id` varchar(36) NOT NULL,
	`results` json NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'Draft',
	`score` int NOT NULL DEFAULT 0,
	`grade` varchar(2) NOT NULL DEFAULT '—',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `model_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `model_reviews_project` ON `model_reviews` (`project_id`);