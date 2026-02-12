const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/submit', authenticate, authorize('student'), feedbackController.submitFeedback);
router.get('/all', authenticate, authorize('staff'), feedbackController.getAllFeedback);
router.delete('/:id', authenticate, authorize('staff'), feedbackController.deleteFeedback);

module.exports = router;
