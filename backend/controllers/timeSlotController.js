const pool = require('../config/database');
const { validationResult } = require('express-validator');

const addTimeSlot = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { start_time, end_time, max_orders } = req.body;

        // Time Validation: ensure start < end
        if (start_time >= end_time) {
            return res.status(400).json({ message: 'Start time must be before end time' });
        }

        // Check for overlaps with ACTIVE slots
        // Overlap condition: (StartA < EndB) and (EndA > StartB)
        const [existingSlots] = await pool.execute(
            `SELECT * FROM time_slots 
             WHERE is_active = TRUE 
             AND start_time < ? 
             AND end_time > ?`,
            [end_time, start_time]
        );

        if (existingSlots.length > 0) {
            return res.status(409).json({
                message: 'New slot overlaps with an existing active slot',
                conflictingSlot: existingSlots[0]
            });
        }

        // Insert
        const [result] = await pool.execute(
            'INSERT INTO time_slots (start_time, end_time, max_orders) VALUES (?, ?, ?)',
            [start_time, end_time, max_orders]
        );

        res.status(201).json({
            message: 'Time slot added successfully',
            slotId: result.insertId,
            slot: { start_time, end_time, max_orders }
        });

    } catch (error) {
        console.error('Add time slot error:', error);
        res.status(500).json({ message: 'Server error adding time slot' });
    }
};

const updateTimeSlot = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { id } = req.params;
        const { max_orders, is_active } = req.body;

        if (max_orders === undefined && is_active === undefined) {
            return res.status(400).json({ message: 'At least one field (max_orders, is_active) must be provided' });
        }

        // Build query dynamically
        let query = 'UPDATE time_slots SET ';
        const params = [];
        const updates = [];

        if (max_orders !== undefined) {
            updates.push('max_orders = ?');
            params.push(max_orders);
        }

        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active);
        }

        query += updates.join(', ') + ' WHERE slot_id = ?';
        params.push(id);

        const [result] = await pool.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Time slot not found' });
        }

        res.json({ message: 'Time slot updated successfully' });

    } catch (error) {
        console.error('Update time slot error:', error);
        res.status(500).json({ message: 'Server error updating time slot' });
    }
};

const getTimeSlots = async (req, res) => {
    try {
        const [slots] = await pool.execute('SELECT * FROM time_slots ORDER BY start_time');
        res.json(slots);
    } catch (error) {
        console.error('Get time slots error:', error);
        res.status(500).json({ message: 'Server error retrieving time slots' });
    }
};

const getAvailableTimeSlots = async (req, res) => {
    try {
        const [slots] = await pool.execute(`
            SELECT 
                slot_id, 
                start_time, 
                end_time, 
                max_orders, 
                current_orders,
                (max_orders - current_orders) as remaining_capacity
            FROM time_slots 
            WHERE is_active = TRUE 
            ORDER BY start_time
        `);

        const formattedSlots = slots.map(slot => ({
            ...slot,
            status: slot.remaining_capacity > 0 ? 'AVAILABLE' : 'FULL'
        }));

        res.json(formattedSlots);
    } catch (error) {
        console.error('Get available time slots error:', error);
        res.status(500).json({ message: 'Server error retrieving available time slots' });
    }
};

const deleteTimeSlot = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if there are orders for this slot
        const [orders] = await pool.execute(
            'SELECT COUNT(*) as count FROM orders WHERE slot_id = ?',
            [id]
        );

        if (orders[0].count > 0) {
            return res.status(400).json({
                message: 'Cannot delete time slot because it has existing orders. Try deactivating it instead.'
            });
        }

        const [result] = await pool.execute(
            'DELETE FROM time_slots WHERE slot_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Time slot not found' });
        }

        res.json({ message: 'Time slot deleted successfully' });
    } catch (error) {
        console.error('Delete time slot error:', error);
        res.status(500).json({ message: 'Server error deleting time slot' });
    }
};

const resetTimeSlotCount = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute(
            'UPDATE time_slots SET current_orders = 0 WHERE slot_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Time slot not found' });
        }

        res.json({ message: 'Time slot count reset successfully' });
    } catch (error) {
        console.error('Reset time slot count error:', error);
        res.status(500).json({ message: 'Server error resetting time slot count' });
    }
};

module.exports = {
    addTimeSlot,
    updateTimeSlot,
    getTimeSlots,
    getAvailableTimeSlots,
    resetTimeSlotCount,
    deleteTimeSlot
};
