ALTER TABLE `deliverables` ADD `description` varchar(1000) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `deliverables` ADD `native_format` varchar(20) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `deliverables` ADD `model_ref` varchar(120) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `deliverables` ADD `cost_code` varchar(40) DEFAULT '' NOT NULL;
