-- TopUpYYY MySQL Database Schema
-- Import this into your phpMyAdmin

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+06:00";

-- --------------------------------------------------------
-- Users table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) DEFAULT NULL,
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `is_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Wallets
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallets` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_wallet` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Categories
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Products
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(255) DEFAULT 'Other',
  `category_id` VARCHAR(36) DEFAULT NULL,
  `sub_category` VARCHAR(255) DEFAULT 'Top up',
  `image_url` VARCHAR(500) DEFAULT NULL,
  `custom_fields` JSON DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Packages
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `packages` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `product_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `auto_topup_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `auto_api_id` VARCHAR(36) DEFAULT NULL,
  `product_variation_name` VARCHAR(255) DEFAULT '',
  `api_tagline` VARCHAR(255) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Orders
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) DEFAULT NULL,
  `package_id` VARCHAR(36) DEFAULT NULL,
  `game_id` VARCHAR(500) NOT NULL DEFAULT '',
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'wallet',
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `delivery_message` TEXT DEFAULT NULL,
  `transaction_id` VARCHAR(255) DEFAULT NULL,
  `source_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Banners
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `banners` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `title` VARCHAR(255) DEFAULT '',
  `image_url` VARCHAR(500) NOT NULL,
  `link_url` VARCHAR(500) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Site Settings
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `key_name` VARCHAR(100) NOT NULL UNIQUE,
  `value` TEXT DEFAULT '',
  `label` VARCHAR(255) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default settings
INSERT INTO `site_settings` (`key_name`, `value`, `label`) VALUES
('site_name', 'TopUpYYY', 'Site Name'),
('notice_text', '১৮ বছরের নিচে অর্ডার করবেন না।', 'Notice Text'),
('notice_enabled', 'true', 'Notice Enabled'),
('whatsapp_number', '', 'WhatsApp Number'),
('telegram_link', '', 'Telegram Link'),
('facebook_link', '', 'Facebook Link'),
('bkash_number', '', 'bKash Number'),
('nagad_number', '', 'Nagad Number'),
('support_hours', '9AM - 12PM', 'Support Hours'),
('background_color', '', 'Background Color'),
('primary_color', '', 'Primary Color'),
('notice_color', '', 'Notice Color'),
('nav_color', '', 'Header Color'),
('footer_color', '', 'Footer Color'),
('logo_url', '', 'Logo URL'),
('favicon_url', '', 'Favicon URL'),
('meta_description', '', 'Meta Description')
ON DUPLICATE KEY UPDATE `key_name`=`key_name`;

-- --------------------------------------------------------
-- Auto APIs
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `auto_apis` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `base_url` VARCHAR(500) NOT NULL,
  `api_key` VARCHAR(500) DEFAULT '',
  `api_type` VARCHAR(50) DEFAULT 'generic',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Developer Apps (for external API)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `developer_apps` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `app_name` VARCHAR(255) DEFAULT 'API Key',
  `api_key` VARCHAR(64) NOT NULL DEFAULT (REPLACE(UUID(),'-','')),
  `callback_url` VARCHAR(500) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Transactions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `type` VARCHAR(50) DEFAULT 'deposit',
  `payment_method` VARCHAR(50) DEFAULT 'manual',
  `status` VARCHAR(50) DEFAULT 'pending',
  `metadata` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- SMS Messages
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sms_messages` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `sender` VARCHAR(50) NOT NULL DEFAULT '',
  `raw_message` TEXT NOT NULL,
  `amount` DECIMAL(10,2) DEFAULT NULL,
  `transaction_id` VARCHAR(255) DEFAULT NULL,
  `phone_number` VARCHAR(20) DEFAULT NULL,
  `sms_balance` DECIMAL(12,2) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `is_used` TINYINT(1) NOT NULL DEFAULT 0,
  `used_for_order_id` VARCHAR(36) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Profiles (additional user data)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL UNIQUE,
  `full_name` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
