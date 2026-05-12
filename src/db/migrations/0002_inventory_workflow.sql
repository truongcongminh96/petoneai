CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `phone` text,
  `email` text,
  `address` text,
  `note` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `suppliers_name_unique` ON `suppliers` (`name`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `supplier_id` integer,
  `invoice_no` text,
  `purchase_date` text NOT NULL,
  `total_amount` real DEFAULT 0 NOT NULL,
  `note` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `purchase_order_items` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `purchase_order_id` integer NOT NULL,
  `product_id` integer NOT NULL,
  `quantity` integer NOT NULL,
  `unit_cost` real NOT NULL,
  `subtotal` real NOT NULL,
  FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `product_id` integer NOT NULL,
  `type` text NOT NULL,
  `quantity_change` integer NOT NULL,
  `quantity_before` integer NOT NULL,
  `quantity_after` integer NOT NULL,
  `unit_cost` real,
  `reference_type` text,
  `reference_id` integer,
  `note` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `stock_movements_product_idx` ON `stock_movements` (`product_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `stock_movements_created_at_idx` ON `stock_movements` (`created_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `local_users` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `role` text DEFAULT 'owner' NOT NULL,
  `pin` text NOT NULL,
  `active` integer DEFAULT true NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO `local_users` (`name`, `role`, `pin`, `active`)
SELECT 'Chủ shop', 'owner', '1234', true
WHERE NOT EXISTS (SELECT 1 FROM `local_users`);
--> statement-breakpoint
INSERT INTO `stock_movements` (
  `product_id`,
  `type`,
  `quantity_change`,
  `quantity_before`,
  `quantity_after`,
  `reference_type`,
  `note`
)
SELECT
  `id`,
  'opening',
  `stock_quantity`,
  0,
  `stock_quantity`,
  'migration',
  'Tồn đầu kỳ'
FROM `products`
WHERE `stock_quantity` > 0
  AND NOT EXISTS (
    SELECT 1 FROM `stock_movements`
    WHERE `stock_movements`.`product_id` = `products`.`id`
      AND `stock_movements`.`type` = 'opening'
  );
