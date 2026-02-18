-- Add unique constraint to menu_items.name idempotently
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_name_constraint' AND table_name = 'menu_items') THEN
        ALTER TABLE menu_items ADD CONSTRAINT unique_name_constraint UNIQUE (name);
    END IF;
END $$;
