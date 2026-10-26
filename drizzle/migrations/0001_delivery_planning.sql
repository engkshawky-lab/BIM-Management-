CREATE TABLE `deliverables` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`task_team_id` varchar(36) NOT NULL,
	`container_name` varchar(120) NOT NULL DEFAULT '',
	`title` varchar(255) NOT NULL,
	`type_code` varchar(2) NOT NULL DEFAULT '',
	`loin` varchar(40) NOT NULL DEFAULT '',
	`milestone_id` varchar(36),
	`start_date` varchar(10) NOT NULL DEFAULT '',
	`due_date` varchar(10) NOT NULL DEFAULT '',
	`status` varchar(16) NOT NULL DEFAULT 'planned',
	`depends_on` json NOT NULL,
	`assignee_id` varchar(36),
	`file_id` varchar(36),
	`document_id` varchar(36),
	`notes` varchar(1000) NOT NULL DEFAULT '',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `deliverables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loin_rows` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`ref` varchar(40) NOT NULL,
	`element` varchar(160) NOT NULL,
	`ifc_class` varchar(80) NOT NULL DEFAULT '',
	`milestone_id` varchar(36),
	`purpose` varchar(255) NOT NULL DEFAULT '',
	`geometry` varchar(1000) NOT NULL DEFAULT '',
	`alphanumeric` varchar(1000) NOT NULL DEFAULT '',
	`documentation` varchar(1000) NOT NULL DEFAULT '',
	`created_at` datetime NOT NULL,
	CONSTRAINT `loin_rows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`date` varchar(10) NOT NULL,
	`description` varchar(500) NOT NULL DEFAULT '',
	`created_at` datetime NOT NULL,
	CONSTRAINT `milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `responsibility_rows` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`item` varchar(255) NOT NULL,
	`stage` varchar(120) NOT NULL DEFAULT '',
	`loin` varchar(40) NOT NULL DEFAULT '',
	`cells` json NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	CONSTRAINT `responsibility_rows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_teams` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`name` varchar(120) NOT NULL,
	`organization` varchar(160) NOT NULL DEFAULT '',
	`originator_code` varchar(6) NOT NULL DEFAULT '',
	`role_code` varchar(2) NOT NULL DEFAULT '',
	`lead_user_id` varchar(36),
	`created_at` datetime NOT NULL,
	CONSTRAINT `task_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `deliverables_project` ON `deliverables` (`project_id`);--> statement-breakpoint
CREATE INDEX `loin_project` ON `loin_rows` (`project_id`);--> statement-breakpoint
CREATE INDEX `milestones_project` ON `milestones` (`project_id`);--> statement-breakpoint
CREATE INDEX `resp_project` ON `responsibility_rows` (`project_id`);--> statement-breakpoint
CREATE INDEX `task_teams_project` ON `task_teams` (`project_id`);