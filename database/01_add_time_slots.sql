CREATE TABLE IF NOT EXISTS time_slots (
    slot_id INT PRIMARY KEY AUTO_INCREMENT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_orders INT NOT NULL,
    current_orders INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_time_order CHECK (start_time < end_time),
    CONSTRAINT chk_max_orders CHECK (max_orders >= 0),
    CONSTRAINT chk_current_orders CHECK (current_orders >= 0 AND current_orders <= max_orders)
);
