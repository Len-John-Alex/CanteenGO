const express = require('express');
const router = express.Router();
const favouriteController = require('../controllers/favouriteController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/toggle', authenticate, authorize('student'), favouriteController.toggleFavourite);
router.get('/', authenticate, authorize('student'), favouriteController.getFavourites);

module.exports = router;
