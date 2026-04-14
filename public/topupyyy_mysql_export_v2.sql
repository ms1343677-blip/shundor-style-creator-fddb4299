-- MySQL export generated from Lovable Cloud data
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `auto_apis`;
CREATE TABLE `auto_apis` (
  `id` CHAR(36) NULL,
  `name` VARCHAR(255) NULL,
  `base_url` TEXT NULL,
  `api_key` TEXT NULL,
  `api_type` VARCHAR(100) NULL,
  `is_active` TINYINT(1) NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `auto_apis` (`id`, `name`, `base_url`, `api_key`, `api_type`, `is_active`, `created_at`, `updated_at`) VALUES
('bd5b903d-0904-4b73-9aa5-6462bfc88d79', 'free', 'https://topupbot.oktopupbd.com', 'qSkDiWlMDEGtzqDHfhZTttms2bjgjgsjgdTOPUP', 'humayun', 1, '2026-04-13 17:11:49.321333', NULL),
('a24a1e09-6ba4-415c-bc98-00c37534f4b0', 'LITE', 'https://botclient.gamesbazarbd.com/api/resaleorder', 'cmbyrvniq0000cas89qtm4rqn', 'freefire', 1, '2026-04-14 14:51:23.882067', '2026-04-14 14:51:23.882067');

DROP TABLE IF EXISTS `balance_tracker`;
CREATE TABLE `balance_tracker` (
  `id` CHAR(36) NULL,
  `provider` VARCHAR(100) NULL,
  `last_balance` DECIMAL(18,2) NULL,
  `total_received` DECIMAL(18,2) NULL,
  `reset_at` DATETIME(6) NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `balance_tracker` (`id`, `provider`, `last_balance`, `total_received`, `reset_at`, `created_at`, `updated_at`) VALUES
('30097a55-0c4e-40d8-891e-e0bd262b38f0', 'bKash', 642.12, 2, '2026-04-13 16:48:34.259', '2026-04-13 16:05:17.065049', '2026-04-14 15:39:38.244838'),
('600a15be-4dd6-496a-892c-24b4c2704907', 'Nagad', 238.14, 69, '2026-04-13 16:48:35.787', '2026-04-13 16:05:17.065049', '2026-04-14 14:03:41.60766');

DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners` (
  `id` CHAR(36) NULL,
  `title` VARCHAR(255) NULL,
  `image_url` TEXT NULL,
  `link_url` TEXT NULL,
  `sort_order` INT NULL,
  `is_active` TINYINT(1) NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `banners` (`id`, `title`, `image_url`, `link_url`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
('1f8b9801-c163-4452-bf4f-afaa42020827', 'tast', 'https://admin.rgbazer.com/banners/1772818681.jpg', 'https://admin.rgbazer.com/banners/1772818681.jpg', 1, 1, '2026-04-13 14:25:06.105268', '2026-04-13 14:25:06.105268');

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` CHAR(36) NULL,
  `name` VARCHAR(255) NULL,
  `image_url` TEXT NULL,
  `sort_order` INT NULL,
  `is_active` TINYINT(1) NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `categories` (`id`, `name`, `image_url`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
('cf6fb18a-53e8-4f72-8837-d01251fe1faa', 'Free', NULL, NULL, 1, '2026-04-13 14:58:43.644109', '2026-04-13 15:10:19.023728');

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` CHAR(36) NULL,
  `name` VARCHAR(255) NULL,
  `category` VARCHAR(255) NULL,
  `sub_category` VARCHAR(255) NULL,
  `category_id` CHAR(36) NULL,
  `image_url` TEXT NULL,
  `custom_fields` LONGTEXT NULL,
  `sort_order` INT NULL,
  `is_active` TINYINT(1) NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `products` (`id`, `name`, `category`, `sub_category`, `category_id`, `image_url`, `custom_fields`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
('bc6cf142-3616-4045-8760-73e732b30d54', 'Free', 'Free', 'Top', NULL, 'https://admin.rgbazer.com/products/1772817289.jpg', '["{\\"key\\":\\"uid\\",\\"label\\":\\"এখানে", "গেমের", "আইডি", "দিন\\",\\"placeholder\\":\\"গেম", "আইডি\\"}"]', NULL, 1, '2026-04-12 11:42:15.262835', NULL),
(NULL, NULL, 'tast', NULL, 'cf6fb18a-53e8-4f72-8837-d01251fe1faa', NULL, '[{"key": "game_id", "label": "এখানে", "গেমের আইডি দিন placeholder": "গেম", "আইডি]] id": "4e7ff19d-c7af-4478-a606-fb31e0654d61", "image_url": "https://admin.rgbazer.com/products/1772817579.jpg", "is_active": true, "name": "Unipin", "Voucher (BD) sort_order": 2, "sub_category": "Top", "up updated_at": "2026-04-13T15:00:17.024679+00:00"}, {"category": "Free", "Fire category_id": "cf6fb18a-53e8-4f72-8837-d01251fe1faa", "created_at": "2026-04-13T14:51:54.788578+00:00", "custom_fields": ["{\\"key\\":\\"account_info\\",\\"label\\":\\"এখানে", "গেমের", "আইডি", "দিন\\",\\"placeholder\\":\\"গেম", "আইডি\\"}"], "id": "b8b8cd49-77e9-481e-8736-a60c6a71d287", "image_url": "https://admin.rgbazer.com/products/1772820023.jpg", "is_active": true, "name": "Weekly&Monthly", "sort_order": 3, "sub_category": "Top", "up updated_at": "2026-04-14T15:30:35.380206+00:00"}]', NULL, NULL, '2026-04-13 14:51:20.752832', NULL);

DROP TABLE IF EXISTS `packages`;
CREATE TABLE `packages` (
  `id` CHAR(36) NULL,
  `product_id` CHAR(36) NULL,
  `auto_api_id` CHAR(36) NULL,
  `name` VARCHAR(255) NULL,
  `product_variation_name` VARCHAR(255) NULL,
  `price` DECIMAL(18,2) NULL,
  `sort_order` INT NULL,
  `is_active` TINYINT(1) NULL,
  `auto_topup_enabled` TINYINT(1) NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `packages` (`id`, `product_id`, `auto_api_id`, `name`, `product_variation_name`, `price`, `sort_order`, `is_active`, `auto_topup_enabled`, `created_at`, `updated_at`) VALUES
('a08e754a-3171-4ca7-bbbd-4203367ed157', 'bc6cf142-3616-4045-8760-73e732b30d54', 'bd5b903d-0904-4b73-9aa5-6462bfc88d79', 25, 25, 50, NULL, 1, 1, '2026-04-12 11:42:48.893626', '2026-04-13 17:13:02.529073'),
('535572cd-b86a-4fb6-960e-bb89ecbf9380', 'bc6cf142-3616-4045-8760-73e732b30d54', NULL, 'LITE', 'LITE', 10, 2, 1, 1, '2026-04-14 14:35:49.341298', '2026-04-14 14:50:20.544073'),
('b0493877-425e-4592-b6fd-b5e735cd6a3b', 'b8b8cd49-77e9-481e-8736-a60c6a71d287', 'a24a1e09-6ba4-415c-bc98-00c37534f4b0', 'LITE', 'LITE', 10, 1, 1, 1, '2026-04-14 15:30:19.154636', '2026-04-14 15:36:22.010843');

DROP TABLE IF EXISTS `profiles`;
CREATE TABLE `profiles` (
  `id` CHAR(36) NULL,
  `user_id` CHAR(36) NULL,
  `email` VARCHAR(255) NULL,
  `full_name` VARCHAR(255) NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `site_settings`;
CREATE TABLE `site_settings` (
  `id` CHAR(36) NULL,
  `key` VARCHAR(255) NULL,
  `label` VARCHAR(255) NULL,
  `value` LONGTEXT NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sms_webhooks`;
CREATE TABLE `sms_webhooks` (
  `id` CHAR(36) NULL,
  `token` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `wallets`;
CREATE TABLE `wallets` (
  `id` CHAR(36) NULL,
  `user_id` CHAR(36) NULL,
  `balance` DECIMAL(18,2) NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` CHAR(36) NULL,
  `user_id` CHAR(36) NULL,
  `amount` DECIMAL(18,2) NULL,
  `type` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `payment_method` VARCHAR(100) NULL,
  `uddoktapay_invoice_id` VARCHAR(255) NULL,
  `metadata` LONGTEXT NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` CHAR(36) NULL,
  `user_id` CHAR(36) NULL,
  `product_id` CHAR(36) NULL,
  `package_id` CHAR(36) NULL,
  `game_id` VARCHAR(255) NULL,
  `amount` DECIMAL(18,2) NULL,
  `payment_method` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transaction_id` VARCHAR(255) NULL,
  `delivery_message` TEXT NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `orders` (`id`, `user_id`, `product_id`, `package_id`, `game_id`, `amount`, `payment_method`, `status`, `transaction_id`, `delivery_message`, `created_at`, `updated_at`) VALUES
('ef90845e-b71e-4553-96c6-df7eab1bd157', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', 'a08e754a-3171-4ca7-bbbd-4203367ed157', 57475849845, 50, 'wallet', 'completed', NULL, NULL, '2026-04-13 09:55:52.315573', '2026-04-13 09:56:19.615467'),
('75107cfd-1996-4191-b52f-7a9f754536b4', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', 'a08e754a-3171-4ca7-bbbd-4203367ed157', 3524544, 50, 'wallet', 'cancelled', NULL, NULL, '2026-04-13 14:16:40.288027', '2026-04-13 15:02:52.842997'),
('6f57ba4e-a3e6-49e0-9788-0daf77113a6f', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', 'a08e754a-3171-4ca7-bbbd-4203367ed157', 65744114, 50, 'wallet', 'completed', NULL, NULL, '2026-04-13 14:27:53.699989', '2026-04-13 15:02:54.740488'),
('37ee222f-04f8-4127-8ff4-53f0846f0278', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', 'a08e754a-3171-4ca7-bbbd-4203367ed157', 2452421, 50, 'wallet', 'completed', NULL, NULL, '2026-04-13 15:21:28.401071', '2026-04-13 17:25:22.844937'),
('05033a3b-88c1-42f3-b61c-6bdad6394da0', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', 'a08e754a-3171-4ca7-bbbd-4203367ed157', 102030506, 50, 'wallet', 'completed', NULL, NULL, '2026-04-13 17:13:45.6355', '2026-04-13 17:25:21.530114'),
('48d96b61-32a6-4a70-8cd8-fc8149616b89', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', 'a08e754a-3171-4ca7-bbbd-4203367ed157', 102030506, 50, 'wallet', 'processing', NULL, NULL, '2026-04-13 17:15:59.338854', '2026-04-13 17:16:03.216981'),
('45aa76a0-d3a2-4366-b9d6-df5baad6b099', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', 'a08e754a-3171-4ca7-bbbd-4203367ed157', 102030506, 50, 'wallet', 'processing', NULL, NULL, '2026-04-13 17:30:06.915006', '2026-04-13 17:30:11.290564'),
('81896baa-8f65-45c8-b547-5119f875f5c1', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', 'a08e754a-3171-4ca7-bbbd-4203367ed157', 102030506, 50, 'wallet', 'processing', NULL, NULL, '2026-04-13 17:35:45.485758', '2026-04-13 17:35:50.558663'),
('fd494406-8b10-465e-acd4-53b0055f4b98', 'b3efbeca-fe8e-480d-8c89-f3a0b302cb8f', 'bc6cf142-3616-4045-8760-73e732b30d54', 'a08e754a-3171-4ca7-bbbd-4203367ed157', NULL, 50, 'wallet', 'cancelled', NULL, 'Invalid', '2026-04-13 17:51:34.384475', '2026-04-13 17:51:56.778485'),
('2daa0243-6704-4220-9434-24968e0c7155', '53e29662-4a8e-41b4-bec2-0e020d91b815', 'bc6cf142-3616-4045-8760-73e732b30d54', 'a08e754a-3171-4ca7-bbbd-4203367ed157', NULL, 50, 'wallet', 'cancelled', NULL, 'Invalid', '2026-04-14 09:23:22.87213', '2026-04-14 09:23:47.413412'),
('e57932e1-acdf-4d10-918e-51e0e10d5764', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', '535572cd-b86a-4fb6-960e-bb89ecbf9380', 102030506, 10, 'wallet', 'pending', NULL, NULL, '2026-04-14 14:36:05.42027', '2026-04-14 14:41:02.043665'),
('872aea06-d5b6-4365-b237-45b29a1f4cdb', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', '535572cd-b86a-4fb6-960e-bb89ecbf9380', 102030506, 10, 'wallet', 'pending', NULL, NULL, '2026-04-14 14:39:37.073982', '2026-04-14 14:39:41.535786'),
('3ce87ad9-dff3-47ed-a7e2-dfb0ca5f186b', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', '535572cd-b86a-4fb6-960e-bb89ecbf9380', 10203050, 10, 'wallet', 'pending', NULL, NULL, '2026-04-14 14:52:23.59292', '2026-04-14 14:52:23.59292'),
('4a1e22b7-f0b3-4719-ac05-7ff2092674e4', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', '535572cd-b86a-4fb6-960e-bb89ecbf9380', 102030506, 10, 'wallet', 'pending', NULL, NULL, '2026-04-14 15:10:05.631066', '2026-04-14 15:10:05.631066'),
('1a8aab89-d572-42cb-a2d6-e527272407ac', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', 'a08e754a-3171-4ca7-bbbd-4203367ed157', 50607080, 50, 'wallet', 'pending', NULL, NULL, '2026-04-14 15:20:37.684021', '2026-04-14 15:20:37.684021'),
('c616e931-8047-4f35-a657-b1f87f3c73e7', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', 'a08e754a-3171-4ca7-bbbd-4203367ed157', 50607080, 50, 'wallet', 'pending', NULL, NULL, '2026-04-14 15:20:37.710639', '2026-04-14 15:20:37.710639'),
('2cc1ded3-1c2e-42d6-8930-1bcd34d98177', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', 'a08e754a-3171-4ca7-bbbd-4203367ed157', NULL, 50, 'wallet', 'cancelled', NULL, 'Invalid', '2026-04-14 15:22:42.279916', '2026-04-14 15:23:06.087413'),
('a23ef86f-99fc-4c85-9ef3-776eef20588b', '53e29662-4a8e-41b4-bec2-0e020d91b815', 'bc6cf142-3616-4045-8760-73e732b30d54', '535572cd-b86a-4fb6-960e-bb89ecbf9380', 50607080, 10, 'wallet', 'pending', NULL, NULL, '2026-04-14 15:27:03.410332', '2026-04-14 15:27:03.410332'),
('4b52f6f8-9a0f-4f34-a5e7-07b133c3f597', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', '535572cd-b86a-4fb6-960e-bb89ecbf9380', 50607080, 10, 'wallet', 'pending', NULL, NULL, '2026-04-14 15:28:01.166696', '2026-04-14 15:28:01.166696'),
('c6332488-e06a-4b61-8de0-af983d110a85', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'bc6cf142-3616-4045-8760-73e732b30d54', '535572cd-b86a-4fb6-960e-bb89ecbf9380', 50607080, 10, 'wallet', 'pending', NULL, NULL, '2026-04-14 15:28:46.228651', '2026-04-14 15:28:46.228651'),
('8cef567d-3f5f-4996-9464-64e627d63e1c', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'b8b8cd49-77e9-481e-8736-a60c6a71d287', 'b0493877-425e-4592-b6fd-b5e735cd6a3b', 50607080, 10, 'wallet', 'completed', NULL, NULL, '2026-04-14 15:36:40.240073', '2026-04-14 15:41:25.954994'),
('2566353d-c568-487d-a65e-c507eaadc0e9', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'b8b8cd49-77e9-481e-8736-a60c6a71d287', 'b0493877-425e-4592-b6fd-b5e735cd6a3b', 50607080, 10, 'wallet', 'processing', NULL, NULL, '2026-04-14 15:46:36.171429', '2026-04-14 15:46:40.359317'),
('1cc70aef-d0dc-47cf-9272-29dd518f2ee7', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'b8b8cd49-77e9-481e-8736-a60c6a71d287', 'b0493877-425e-4592-b6fd-b5e735cd6a3b', NULL, 10, 'wallet', 'cancelled', NULL, 'Invalid', '2026-04-14 15:49:26.96441', '2026-04-14 15:49:43.718753'),
('39443b60-1c69-4453-a50a-45105a4001d7', '9defcf53-cfb1-45da-8f7b-d8f5b1a2ebb6', 'b8b8cd49-77e9-481e-8736-a60c6a71d287', 'b0493877-425e-4592-b6fd-b5e735cd6a3b', NULL, 10, 'wallet', 'cancelled', NULL, 'Invalid', '2026-04-14 15:53:29.508072', '2026-04-14 15:53:44.451376'),
('43aa6393-3347-4fec-97f5-e0edb92fae79', 'b3efbeca-fe8e-480d-8c89-f3a0b302cb8f', 'b8b8cd49-77e9-481e-8736-a60c6a71d287', 'b0493877-425e-4592-b6fd-b5e735cd6a3b', NULL, 10, 'wallet', 'cancelled', NULL, 'Invalid', '2026-04-14 15:58:24.873663', '2026-04-14 15:58:37.784649'),
('7838418d-8fa2-45f9-bf1c-277186c9c261', 'b3efbeca-fe8e-480d-8c89-f3a0b302cb8f', 'b8b8cd49-77e9-481e-8736-a60c6a71d287', 'b0493877-425e-4592-b6fd-b5e735cd6a3b', 8428216803, 10, 'wallet', 'completed', NULL, NULL, '2026-04-14 16:00:09.846228', '2026-04-14 16:00:17.604064');

DROP TABLE IF EXISTS `sms_messages`;
CREATE TABLE `sms_messages` (
  `id` CHAR(36) NULL,
  `webhook_id` CHAR(36) NULL,
  `sender` VARCHAR(255) NULL,
  `phone_number` VARCHAR(50) NULL,
  `raw_message` LONGTEXT NULL,
  `transaction_id` VARCHAR(255) NULL,
  `amount` DECIMAL(18,2) NULL,
  `sms_balance` DECIMAL(18,2) NULL,
  `status` VARCHAR(100) NULL,
  `is_used` TINYINT(1) NULL,
  `used_for_order_id` CHAR(36) NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `payment_history`;
CREATE TABLE `payment_history` (
  `id` CHAR(36) NULL,
  `user_id` CHAR(36) NULL,
  `order_id` CHAR(36) NULL,
  `sms_message_id` CHAR(36) NULL,
  `sender` VARCHAR(255) NULL,
  `phone_number` VARCHAR(50) NULL,
  `amount` DECIMAL(18,2) NULL,
  `payment_type` VARCHAR(100) NULL,
  `transaction_id` VARCHAR(255) NULL,
  `raw_message` LONGTEXT NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE `user_roles` (
  `id` CHAR(36) NULL,
  `user_id` CHAR(36) NULL,
  `role` VARCHAR(50) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
