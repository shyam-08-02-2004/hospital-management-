const express = require('express');
const router = express.Router();
const { initiatePayment, confirmPayment, getPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/initiate', protect, initiatePayment);
router.post('/confirm', protect, confirmPayment);
router.get('/', protect, getPayments);

module.exports = router;
