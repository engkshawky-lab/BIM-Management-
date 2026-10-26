ALTER TABLE `subscriptions` ADD `stripe_customer_id` varchar(64);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `stripe_subscription_id` varchar(64);