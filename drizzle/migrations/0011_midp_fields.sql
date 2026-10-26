ALTER TABLE `deliverables` ADD `formats` json;--> statement-breakpoint
ALTER TABLE `deliverables` ADD `classification` varchar(80) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `deliverables` ADD `actual_date` varchar(10) DEFAULT '' NOT NULL;