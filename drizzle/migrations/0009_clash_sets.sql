ALTER TABLE `clash_tests` ADD `code` varchar(20) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `clash_tests` ADD `sets_a` json;--> statement-breakpoint
ALTER TABLE `clash_tests` ADD `sets_b` json;