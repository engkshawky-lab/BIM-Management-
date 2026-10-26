ALTER TABLE `notifications` ADD `emailed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `email_pref` varchar(10) DEFAULT 'instant' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `locale` varchar(5) DEFAULT 'en' NOT NULL;