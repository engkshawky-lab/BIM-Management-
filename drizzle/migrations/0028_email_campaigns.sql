CREATE TABLE `email_campaigns` (
 `id` varchar(36) NOT NULL PRIMARY KEY,
 `subject` varchar(255) NOT NULL,
 `blocks` json NOT NULL,
 `filter` json,
 `status` varchar(16) NOT NULL,
 `total` int NOT NULL,
 `delay_ms` int NOT NULL,
 `created_by` varchar(36) NOT NULL,
 `created_at` datetime NOT NULL,
 `finished_at` datetime,
 INDEX `email_campaigns_time` (`created_at`)
);
--> statement-breakpoint
CREATE TABLE `email_campaign_recipients` (
 `campaign_id` varchar(36) NOT NULL,
 `user_id` varchar(36) NOT NULL,
 `email` varchar(255) NOT NULL,
 `status` varchar(10) NOT NULL DEFAULT 'pending',
 `error` varchar(255) NOT NULL DEFAULT '',
 `sent_at` datetime,
 PRIMARY KEY (`campaign_id`, `user_id`),
 INDEX `email_campaign_recipients_status` (`campaign_id`, `status`)
);
