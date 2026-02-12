-- Add is_student_hidden to orders table for soft-hide functionality
ALTER TABLE orders ADD COLUMN is_student_hidden BOOLEAN DEFAULT FALSE;
