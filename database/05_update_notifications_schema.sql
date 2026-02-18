-- 1. Modify student_id to be NULLable
ALTER TABLE notifications ALTER COLUMN student_id DROP NOT NULL;

-- 2. Modify order_id to be NULLable
ALTER TABLE notifications ALTER COLUMN order_id DROP NOT NULL;

-- 3. Add new columns if they don't exist
ALTER TABLE notifications 
    ADD COLUMN IF NOT EXISTS staff_id INT NULL,
    ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'ORDER',
    ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(10) DEFAULT 'student';

-- 4. Add constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'fk_notifications_staff') THEN
        ALTER TABLE notifications ADD CONSTRAINT fk_notifications_staff FOREIGN KEY (staff_id) REFERENCES staff(id);
    END IF;
END $$;
