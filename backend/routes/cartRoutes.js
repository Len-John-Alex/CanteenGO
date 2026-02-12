const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate, authorize } = require('../middleware/auth');

// Add item to cart - Protected, only for students
router.post('/add', authenticate, authorize('student'), cartController.addToCart);

// Get cart items
router.get('/', authenticate, authorize('student'), cartController.getCart);

// Remove item from cart
router.delete('/:menuItemId', authenticate, authorize('student'), cartController.removeFromCart);

// Update item quantity
router.put('/update', authenticate, authorize('student'), cartController.updateCartItem);

module.exports = router;
