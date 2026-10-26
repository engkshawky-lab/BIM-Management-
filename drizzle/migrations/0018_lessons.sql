CREATE TABLE `lesson_progress` (
	`user_id` varchar(36) NOT NULL,
	`course_id` varchar(40) NOT NULL,
	`lesson_id` varchar(40) NOT NULL,
	`completed_at` datetime NOT NULL,
	CONSTRAINT `lesson_progress_user_id_course_id_lesson_id_pk` PRIMARY KEY(`user_id`,`course_id`,`lesson_id`)
);
