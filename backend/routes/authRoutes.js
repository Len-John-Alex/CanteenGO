const express = require('express');
const router = express.Router();
const { loginStudent, loginStaff, registerStudent, registerStaff, getCurrentUser, verifyEmail } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register/student', registerStudent);
router.post('/register/staff', registerStaff);
router.post('/verify/student', verifyEmail);
router.post('/verify/staff', verifyEmail);
router.post('/login/student', loginStudent);
router.post('/login/staff', loginStaff);
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
