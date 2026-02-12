const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

// Only students can place orders
router.post('/checkout', authenticate, authorize('student'), orderController.validateCheckout);
router.post('/complete', authenticate, authorize('student'), orderController.completeOrder);
router.post('/cancel', authenticate, orderController.cancelOrder);
router.get('/', authenticate, authorize('student'), orderController.getStudentOrders);
router.get('/staff', authenticate, authorize('staff'), orderController.getStaffOrders);
router.patch('/:id/status', authenticate, authorize('staff'), orderController.updateOrderStatus);
router.get('/revenue', authenticate, authorize('staff'), orderController.getRevenueStats);
router.get('/spending', authenticate, authorize('student'), orderController.getStudentSpending);
router.patch('/:id/hide', authenticate, authorize('student'), orderController.hideOrderForStudent);
router.get('/:id', authenticate, authorize('student', 'staff'), orderController.getOrderDetails);

module.exports = router;
