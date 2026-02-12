const express = require('express');
const router = express.Router();
const { getAllStudents, getStudentHistory, deleteStudent } = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require Staff authentication
router.use(authenticate, authorize('staff'));

router.get('/', getAllStudents);
router.get('/:id/history', getStudentHistory);
router.delete('/:id', deleteStudent);

module.exports = router;
