-- Make existing columns nullable and add new ones
-- First, drop the foreign keys to avoid issues when modifying columns (if strictly enforced)
-- note: MySQL usually allows modifying to NULL without dropping FK, but let's be safe and just try modifying first.

-- 1. Modify student_id to be NULLable
ALTER TABLE notifications MODIFY COLUMN student_id INT NULL;

-- 2. Modify order_id to be NULLable
ALTER TABLE notifications MODIFY COLUMN order_id INT NULL;

-- 3. Add new columns
ALTER TABLE notifications 
    ADD COLUMN staff_id INT NULL,
    ADD COLUMN type VARCHAR(20) DEFAULT 'ORDER', -- ORDER, FEEDBACK, SYSTEM
    ADD COLUMN recipient_type VARCHAR(10) DEFAULT 'student', -- student, staff
    ADD CONSTRAINT fk_notifications_staff FOREIGN KEY (staff_id) REFERENCES staff(id);
