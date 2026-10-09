CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`video_id` int NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorites_video_idx` UNIQUE(`video_id`)
);
--> statement-breakpoint
CREATE TABLE `play_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`video_id` int NOT NULL,
	`episode_index` int,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `play_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `play_records_video_idx` UNIQUE(`video_id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_id` varchar(64) NOT NULL,
	`source_video_id` varchar(64) NOT NULL,
	`title` varchar(512) NOT NULL,
	`source_name` varchar(128) NOT NULL,
	`cover` varchar(1024),
	`year` varchar(16),
	`total_episodes` int,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `videos_source_video_idx` UNIQUE(`source_id`,`source_video_id`)
);
--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_video_id_videos_id_fk` FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `play_records` ADD CONSTRAINT `play_records_video_id_videos_id_fk` FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE no action ON UPDATE no action;