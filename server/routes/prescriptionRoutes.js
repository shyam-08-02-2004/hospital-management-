const express = require('express');
const router = express.Router();
const { createPrescription, getPrescriptions, getPrescriptionById } = require('../controllers/prescriptionController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validatePrescription } = require('../validators');

router.post('/', protect, restrictTo('doctor'), validatePrescription, createPrescription);
router.get('/', protect, getPrescriptions);
router.get('/:id', protect, getPrescriptionById);

module.exports = router;
