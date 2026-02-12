-- Add unique constraint to menu_items.name
-- Run this AFTER cleaning up duplicates with cleanup-duplicates.sql

USE college_canteen;

-- Add unique constraint to prevent duplicate menu item names
ALTER TABLE menu_items 
ADD UNIQUE KEY unique_name (name);
