const express = require('express');
const router = express.Router();
const multer = require('multer');
const { updateMe, getUsers, toggleUserStatus } = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.put('/me', protect, upload.single('avatar'), updateMe);
router.get('/', protect, restrictTo('admin'), getUsers);
router.patch('/:id/status', protect, restrictTo('admin'), toggleUserStatus);

module.exports = router;
