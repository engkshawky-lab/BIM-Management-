CREATE TABLE `agent_runs` (
	`id` varchar(36) NOT NULL,
	`agent_id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`started_at` datetime NOT NULL,
	`status` varchar(10) NOT NULL,
	`summary` text,
	`trigger` varchar(10) NOT NULL DEFAULT 'schedule',
	CONSTRAINT `agent_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`kind` varchar(30) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`frequency` varchar(10) NOT NULL DEFAULT 'weekly',
	`last_run_at` datetime,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quality_snapshots` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`day` varchar(10) NOT NULL,
	`quality_score` int NOT NULL,
	`errors` int NOT NULL,
	`warnings` int NOT NULL,
	`progress` int NOT NULL,
	`overdue` int NOT NULL,
	`open_issues` int NOT NULL,
	`model_quality` int,
	CONSTRAINT `quality_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `snap_project_day` UNIQUE(`project_id`,`day`)
);
--> statement-breakpoint
CREATE INDEX `agent_runs_agent` ON `agent_runs` (`agent_id`);--> statement-breakpoint
CREATE INDEX `agents_project` ON `agents` (`project_id`);