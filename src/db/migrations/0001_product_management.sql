-- Migration: 0001 - Full product management schema
-- Drop old tables and recreate with new schema

DROP TABLE IF EXISTS `sale_items`;
--> statement-breakpoint
DROP TABLE IF EXISTS `sales`;
--> statement-breakpoint
DROP TABLE IF EXISTS `expenses`;
--> statement-breakpoint
DROP TABLE IF EXISTS `products`;
--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_categories_name_unique` ON `product_categories` (`name`);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`barcode` text,
	`category_id` integer,
	`brand` text,
	`cost_price` real DEFAULT 0 NOT NULL,
	`selling_price` real DEFAULT 0 NOT NULL,
	`stock_quantity` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 5 NOT NULL,
	`unit` text DEFAULT 'cái',
	`description` text,
	`track_batch` integer DEFAULT false NOT NULL,
	`allow_direct_sale` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`total_amount` real NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` real NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO `product_categories` (`name`) VALUES
	('Thức ăn'),
	('Phụ kiện'),
	('Thuốc & Vitamin'),
	('Đồ chơi'),
	('Vệ sinh'),
	('Dịch vụ');
