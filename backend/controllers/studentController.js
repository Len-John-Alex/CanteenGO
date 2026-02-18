const pool = require('../config/database');

// Get all students (for staff)
const getAllStudents = async (req, res) => {
    try {
        const query = `
            SELECT 
                s.id, 
                s.student_id, 
                s.name, 
                s.email, 
                s.is_verified,
                s.created_at,
                COUNT(o.id) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM students s
            LEFT JOIN orders o ON s.id = o.student_id
            WHERE s.is_deleted = FALSE
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};

// Get specific student's order history
const getStudentHistory = async (req, res) => {
    try {
        const { id } = req.params;

        const studentCheck = await pool.query('SELECT name FROM students WHERE id = $1', [id]);
        if (studentCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const query = `
            SELECT 
                o.id,
                o.total_amount,
                o.status,
                o.created_at,
                ts.start_time,
                ts.end_time
            FROM orders o
            LEFT JOIN time_slots ts ON o.slot_id = ts.slot_id
            WHERE o.student_id = $1
            ORDER BY o.created_at DESC
        `;

        const result = await pool.query(query, [id]);
        res.json({
            studentName: studentCheck.rows[0].name,
            orders: result.rows
        });
    } catch (error) {
        console.error('Error fetching student history:', error);
        res.status(500).json({ message: 'Server error fetching history' });
    }
};

// Soft delete student
const deleteStudent = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { id } = req.params;

        const studentsResult = await client.query('SELECT * FROM students WHERE id = $1', [id]);
        if (studentsResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Student not found' });
        }

        const student = studentsResult.rows[0];
        const timestamp = Date.now();

        const newStudentId = `${student.student_id}_deleted_${timestamp}`;
        const newEmail = student.email ? `${student.email}_deleted_${timestamp}` : null;

        await client.query(
            'UPDATE students SET is_deleted = TRUE, student_id = $1, email = $2 WHERE id = $3',
            [newStudentId, newEmail, id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting student:', error);
        res.status(500).json({ message: 'Server error deleting student' });
    } finally {
        client.release();
    }
};

module.exports = {
    getAllStudents,
    getStudentHistory,
    deleteStudent
};
