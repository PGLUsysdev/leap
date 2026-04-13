-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               11.4.10-MariaDB - MariaDB Server
-- Server OS:                    Win64
-- HeidiSQL Version:             12.14.0.7165
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for leap_db
CREATE DATABASE IF NOT EXISTS `leap_db` /*!40100 DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci */;
USE `leap_db`;

-- Dumping structure for table leap_db.account_groups
CREATE TABLE IF NOT EXISTS `account_groups` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uacs_digit` varchar(1) NOT NULL,
  `name` varchar(255) NOT NULL,
  `normal_balance` enum('debit','credit') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_groups_uacs_digit_unique` (`uacs_digit`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.aip_entries
CREATE TABLE IF NOT EXISTS `aip_entries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` bigint(20) unsigned NOT NULL,
  `ppa_id` bigint(20) unsigned NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `expected_output` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `aip_entries_fiscal_year_id_foreign` (`fiscal_year_id`),
  KEY `aip_entries_ppa_id_foreign` (`ppa_id`),
  CONSTRAINT `aip_entries_fiscal_year_id_foreign` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`),
  CONSTRAINT `aip_entries_ppa_id_foreign` FOREIGN KEY (`ppa_id`) REFERENCES `ppas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.allotment_classes
CREATE TABLE IF NOT EXISTS `allotment_classes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `allotment_classes_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.cache
CREATE TABLE IF NOT EXISTS `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.cache_locks
CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.chart_of_accounts
CREATE TABLE IF NOT EXISTS `chart_of_accounts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `account_number` varchar(255) NOT NULL,
  `account_title` varchar(255) NOT NULL,
  `account_type` enum('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE') NOT NULL,
  `expense_class` enum('PS','MOOE','FE','CO') NOT NULL,
  `account_series` varchar(255) DEFAULT NULL,
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  `level` tinyint(4) NOT NULL DEFAULT 1,
  `is_postable` tinyint(1) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `normal_balance` enum('DEBIT','CREDIT') NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chart_of_accounts_account_number_unique` (`account_number`),
  KEY `chart_of_accounts_parent_id_foreign` (`parent_id`),
  CONSTRAINT `chart_of_accounts_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `chart_of_accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.failed_jobs
CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.fiscal_years
CREATE TABLE IF NOT EXISTS `fiscal_years` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `year` year(4) NOT NULL,
  `status` enum('active','inactive','closed') NOT NULL DEFAULT 'inactive',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fiscal_years_year_unique` (`year`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.funding_sources
CREATE TABLE IF NOT EXISTS `funding_sources` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fund_type` varchar(50) NOT NULL,
  `code` varchar(50) NOT NULL,
  `title` text NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.job_batches
CREATE TABLE IF NOT EXISTS `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.jobs
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.lgu_levels
CREATE TABLE IF NOT EXISTS `lgu_levels` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(1) NOT NULL,
  `name` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lgu_levels_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.migrations
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.office_types
CREATE TABLE IF NOT EXISTS `office_types` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(2) NOT NULL,
  `name` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `office_types_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.offices
CREATE TABLE IF NOT EXISTS `offices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sector_id` bigint(20) unsigned DEFAULT NULL,
  `lgu_level_id` bigint(20) unsigned NOT NULL,
  `office_type_id` bigint(20) unsigned NOT NULL,
  `code` varchar(3) NOT NULL,
  `name` varchar(100) NOT NULL,
  `acronym` varchar(100) DEFAULT NULL,
  `is_lee` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `offices_sector_id_foreign` (`sector_id`),
  KEY `offices_lgu_level_id_foreign` (`lgu_level_id`),
  KEY `offices_office_type_id_foreign` (`office_type_id`),
  CONSTRAINT `offices_lgu_level_id_foreign` FOREIGN KEY (`lgu_level_id`) REFERENCES `lgu_levels` (`id`),
  CONSTRAINT `offices_office_type_id_foreign` FOREIGN KEY (`office_type_id`) REFERENCES `office_types` (`id`),
  CONSTRAINT `offices_sector_id_foreign` FOREIGN KEY (`sector_id`) REFERENCES `sectors` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.password_reset_tokens
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.ppa_funding_sources
CREATE TABLE IF NOT EXISTS `ppa_funding_sources` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `aip_entry_id` bigint(20) unsigned NOT NULL,
  `funding_source_id` bigint(20) unsigned NOT NULL,
  `ps_amount` decimal(19,2) NOT NULL DEFAULT 0.00,
  `mooe_amount` decimal(19,2) NOT NULL DEFAULT 0.00,
  `fe_amount` decimal(19,2) NOT NULL DEFAULT 0.00,
  `co_amount` decimal(19,2) NOT NULL DEFAULT 0.00,
  `ccet_adaptation` decimal(19,2) NOT NULL DEFAULT 0.00,
  `ccet_mitigation` decimal(19,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ppa_funding_sources_aip_entry_id_foreign` (`aip_entry_id`),
  KEY `ppa_funding_sources_funding_source_id_foreign` (`funding_source_id`),
  CONSTRAINT `ppa_funding_sources_aip_entry_id_foreign` FOREIGN KEY (`aip_entry_id`) REFERENCES `aip_entries` (`id`),
  CONSTRAINT `ppa_funding_sources_funding_source_id_foreign` FOREIGN KEY (`funding_source_id`) REFERENCES `funding_sources` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.ppas
CREATE TABLE IF NOT EXISTS `ppas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `office_id` bigint(20) unsigned NOT NULL,
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('Program','Project','Activity','Sub-Activity') NOT NULL,
  `code_suffix` varchar(4) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ppa_unique_index` (`office_id`,`parent_id`,`code_suffix`,`type`),
  KEY `ppas_parent_id_foreign` (`parent_id`),
  CONSTRAINT `ppas_office_id_foreign` FOREIGN KEY (`office_id`) REFERENCES `offices` (`id`),
  CONSTRAINT `ppas_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `ppas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.ppmp_categories
CREATE TABLE IF NOT EXISTS `ppmp_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.ppmp_price_lists
CREATE TABLE IF NOT EXISTS `ppmp_price_lists` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `item_number` int(11) NOT NULL,
  `description` text NOT NULL,
  `unit_of_measurement` varchar(20) NOT NULL,
  `price` decimal(19,2) NOT NULL,
  `ppmp_category_id` bigint(20) unsigned NOT NULL,
  `chart_of_account_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ppmp_price_lists_item_number_unique` (`item_number`),
  KEY `ppmp_price_lists_ppmp_category_id_foreign` (`ppmp_category_id`),
  KEY `ppmp_price_lists_chart_of_account_id_foreign` (`chart_of_account_id`),
  CONSTRAINT `ppmp_price_lists_chart_of_account_id_foreign` FOREIGN KEY (`chart_of_account_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `ppmp_price_lists_ppmp_category_id_foreign` FOREIGN KEY (`ppmp_category_id`) REFERENCES `ppmp_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1050 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.ppmp_summaries
CREATE TABLE IF NOT EXISTS `ppmp_summaries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.ppmps
CREATE TABLE IF NOT EXISTS `ppmps` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `aip_entry_id` bigint(20) unsigned NOT NULL,
  `ppmp_price_list_id` bigint(20) unsigned DEFAULT NULL,
  `funding_source_id` bigint(20) unsigned NOT NULL,
  `jan_qty` decimal(19,2) NOT NULL DEFAULT 0.00,
  `jan_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `feb_qty` decimal(19,2) NOT NULL DEFAULT 0.00,
  `feb_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `mar_qty` decimal(19,2) NOT NULL DEFAULT 0.00,
  `mar_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `apr_qty` decimal(19,2) NOT NULL DEFAULT 0.00,
  `apr_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `may_qty` decimal(19,2) NOT NULL DEFAULT 0.00,
  `may_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `jun_qty` decimal(19,2) NOT NULL DEFAULT 0.00,
  `jun_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `jul_qty` decimal(19,2) NOT NULL DEFAULT 0.00,
  `jul_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `aug_qty` decimal(19,2) NOT NULL DEFAULT 0.00,
  `aug_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `sep_qty` decimal(19,2) NOT NULL DEFAULT 0.00,
  `sep_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `oct_qty` decimal(19,2) NOT NULL DEFAULT 0.00,
  `oct_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `nov_qty` decimal(19,2) NOT NULL DEFAULT 0.00,
  `nov_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `dec_qty` decimal(19,2) NOT NULL DEFAULT 0.00,
  `dec_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ppmps_aip_entry_id_ppmp_price_list_id_funding_source_id_unique` (`aip_entry_id`,`ppmp_price_list_id`,`funding_source_id`),
  KEY `ppmps_ppmp_price_list_id_foreign` (`ppmp_price_list_id`),
  KEY `ppmps_funding_source_id_foreign` (`funding_source_id`),
  CONSTRAINT `ppmps_aip_entry_id_foreign` FOREIGN KEY (`aip_entry_id`) REFERENCES `aip_entries` (`id`),
  CONSTRAINT `ppmps_funding_source_id_foreign` FOREIGN KEY (`funding_source_id`) REFERENCES `funding_sources` (`id`),
  CONSTRAINT `ppmps_ppmp_price_list_id_foreign` FOREIGN KEY (`ppmp_price_list_id`) REFERENCES `ppmp_price_lists` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.sectors
CREATE TABLE IF NOT EXISTS `sectors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(4) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sectors_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table leap_db.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `two_factor_secret` text DEFAULT NULL,
  `two_factor_recovery_codes` text DEFAULT NULL,
  `two_factor_confirmed_at` timestamp NULL DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `role` varchar(255) NOT NULL DEFAULT 'user',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `office_id` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_office_id_foreign` (`office_id`),
  CONSTRAINT `users_office_id_foreign` FOREIGN KEY (`office_id`) REFERENCES `offices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
