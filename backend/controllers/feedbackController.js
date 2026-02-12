const pool = require('../config/database');

const submitFeedback = async (req, res) => {
    try {
        const student_id = req.user.id;
        const { message, rating } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Feedback message is required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO feedback (student_id, message, rating) VALUES (?, ?, ?)',
            [student_id, message, rating || 5]
        );

        res.status(201).json({ message: 'Feedback submitted successfully' });

        // Trigger notification for ALL staff
        // First get all staff IDs
        const [staffMembers] = await pool.execute('SELECT id FROM staff');

        if (staffMembers.length > 0) {
            const feedbackId = result.insertId;
            const notificationMessage = `New feedback received from Student #${student_id}: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`;

            // Prepare bulk insert values
            const values = staffMembers.map(staff => [
                null, // student_id is null
                staff.id, // staff_id
                null, // order_id is null
                notificationMessage,
                'FEEDBACK', // type
                'staff' // recipient_type
            ]);

            // Construct bulk insert query
            // MySQL doesn't natively support bulk insert with pool.execute easily with variable placeholders for all rows without constructing the string carefully
            // or we just loop. For now, loop is safer and easier since staff count is small.
            // Actually, we can just do a loop of promises.

            const notificationPromises = staffMembers.map(staff =>
                pool.execute(
                    'INSERT INTO notifications (student_id, staff_id, order_id, message, type, recipient_type) VALUES (NULL, ?, NULL, ?, "FEEDBACK", "staff")',
                    [staff.id, notificationMessage]
                )
            );

            // Execute all notifications without awaiting individually (fire and forget or await all)
            Promise.all(notificationPromises).catch(err => console.error('Failed to create staff notifications', err));
        }

    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ message: 'Server error submitting feedback' });
    }
};

const getAllFeedback = async (req, res) => {
    try {
        const [feedback] = await pool.execute(
            `SELECT f.*, s.name as student_name, s.student_id as student_roll_no
             FROM feedback f
             JOIN students s ON f.student_id = s.id
             ORDER BY f.created_at DESC`
        );
        res.json(feedback);
    } catch (error) {
        console.error('Get feedback error:', error);
        res.status(500).json({ message: 'Server error fetching feedback' });
    }
};

const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Attempting to delete feedback with ID: ${id} by staff: ${req.user.id}`);
        const [result] = await pool.execute('DELETE FROM feedback WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            console.warn(`No feedback found with ID: ${id}`);
            return res.status(404).json({ message: 'Feedback not found' });
        }

        console.log(`Feedback ${id} deleted successfully`);
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
