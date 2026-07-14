const express = require('express');
const router = express.Router();
const { getPatients, getPatientById, updatePatientProfile } = require('../controllers/patientController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/', protect, restrictTo('admin', 'doctor'), getPatients);
router.get('/:id', protect, getPatientById);
router.put('/profile', protect, restrictTo('patient', 'admin'), updatePatientProfile);
router.put('/profile/:id', protect, restrictTo('admin'), updatePatientProfile);

module.exports = router;
