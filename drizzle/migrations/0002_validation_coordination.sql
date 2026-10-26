CREATE TABLE `clash_tests` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`team_a` varchar(36) NOT NULL,
	`team_b` varchar(36) NOT NULL,
	`kind` varchar(16) NOT NULL DEFAULT 'hard',
	`tolerance_mm` int NOT NULL DEFAULT 0,
	`priority` varchar(16) NOT NULL DEFAULT 'Normal',
	`frequency` varchar(24) NOT NULL DEFAULT 'Weekly',
	`notes` varchar(500) NOT NULL DEFAULT '',
	CONSTRAINT `clash_tests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `handover_items` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`category` varchar(60) NOT NULL,
	`title` varchar(255) NOT NULL,
	`clause` varchar(40) NOT NULL DEFAULT '',
	`status` varchar(16) NOT NULL DEFAULT 'Not started',
	`owner_id` varchar(36),
	`file_id` varchar(36),
	`notes` varchar(1000) NOT NULL DEFAULT '',
	`sort_order` int NOT NULL DEFAULT 0,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `handover_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`number` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` varchar(24) NOT NULL DEFAULT 'Issue',
	`status` varchar(16) NOT NULL DEFAULT 'Open',
	`priority` varchar(16) NOT NULL DEFAULT 'Normal',
	`assignee_id` varchar(36),
	`task_team_id` varchar(36),
	`due_date` varchar(10) NOT NULL DEFAULT '',
	`file_id` varchar(36),
	`document_id` varchar(36),
	`deliverable_id` varchar(36),
	`validation_run_id` varchar(36),
	`element_guids` json NOT NULL,
	`labels` json NOT NULL,
	`bcf_guid` varchar(36) NOT NULL,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	`closed_at` datetime,
	CONSTRAINT `issues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risks` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`number` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(40) NOT NULL DEFAULT 'Information delivery',
	`cause` varchar(1000) NOT NULL DEFAULT '',
	`likelihood` int NOT NULL DEFAULT 3,
	`impact` int NOT NULL DEFAULT 3,
	`mitigation` varchar(1000) NOT NULL DEFAULT '',
	`owner_id` varchar(36),
	`status` varchar(16) NOT NULL DEFAULT 'Open',
	`residual_likelihood` int,
	`residual_impact` int,
	`review_date` varchar(10) NOT NULL DEFAULT '',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `risks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `validation_runs` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`file_id` varchar(36) NOT NULL,
	`file_version` int NOT NULL,
	`kind` varchar(16) NOT NULL,
	`status` varchar(16) NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`errors` int NOT NULL DEFAULT 0,
	`warnings` int NOT NULL DEFAULT 0,
	`summary` varchar(500) NOT NULL DEFAULT '',
	`report` json NOT NULL,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `validation_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `clash_project` ON `clash_tests` (`project_id`);--> statement-breakpoint
CREATE INDEX `handover_project` ON `handover_items` (`project_id`);--> statement-breakpoint
CREATE INDEX `issues_project` ON `issues` (`project_id`);--> statement-breakpoint
CREATE INDEX `risks_project` ON `risks` (`project_id`);--> statement-breakpoint
CREATE INDEX `validation_project` ON `validation_runs` (`project_id`);--> statement-breakpoint
CREATE INDEX `validation_file` ON `validation_runs` (`file_id`);