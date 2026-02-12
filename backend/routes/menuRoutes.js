const express = require('express');
const router = express.Router();
const { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'));
    }
});

// Get all menu items (protected route - requires authentication)
router.get('/', authenticate, getMenuItems);

// Staff only routes for menu management
router.post('/', authenticate, authorize('staff'), upload.single('image'), addMenuItem);
router.patch('/:id', authenticate, authorize('staff'), upload.single('image'), updateMenuItem);
router.delete('/:id', authenticate, authorize('staff'), deleteMenuItem);

module.exports = router;
