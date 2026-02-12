-- Add order_notes column to orders table
ALTER TABLE orders ADD COLUMN order_notes TEXT DEFAULT NULL AFTER total_amount;
