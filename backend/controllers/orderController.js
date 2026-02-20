const pool = require('../config/database');

const validateCheckout = async (req, res) => {
    try {
        const { slot_id } = req.body;

        if (!slot_id) {
            return res.status(400).json({ message: 'Time slot is required for checkout' });
        }

        // Check slot availability
        const result = await pool.query(
            'SELECT max_orders, current_orders, is_active FROM time_slots WHERE slot_id = $1',
            [slot_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Time slot not found' });
        }

        const slot = result.rows[0];

        if (!slot.is_active) {
            return res.status(400).json({ message: 'Selected time slot is no longer active' });
        }

        if (slot.current_orders >= slot.max_orders) {
            return res.status(400).json({ message: 'Slot full, choose another.' });
        }

        res.json({
            success: true,
            message: 'Slot available, proceeding to payment'
        });

    } catch (error) {
        console.error('Checkout validation error:', error);
        res.status(500).json({ message: 'Server error during checkout validation' });
    }
};

const completeOrder = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { slot_id, order_notes } = req.body;
        const student_id = req.user.id;

        if (!slot_id) {
            return res.status(400).json({ message: 'Time slot is required to complete order' });
        }

        // 1. ATOMIC UPDATE: Increment time slot count
        const result = await client.query(
            `UPDATE time_slots 
             SET current_orders = current_orders + 1 
             WHERE slot_id = $1 AND current_orders < max_orders AND is_active = TRUE`,
            [slot_id]
        );

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Time slot full or inactive. Please choose another.' });
        }

        // 2. Get cart items to create order
        const cartResult = await client.query(
            `SELECT c.menu_item_id, c.quantity, m.price 
             FROM cart_items c 
             JOIN menu_items m ON c.menu_item_id = m.id 
             WHERE c.student_id = $1`,
            [student_id]
        );
        const cartItems = cartResult.rows;

        if (cartItems.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // 3. Create Order
        const orderResult = await client.query(
            "INSERT INTO orders (student_id, slot_id, total_amount, order_notes, status) VALUES ($1, $2, $3, $4, 'PAID') RETURNING id",
            [student_id, slot_id, totalAmount, order_notes || null]
        );

        const orderId = orderResult.rows[0].id;

        // 4. Create Order Items
        for (const item of cartItems) {
            await client.query(
                'INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order) VALUES ($1, $2, $3, $4)',
                [orderId, item.menu_item_id, item.quantity, item.price]
            );
        }

        // 5. Update Menu Item Stock
        for (const item of cartItems) {
            await client.query(
                'UPDATE menu_items SET quantity = quantity - $1 WHERE id = $2',
                [item.quantity, item.menu_item_id]
            );
        }

        // 6. Clear Cart
        await client.query('DELETE FROM cart_items WHERE student_id = $1', [student_id]);

        // 7. Notify Student about order placement
        try {
            await client.query(
                "INSERT INTO notifications (student_id, staff_id, order_id, message, type, recipient_type) VALUES ($1, NULL, $2, $3, 'ORDER', 'student')",
                [student_id, orderId, `Order #${orderId} placed successfully! Thank you for choosing CanteenGO.`]
            );
        } catch (studentNotifError) {
            console.error('Error sending student notification:', studentNotifError);
        }

        // 8. Notify All Staff about new order
        try {
            // Get student name for the notification
            const studentResult = await client.query(
                'SELECT name FROM students WHERE id = $1',
                [student_id]
            );
            const studentName = studentResult.rows.length > 0 ? studentResult.rows[0].name : 'A student';

            // Get all staff members
            const staffResult = await client.query('SELECT id FROM staff');
            const staffMembers = staffResult.rows;

            // Create notification for each staff member
            const notificationMessage = `New order #${orderId} received from ${studentName}!`;
            for (const staff of staffMembers) {
                await client.query(
                    "INSERT INTO notifications (student_id, staff_id, order_id, message, type, recipient_type) VALUES ($1, $2, $3, $4, 'ORDER', 'staff')",
                    [student_id, staff.id, orderId, notificationMessage]
                );
            }
        } catch (notifError) {
            // Log but don't fail the order if notification fails
            console.error('Error sending staff notifications:', notifError);
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Order completed successfully',
            orderId: orderId
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Order completion error:', error);
        res.status(500).json({ message: 'Server error during order completion' });
    } finally {
        client.release();
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { slot_id } = req.body;

        if (!slot_id) {
            return res.status(400).json({ message: 'Time slot is required to cancel' });
        }

        // ATOMIC UPDATE: Decrement only if above zero
        const result = await pool.query(
            `UPDATE time_slots 
             SET current_orders = GREATEST(0, current_orders - 1) 
             WHERE slot_id = $1 AND current_orders > 0`,
            [slot_id]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({
                message: 'Could not decrease order count (already at zero or slot missing)'
            });
        }

        res.json({
            success: true,
            message: 'Order cancelled successfully and slot capacity restored'
        });

    } catch (error) {
        console.error('Order cancellation error:', error);
        res.status(500).json({ message: 'Server error during order cancellation' });
    }
};

const getOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId, role } = req.user;

        // Fetch order with time slot info
        let query = `SELECT o.*, ts.start_time, ts.end_time, s.student_id as student_identifier
                     FROM orders o 
                     JOIN time_slots ts ON o.slot_id = ts.slot_id 
                     JOIN students s ON o.student_id = s.id
                     WHERE o.id = $1`;
        let params = [id];

        // Only enforce ownership if the user is a student
        if (role === 'student') {
            query += ' AND o.student_id = $2';
            params.push(userId);
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = result.rows[0];

        // Fetch order items
        const itemsResult = await pool.query(
            `SELECT oi.*, m.name 
             FROM order_items oi 
             JOIN menu_items m ON oi.menu_item_id = m.id 
             WHERE oi.order_id = $1`,
            [id]
        );

        res.json({
            ...order,
            items: itemsResult.rows
        });

    } catch (error) {
        console.error('Fetch order error:', error);
        res.status(500).json({ message: 'Server error fetching order details' });
    }
};

const getStudentOrders = async (req, res) => {
    try {
        const studentId = req.user.id;

        const result = await pool.query(
            `SELECT o.*, ts.start_time, ts.end_time 
             FROM orders o 
             JOIN time_slots ts ON o.slot_id = ts.slot_id 
             WHERE o.student_id = $1 AND o.is_student_hidden = FALSE
             ORDER BY o.created_at DESC`,
            [studentId]
        );
        const orders = result.rows;

        const ordersWithItems = [];
        for (const order of orders) {
            const itemsResult = await pool.query(
                `SELECT oi.*, m.name 
                 FROM order_items oi 
                 JOIN menu_items m ON oi.menu_item_id = m.id 
                 WHERE oi.order_id = $1`,
                [order.id]
            );
            ordersWithItems.push({ ...order, items: itemsResult.rows });
        }

        res.json(ordersWithItems);
    } catch (error) {
        console.error('Fetch student orders error:', error);
        res.status(500).json({ message: 'Server error fetching your orders' });
    }
};

const getStaffOrders = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT o.*, s.name as student_name, ts.start_time, ts.end_time 
            FROM orders o 
            JOIN students s ON o.student_id = s.id 
            JOIN time_slots ts ON o.slot_id = ts.slot_id
        `;
        const queryParams = [];

        if (status) {
            let dbStatus;
            switch (status.toLowerCase()) {
                case 'pending':
                    dbStatus = 'PAID';
                    break;
                case 'preparing':
                    dbStatus = 'PREPARING';
                    break;
                case 'ready':
                    dbStatus = 'READY';
                    break;
                case 'completed':
                    dbStatus = 'COMPLETED';
                    break;
                default:
                    // If staff sends "PAID", "PREPARING", etc directly
                    const validStatuses = ['PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
                    if (validStatuses.includes(status.toUpperCase())) {
                        dbStatus = status.toUpperCase();
                    } else {
                        return res.status(400).json({ message: 'Invalid status filter' });
                    }
            }
            query += ' WHERE o.status = $1';
            queryParams.push(dbStatus);
        }

        query += ' ORDER BY ts.start_time ASC';

        const result = await pool.query(query, queryParams);
        const orders = result.rows;

        const ordersWithItems = [];
        for (const order of orders) {
            const itemsResult = await pool.query(
                `SELECT oi.*, m.name 
                 FROM order_items oi 
                 JOIN menu_items m ON oi.menu_item_id = m.id 
                 WHERE oi.order_id = $1`,
                [order.id]
            );
            ordersWithItems.push({ ...order, items: itemsResult.rows });
        }

        res.json(ordersWithItems);

    } catch (error) {
        console.error('Fetch staff orders error:', error);
        res.status(500).json({ message: 'Server error fetching orders' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['PAID', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2',
            [status, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Trigger notification for status changes
        const studentStatuses = ['PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
        if (studentStatuses.includes(status)) {
            const orderInfoResult = await pool.query(
                'SELECT student_id FROM orders WHERE id = $1',
                [id]
            );

            if (orderInfoResult.rows.length > 0) {
                const studentId = orderInfoResult.rows[0].student_id;
                let message = '';

                switch (status) {
                    case 'PREPARING':
                        message = `Your order #${id} is now being prepared!`;
                        break;
                    case 'READY':
                        message = `Your order #${id} is READY for pickup!`;
                        break;
                    case 'COMPLETED':
                        message = `Your order #${id} has been COMPLETED. Enjoy your meal!`;
                        break;
                    case 'CANCELLED':
                        message = `Your order #${id} has been CANCELLED.`;
                        break;
                }

                if (message) {
                    await pool.query(
                        "INSERT INTO notifications (student_id, staff_id, order_id, message, type, recipient_type) VALUES ($1, NULL, $2, $3, 'ORDER', 'student')",
                        [studentId, id, message]
                    );
                }
            }
        }

        res.json({ success: true, message: `Order status updated to ${status}` });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Server error updating status' });
    }
};

const getRevenueStats = async (req, res) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const targetYear = year || now.getFullYear();
        const isYearly = !month || month === 'all';
        const targetMonth = isYearly ? null : month;

        // PostgreSQL uses EXTRACT(YEAR FROM ...) instead of YEAR(...)
        let statsQuery = `
            SELECT COUNT(*) as "totalOrders", SUM(total_amount) as "totalRevenue" 
            FROM orders 
            WHERE status IN ('PAID', 'PREPARING', 'READY', 'COMPLETED') 
            AND EXTRACT(YEAR FROM created_at) = $1
        `;
        const statsParams = [targetYear];

        if (!isYearly) {
            statsQuery += ' AND EXTRACT(MONTH FROM created_at) = $2';
            statsParams.push(targetMonth);
        }

        const statsResult = await pool.query(statsQuery, statsParams);
        const stats = statsResult.rows[0];

        let mostSoldQuery = `
            SELECT m.name, SUM(oi.quantity) as "totalQuantity"
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE o.status IN ('PAID', 'PREPARING', 'READY', 'COMPLETED')
            AND EXTRACT(YEAR FROM o.created_at) = $1
        `;
        const mostSoldParams = [targetYear];

        if (!isYearly) {
            mostSoldQuery += ' AND EXTRACT(MONTH FROM o.created_at) = $2';
            mostSoldParams.push(targetMonth);
        }

        mostSoldQuery += `
            GROUP BY m.id, m.name
            ORDER BY "totalQuantity" DESC
            LIMIT 1
        `;

        const mostSoldResult = await pool.query(mostSoldQuery, mostSoldParams);
        const mostSold = mostSoldResult.rows;

        // --- BREAKDOWN DATA ---
        let breakdownQuery = '';
        const breakdownParams = [targetYear];

        if (!isYearly) {
            breakdownQuery = `
                SELECT EXTRACT(DAY FROM created_at) as label, SUM(total_amount) as value
                FROM orders
                WHERE status IN ('PAID', 'PREPARING', 'READY', 'COMPLETED')
                AND EXTRACT(YEAR FROM created_at) = $1 AND EXTRACT(MONTH FROM created_at) = $2
                GROUP BY EXTRACT(DAY FROM created_at)
                ORDER BY label ASC
            `;
            breakdownParams.push(targetMonth);
        } else {
            breakdownQuery = `
                SELECT EXTRACT(MONTH FROM created_at) as label, SUM(total_amount) as value
                FROM orders
                WHERE status IN ('PAID', 'PREPARING', 'READY', 'COMPLETED')
                AND EXTRACT(YEAR FROM created_at) = $1
                GROUP BY EXTRACT(MONTH FROM created_at)
                ORDER BY label ASC
            `;
        }

        const breakdownResult = await pool.query(breakdownQuery, breakdownParams);

        res.json({
            month: isYearly ? 'all' : targetMonth,
            year: targetYear,
            totalOrders: parseInt(stats.totalOrders || 0),
            totalRevenue: parseFloat(stats.totalRevenue || 0),
            mostSoldItem: mostSold.length > 0 ? mostSold[0] : null,
            breakdown: breakdownResult.rows.map(item => ({
                label: parseInt(item.label),
                value: parseFloat(item.value || 0)
            }))
        });

    } catch (error) {
        console.error('Revenue stats error:', error);
        res.status(500).json({ message: 'Server error fetching revenue stats' });
    }
};

const getStudentSpending = async (req, res) => {
    try {
        const studentId = req.user.id;
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // Daily Spending - PostgreSQL uses CURRENT_DATE
        const dailyResult = await pool.query(
            `SELECT SUM(total_amount) as "dailyTotal" 
             FROM orders 
             WHERE student_id = $1 
             AND status IN ('PAID', 'PREPARING', 'READY', 'COMPLETED')
             AND created_at::date = CURRENT_DATE`,
            [studentId]
        );

        // Monthly Spending
        const monthlyResult = await pool.query(
            `SELECT SUM(total_amount) as "monthlyTotal" 
             FROM orders 
             WHERE student_id = $1 
             AND status IN ('PAID', 'PREPARING', 'READY', 'COMPLETED')
             AND EXTRACT(YEAR FROM created_at) = $2 AND EXTRACT(MONTH FROM created_at) = $3`,
            [studentId, year, month]
        );

        res.json({
            dailySpending: parseFloat(dailyResult.rows[0].dailyTotal || 0),
            monthlySpending: parseFloat(monthlyResult.rows[0].monthlyTotal || 0)
        });

    } catch (error) {
        console.error('Fetch student spending error:', error);
        res.status(500).json({ message: 'Server error fetching spending stats' });
    }
};

const hideOrderForStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user.id;

        const result = await pool.query(
            'UPDATE orders SET is_student_hidden = TRUE WHERE id = $1 AND student_id = $2',
            [id, studentId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Order not found or not authorized' });
        }

        res.json({ success: true, message: 'Order hidden from your history' });
    } catch (error) {
        console.error('Hide order error:', error);
        res.status(500).json({ message: 'Server error hiding order' });
    }
};

module.exports = {
    validateCheckout,
    completeOrder,
    cancelOrder,
    getOrderDetails,
    getStudentOrders,
    getStaffOrders,
    updateOrderStatus,
    getRevenueStats,
    getStudentSpending,
    hideOrderForStudent
};
