CREATE TABLE `quiz_attempts` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`mode` varchar(16) NOT NULL,
	`topic` varchar(60) NOT NULL DEFAULT '',
	`score` int NOT NULL,
	`total` int NOT NULL,
	`by_topic` json NOT NULL,
	`seconds` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	CONSTRAINT `quiz_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `quiz_user` ON `quiz_attempts` (`user_id`);