CREATE TABLE `ai_token_usage` (
 `id` varchar(36) NOT NULL PRIMARY KEY,
 `user_id` varchar(36),
 `feature` varchar(255) NOT NULL,
 `model` varchar(120) NOT NULL,
 `input_tokens` bigint unsigned NOT NULL,
 `output_tokens` bigint unsigned NOT NULL,
 `cache_creation_input_tokens` bigint unsigned NOT NULL,
 `cache_read_input_tokens` bigint unsigned NOT NULL,
 `server_tool_use` json NOT NULL,
 `raw_usage` json NOT NULL,
 `created_at` datetime NOT NULL,
 INDEX `ai_token_usage_time` (`created_at`),
 INDEX `ai_token_usage_user_time` (`user_id`, `created_at`)
);
