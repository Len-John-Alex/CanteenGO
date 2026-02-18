const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { sendVerificationEmail, sendWelcomeEmail } = require('../utils/emailService');

const loginStudent = async (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({ message: 'Student ID and password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM students WHERE UPPER(student_id) = UPPER($1)',
      [studentId]
    );
    const students = result.rows;

    if (students.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const student = students[0];
    const isPasswordValid = await bcrypt.compare(password, student.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if verified
    if (!student.is_verified) {
      return res.status(403).json({
        message: 'Email not verified',
        isNotVerified: true,
        studentId: student.student_id
      });
    }

    // Check if soft deleted
    if (student.is_deleted) {
      return res.status(403).json({ message: 'Account has been deactivated.' });
    }

    const token = generateToken(student.id, 'student');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: student.id,
        studentId: student.student_id,
        name: student.name,
        role: 'student'
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const loginStaff = async (req, res) => {
  try {
    const { staffId, password } = req.body;

    if (!staffId || !password) {
      return res.status(400).json({ message: 'Staff ID and password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM staff WHERE UPPER(staff_id) = UPPER($1)',
      [staffId]
    );
    const staff = result.rows;

    if (staff.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const staffMember = staff[0];
    const isPasswordValid = await bcrypt.compare(password, staffMember.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if verified
    if (!staffMember.is_verified) {
      return res.status(403).json({
        message: 'Email not verified',
        isNotVerified: true,
        staffId: staffMember.staff_id
      });
    }

    const token = generateToken(staffMember.id, 'staff');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: staffMember.id,
        staffId: staffMember.staff_id,
        name: staffMember.name,
        role: 'staff'
      }
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const registerStudent = async (req, res) => {
  try {
    const { studentId, name, email, password } = req.body;

    // Validation
    if (!studentId || !name || !password || !email) {
      return res.status(400).json({
        message: 'Student ID, name, email, and password are required'
      });
    }

    // Check if student already exists
    const resultExisting = await pool.query(
      'SELECT * FROM students WHERE UPPER(student_id) = UPPER($1) OR UPPER(email) = UPPER($2)',
      [studentId, email]
    );
    const existingStudents = resultExisting.rows;

    if (existingStudents.length > 0) {
      return res.status(409).json({
        message: 'Student ID or Email already registered. Please login instead.'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert new student with is_verified = false
    const result = await pool.query(
      'INSERT INTO students (student_id, name, email, password, is_verified, verification_code) VALUES ($1, $2, $3, $4, FALSE, $5) RETURNING id',
      [studentId, name, email, hashedPassword, verificationCode]
    );
    const insertId = result.rows[0].id;

    // Send verification email
    await sendVerificationEmail(email, verificationCode);

    // Generate token for auto-login after registration
    const token = generateToken(insertId, 'student');

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: insertId,
        studentId: studentId,
        name: name,
        email: email,
        role: 'student'
      }
    });
  } catch (error) {
    console.error('Student registration error:', error);

    // Handle duplicate key error (PostgreSQL error code for unique violation is 23505)
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Student ID or Email already registered.'
      });
    }

    res.status(500).json({ message: 'Server error during registration' });
  }
};

const registerStaff = async (req, res) => {
  try {
    const { staffId, name, email, password } = req.body;

    // Validation
    if (!staffId || !name || !password || !email) {
      return res.status(400).json({
        message: 'Staff ID, name, email, and password are required'
      });
    }

    // Check if staff already exists
    const resultExisting = await pool.query(
      'SELECT * FROM staff WHERE UPPER(staff_id) = UPPER($1) OR UPPER(email) = UPPER($2)',
      [staffId, email]
    );
    const existingStaff = resultExisting.rows;

    if (existingStaff.length > 0) {
      return res.status(409).json({
        message: 'Staff ID or Email already registered. Please login instead.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert new staff with is_verified = false
    const result = await pool.query(
      'INSERT INTO staff (staff_id, name, email, password, is_verified, verification_code) VALUES ($1, $2, $3, $4, FALSE, $5) RETURNING id',
      [staffId, name, email, hashedPassword, verificationCode]
    );
    const insertId = result.rows[0].id;

    // Send verification email
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      user: {
        id: insertId,
        staffId: staffId,
        name: name,
        email: email,
        role: 'staff'
      }
    });
  } catch (error) {
    console.error('Staff registration error:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Staff ID or Email already registered.'
      });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { studentId, staffId, code } = req.body;

    if ((!studentId && !staffId) || !code) {
      return res.status(400).json({ message: 'ID and verification code are required' });
    }

    let user;
    let role;
    let tableName;
    let idColumn;

    if (studentId) {
      const result = await pool.query('SELECT * FROM students WHERE student_id = $1', [studentId]);
      if (result.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
      user = result.rows[0];
      role = 'student';
      tableName = 'students';
      idColumn = 'student_id';
    } else {
      const result = await pool.query('SELECT * FROM staff WHERE staff_id = $1', [staffId]);
      if (result.rows.length === 0) return res.status(404).json({ message: 'Staff member not found' });
      user = result.rows[0];
      role = 'staff';
      tableName = 'staff';
      idColumn = 'staff_id';
    }

    if (user.is_verified) {
      return res.status(400).json({ message: 'Account already verified' });
    }

    // Use robust string comparison with trim
    if (String(user.verification_code).trim() !== String(code).trim()) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Mark as verified
    await pool.query(
      `UPDATE ${tableName} SET is_verified = TRUE, verification_code = NULL WHERE id = $1`,
      [user.id]
    );

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name, role).catch(err =>
      console.error('Failed to send welcome email:', err)
    );

    // Generate token for auto-login
    const token = generateToken(user.id, role);

    res.json({
      message: 'Email verification successful',
      token,
      user: {
        id: user.id,
        [role === 'student' ? 'studentId' : 'staffId']: user[idColumn],
        name: user.name,
        email: user.email,
        role: role
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role === 'student') {
      const result = await pool.query(
        'SELECT id, student_id, name, email, is_deleted FROM students WHERE id = $1',
        [id]
      );

      if (result.rows.length > 0) {
        if (result.rows[0].is_deleted) {
          return res.status(403).json({ message: 'Account has been deactivated.' });
        }
        return res.json({
          user: {
            ...result.rows[0],
            role: 'student'
          }
        });
      }
      const resultStaff = await pool.query(
        'SELECT id, staff_id, name, email FROM staff WHERE id = $1',
        [id]
      );
      if (resultStaff.rows.length > 0) {
        return res.json({
          user: {
            ...resultStaff.rows[0],
            role: 'staff'
          }
        });
      }
    }

    res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  loginStudent,
  loginStaff,
  registerStudent,
  registerStaff,
  verifyEmail,
  getCurrentUser
};
