const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('student', 'staff'), notificationController.getNotifications);
router.get('/unread-count', authenticate, authorize('student', 'staff'), notificationController.getUnreadCount);
router.patch('/:id/read', authenticate, authorize('student', 'staff'), notificationController.markAsRead);

module.exports = router;
