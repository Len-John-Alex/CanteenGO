const express = require('express');
const router = express.Router();
const timeSlotController = require('../controllers/timeSlotController');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

const timeSlotValidation = [
    body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Start time must be in HH:MM or HH:MM:SS format'),
    body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('End time must be in HH:MM or HH:MM:SS format'),
    body('max_orders').isInt({ min: 0 }).withMessage('Max orders must be a non-negative integer')
];

const updateValidation = [
    body('max_orders').optional().isInt({ min: 0 }).withMessage('Max orders must be a non-negative integer'),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
];

// Available routes for Students and Staff
router.get('/available', authenticate, authorize('student', 'staff'), timeSlotController.getAvailableTimeSlots);

// Management routes require Staff authentication
router.use(authenticate, authorize('staff'));

router.post('/', timeSlotValidation, timeSlotController.addTimeSlot);
router.put('/:id', updateValidation, timeSlotController.updateTimeSlot);
router.post('/:id/reset', timeSlotController.resetTimeSlotCount);
router.get('/', timeSlotController.getTimeSlots);
router.delete('/:id', timeSlotController.deleteTimeSlot);

module.exports = router;
