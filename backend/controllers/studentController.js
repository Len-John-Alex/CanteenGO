const pool = require('../config/database');

// Get all students (for staff)
const getAllStudents = async (req, res) => {
    try {
        // Query to get student details and order stats
        // We exclude deleted students
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

        const [students] = await pool.execute(query);
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};

// Get specific student's order history
const getStudentHistory = async (req, res) => {
    try {
        const { id } = req.params;

        // Ensure student exists (even if deleted, we might want to see history, but typically we manage active ones)
        // Let's allow viewing history for deleted ones if needed, but for now just check existence
        const [studentCheck] = await pool.execute('SELECT name FROM students WHERE id = ?', [id]);
        if (studentCheck.length === 0) {
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
            WHERE o.student_id = ?
            ORDER BY o.created_at DESC
        `;

        const [orders] = await pool.execute(query, [id]);
        res.json({
            studentName: studentCheck[0].name,
            orders
        });
    } catch (error) {
        console.error('Error fetching student history:', error);
        res.status(500).json({ message: 'Server error fetching history' });
    }
};

// Soft delete student
const deleteStudent = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Check if student exists
        const [students] = await connection.execute('SELECT * FROM students WHERE id = ?', [id]);
        if (students.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Student not found' });
        }

        const student = students[0];
        const timestamp = Date.now();

        // Anonymize/Rename to free up unique constraints
        const newStudentId = `${student.student_id}_deleted_${timestamp}`;
        const newEmail = student.email ? `${student.email}_deleted_${timestamp}` : null;

        // Perform soft delete
        await connection.execute(
            'UPDATE students SET is_deleted = TRUE, student_id = ?, email = ? WHERE id = ?',
            [newStudentId, newEmail, id]
        );

        await connection.commit();
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting student:', error);
        res.status(500).json({ message: 'Server error deleting student' });
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllStudents,
    getStudentHistory,
    deleteStudent
};
