CREATE TABLE `favorites` (
	`id` integer PRIMARY KEY NOT NULL,
	`video_id` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `favorites_video_idx` ON `favorites` (`video_id`);--> statement-breakpoint
CREATE TABLE `play_records` (
	`id` integer PRIMARY KEY NOT NULL,
	`video_id` integer NOT NULL,
	`episode_index` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `play_records_video_idx` ON `play_records` (`video_id`);--> statement-breakpoint
CREATE TABLE `videos` (
	`id` integer PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_video_id` text NOT NULL,
	`title` text NOT NULL,
	`source_name` text NOT NULL,
	`cover` text,
	`year` text,
	`total_episodes` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `videos_source_video_idx` ON `videos` (`source_id`,`source_video_id`);