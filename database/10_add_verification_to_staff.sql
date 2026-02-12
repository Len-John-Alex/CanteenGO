-- Add verification columns to staff table
ALTER TABLE staff ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE staff ADD COLUMN verification_code VARCHAR(10) NULL;
