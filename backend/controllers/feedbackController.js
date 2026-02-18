const pool = require('../config/database');

const submitFeedback = async (req, res) => {
    try {
        const student_id = req.user.id;
        const { message, rating } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Feedback message is required' });
        }

        const result = await pool.query(
            'INSERT INTO feedback (student_id, message, rating) VALUES ($1, $2, $3) RETURNING id',
            [student_id, message, rating || 5]
        );

        res.status(201).json({ message: 'Feedback submitted successfully' });

        // Trigger notification for ALL staff
        const staffResult = await pool.query('SELECT id FROM staff');
        const staffMembers = staffResult.rows;

        if (staffMembers.length > 0) {
            const notificationMessage = `New feedback received from Student #${student_id}: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`;

            const notificationPromises = staffMembers.map(staff =>
                pool.query(
                    "INSERT INTO notifications (student_id, staff_id, order_id, message, type, recipient_type) VALUES (NULL, $1, NULL, $2, 'FEEDBACK', 'staff')",
                    [staff.id, notificationMessage]
                )
            );

            Promise.all(notificationPromises).catch(err => console.error('Failed to create staff notifications', err));
        }

    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ message: 'Server error submitting feedback' });
    }
};

const getAllFeedback = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT f.*, s.name as student_name, s.student_id as student_roll_no
             FROM feedback f
             JOIN students s ON f.student_id = s.id
             ORDER BY f.created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get feedback error:', error);
        res.status(500).json({ message: 'Server error fetching feedback' });
    }
};

const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM feedback WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        res.json({ message: 'Feedback deleted successfully' });
    } catch (error) {
        console.error('Delete feedback error:', error);
        res.status(500).json({ message: 'Server error deleting feedback' });
    }
};

module.exports = {
    submitFeedback,
    getAllFeedback,
    deleteFeedback
};
