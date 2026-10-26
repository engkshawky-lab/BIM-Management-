CREATE TABLE `ai_usage` (
	`user_id` varchar(36) NOT NULL,
	`month` varchar(7) NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	CONSTRAINT `ai_usage_user_id_month_pk` PRIMARY KEY(`user_id`,`month`)
);
--> statement-breakpoint
CREATE TABLE `promo_codes` (
	`code` varchar(40) NOT NULL,
	`plan` varchar(16) NOT NULL,
	`months` int NOT NULL,
	`max_uses` int NOT NULL DEFAULT 1,
	`uses` int NOT NULL DEFAULT 0,
	`expires_at` datetime,
	`created_at` datetime NOT NULL,
	CONSTRAINT `promo_codes_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`user_id` varchar(36) NOT NULL,
	`plan` varchar(16) NOT NULL DEFAULT 'free',
	`status` varchar(16) NOT NULL DEFAULT 'active',
	`renews_at` datetime,
	`source` varchar(60) NOT NULL DEFAULT '',
	`updated_at` datetime NOT NULL,
	CONSTRAINT `subscriptions_user_id` PRIMARY KEY(`user_id`)
);
