const pool = require('../config/database');

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const recipientType = req.user.role === 'student' ? 'student' : 'staff';

        let query = 'SELECT * FROM notifications WHERE recipient_type = $1 ';
        const params = [recipientType];

        if (recipientType === 'student') {
            query += 'AND student_id = $2 ';
            params.push(userId);
        } else {
            query += 'AND staff_id = $2 ';
            params.push(userId);
        }

        query += 'ORDER BY created_at DESC LIMIT 50';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Fetch notifications error:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const recipientType = req.user.role === 'student' ? 'student' : 'staff';

        let query = 'SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE AND recipient_type = $1 ';
        const params = [recipientType];

        if (recipientType === 'student') {
            query += 'AND student_id = $2 ';
            params.push(userId);
        } else {
            query += 'AND staff_id = $2 ';
            params.push(userId);
        }

        const result = await pool.query(query, params);
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Fetch unread count error:', error);
        res.status(500).json({ message: 'Server error fetching unread count' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const recipientType = req.user.role === 'student' ? 'student' : 'staff';

        let query = 'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND recipient_type = $2 ';
        const params = [id, recipientType];

        if (recipientType === 'student') {
            query += 'AND student_id = $3 ';
            params.push(userId);
        } else {
            query += 'AND staff_id = $3 ';
            params.push(userId);
        }

        const result = await pool.query(query, params);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead
};
