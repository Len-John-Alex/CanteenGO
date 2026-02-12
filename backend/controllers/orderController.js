const pool = require('../config/database');

const validateCheckout = async (req, res) => {
    try {
        const { slot_id } = req.body;

        if (!slot_id) {
            return res.status(400).json({ message: 'Time slot is required for checkout' });
        }

        // Check slot availability
        const [slots] = await pool.execute(
            'SELECT max_orders, current_orders, is_active FROM time_slots WHERE slot_id = ?',
            [slot_id]
        );

        if (slots.length === 0) {
            return res.status(404).json({ message: 'Time slot not found' });
        }

        const slot = slots[0];

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
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { slot_id, order_notes } = req.body;
        const student_id = req.user.id;

        if (!slot_id) {
            return res.status(400).json({ message: 'Time slot is required to complete order' });
        }

        // 1. ATOMIC UPDATE: Increment time slot count
        const [result] = await connection.execute(
            `UPDATE time_slots 
             SET current_orders = current_orders + 1 
             WHERE slot_id = ? AND current_orders < max_orders AND is_active = TRUE`,
            [slot_id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Time slot full or inactive. Please choose another.' });
        }

        // 2. Get cart items to create order
        const [cartItems] = await connection.execute(
            `SELECT c.menu_item_id, c.quantity, m.price 
             FROM cart_items c 
             JOIN menu_items m ON c.menu_item_id = m.id 
             WHERE c.student_id = ?`,
            [student_id]
        );

        if (cartItems.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // 3. Create Order
        const [orderResult] = await connection.execute(
            'INSERT INTO orders (student_id, slot_id, total_amount, order_notes, status) VALUES (?, ?, ?, ?, "PAID")',
            [student_id, slot_id, totalAmount, order_notes || null]
        );

        const orderId = orderResult.insertId;

        // 4. Create Order Items
        for (const item of cartItems) {
            await connection.execute(
                'INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order) VALUES (?, ?, ?, ?)',
                [orderId, item.menu_item_id, item.quantity, item.price]
            );
        }

        // 5. Update Menu Item Stock
        for (const item of cartItems) {
            await connection.execute(
                'UPDATE menu_items SET quantity = quantity - ? WHERE id = ?',
                [item.quantity, item.menu_item_id]
            );
        }

        // 6. Clear Cart
        await connection.execute('DELETE FROM cart_items WHERE student_id = ?', [student_id]);

        // 6. Notify All Staff about new order
        try {
            // Get student name for the notification
            const [studentData] = await connection.execute(
                'SELECT name FROM students WHERE id = ?',
                [student_id]
            );
            const studentName = studentData.length > 0 ? studentData[0].name : 'A student';

            // Get all staff members
            const [staffMembers] = await connection.execute('SELECT id FROM staff');

            // Create notification for each staff member
            const notificationMessage = `New order #${orderId} received from ${studentName}!`;
            for (const staff of staffMembers) {
                await connection.execute(
                    'INSERT INTO notifications (student_id, staff_id, order_id, message, type, recipient_type) VALUES (?, ?, ?, ?, "ORDER", "staff")',
                    [student_id, staff.id, orderId, notificationMessage]
                );
            }
        } catch (notifError) {
            // Log but don't fail the order if notification fails
            console.error('Error sending staff notifications:', notifError);
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Order completed successfully',
            orderId: orderId
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Order completion error:', error);
        res.status(500).json({ message: 'Server error during order completion' });
    } finally {
        if (connection) connection.release();
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { slot_id } = req.body;

        if (!slot_id) {
            return res.status(400).json({ message: 'Time slot is required to cancel' });
        }

        // ATOMIC UPDATE: Decrement only if above zero
        const [result] = await pool.execute(
            `UPDATE time_slots 
             SET current_orders = GREATEST(0, current_orders - 1) 
             WHERE slot_id = ? AND current_orders > 0`,
            [slot_id]
        );

        if (result.affectedRows === 0) {
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
                     WHERE o.id = ?`;
        let params = [id];

        // Only enforce ownership if the user is a student
        if (role === 'student') {
            query += ' AND o.student_id = ?';
            params.push(userId);
        }

        const [orders] = await pool.execute(query, params);

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orders[0];

        // Fetch order items
        const [items] = await pool.execute(
            `SELECT oi.*, m.name 
             FROM order_items oi 
             JOIN menu_items m ON oi.menu_item_id = m.id 
             WHERE oi.order_id = ?`,
            [id]
        );

        res.json({
            ...order,
            items
        });

    } catch (error) {
        console.error('Fetch order error:', error);
        res.status(500).json({ message: 'Server error fetching order details' });
    }
};

const getStudentOrders = async (req, res) => {
    try {
        const studentId = req.user.id;

        const [orders] = await pool.execute(
            `SELECT o.*, ts.start_time, ts.end_time 
             FROM orders o 
             JOIN time_slots ts ON o.slot_id = ts.slot_id 
             WHERE o.student_id = ? AND o.is_student_hidden = FALSE
             ORDER BY o.created_at DESC`,
            [studentId]
        );

        const ordersWithItems = [];
        for (const order of orders) {
            const [items] = await pool.execute(
                `SELECT oi.*, m.name 
                 FROM order_items oi 
                 JOIN menu_items m ON oi.menu_item_id = m.id 
                 WHERE oi.order_id = ?`,
                [order.id]
            );
            ordersWithItems.push({ ...order, items });
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
            query += ' WHERE o.status = ?';
            queryParams.push(dbStatus);
        }

        query += ' ORDER BY ts.start_time ASC';

        const [orders] = await pool.execute(query, queryParams);

        const ordersWithItems = [];
        for (const order of orders) {
            const [items] = await pool.execute(
                `SELECT oi.*, m.name 
                 FROM order_items oi 
                 JOIN menu_items m ON oi.menu_item_id = m.id 
                 WHERE oi.order_id = ?`,
                [order.id]
            );
            ordersWithItems.push({ ...order, items });
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

        const [result] = await pool.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Trigger notification for READY or COMPLETED
        if (status === 'READY' || status === 'COMPLETED') {
            const [orderInfo] = await pool.execute(
                'SELECT student_id FROM orders WHERE id = ?',
                [id]
            );

            if (orderInfo.length > 0) {
                const studentId = orderInfo[0].student_id;
                const message = status === 'READY'
                    ? `Your order #${id} is READY for pickup!`
                    : `Your order #${id} has been COMPLETED. Enjoy your meal!`;

                await pool.execute(
                    'INSERT INTO notifications (student_id, staff_id, order_id, message, type, recipient_type) VALUES (?, NULL, ?, ?, "ORDER", "student")',
                    [studentId, id, message]
                );
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

        let statsQuery = `
            SELECT COUNT(*) as totalOrders, SUM(total_amount) as totalRevenue 
            FROM orders 
            WHERE status IN ('PAID', 'PREPARING', 'READY', 'COMPLETED') 
            AND YEAR(created_at) = ?
        `;
        const statsParams = [targetYear];

        if (!isYearly) {
            statsQuery += ' AND MONTH(created_at) = ?';
            statsParams.push(targetMonth);
        }

        const [stats] = await pool.execute(statsQuery, statsParams);

        let mostSoldQuery = `
            SELECT m.name, SUM(oi.quantity) as totalQuantity
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE o.status IN ('PAID', 'PREPARING', 'READY', 'COMPLETED')
            AND YEAR(o.created_at) = ?
        `;
        const mostSoldParams = [targetYear];

        if (!isYearly) {
            mostSoldQuery += ' AND MONTH(o.created_at) = ?';
            mostSoldParams.push(targetMonth);
        }

        mostSoldQuery += `
            GROUP BY m.id
            ORDER BY totalQuantity DESC
            LIMIT 1
        `;

        const [mostSold] = await pool.execute(mostSoldQuery, mostSoldParams);

        // --- NEW: Breakdown Data for Charts ---
        let breakdownQuery = '';
        const breakdownParams = [targetYear];

        if (!isYearly) {
            // Daily breakdown for a specific month
            breakdownQuery = `
                SELECT DAY(created_at) as label, SUM(total_amount) as value
                FROM orders
                WHERE status IN ('PAID', 'PREPARING', 'READY', 'COMPLETED')
                AND YEAR(created_at) = ? AND MONTH(created_at) = ?
                GROUP BY DAY(created_at)
                ORDER BY label ASC
            `;
            breakdownParams.push(targetMonth);
        } else {
            // Monthly breakdown for a specific year
            breakdownQuery = `
                SELECT MONTH(created_at) as label, SUM(total_amount) as value
                FROM orders
                WHERE status IN ('PAID', 'PREPARING', 'READY', 'COMPLETED')
                AND YEAR(created_at) = ?
                GROUP BY MONTH(created_at)
                ORDER BY label ASC
            `;
        }

        const [breakdown] = await pool.execute(breakdownQuery, breakdownParams);

        res.json({
            month: isYearly ? 'all' : targetMonth,
            year: targetYear,
            totalOrders: stats[0].totalOrders || 0,
            totalRevenue: parseFloat(stats[0].totalRevenue || 0),
            mostSoldItem: mostSold.length > 0 ? mostSold[0] : null,
            breakdown: breakdown.map(item => ({
                label: item.label,
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

        // Use the current date and first day of current month for filtering
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 1-indexed for SQL
        const day = now.getDate();

        // 1. Daily Spending
        const [dailyResult] = await pool.execute(
            `SELECT SUM(total_amount) as dailyTotal 
             FROM orders 
             WHERE student_id = ? 
             AND status IN ('PAID', 'PREPARING', 'READY', 'COMPLETED')
             AND DATE(created_at) = CURDATE()`,
            [studentId]
        );

        // 2. Monthly Spending
        const [monthlyResult] = await pool.execute(
            `SELECT SUM(total_amount) as monthlyTotal 
             FROM orders 
             WHERE student_id = ? 
             AND status IN ('PAID', 'PREPARING', 'READY', 'COMPLETED')
             AND YEAR(created_at) = ? AND MONTH(created_at) = ?`,
            [studentId, year, month]
        );

        res.json({
            dailySpending: parseFloat(dailyResult[0].dailyTotal || 0),
            monthlySpending: parseFloat(monthlyResult[0].monthlyTotal || 0)
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

        const [result] = await pool.execute(
            'UPDATE orders SET is_student_hidden = TRUE WHERE id = ? AND student_id = ?',
            [id, studentId]
        );

        if (result.affectedRows === 0) {
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
