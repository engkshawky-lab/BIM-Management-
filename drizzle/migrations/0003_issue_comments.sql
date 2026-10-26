ALTER TABLE `comments` ADD `issue_id` varchar(36);--> statement-breakpoint
CREATE INDEX `comments_issue` ON `comments` (`issue_id`);