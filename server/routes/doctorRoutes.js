const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getDoctors, getDoctorById, updateDoctorProfile, createDoctorProfile } = require('../controllers/doctorController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.put('/profile', protect, restrictTo('doctor', 'admin'), upload.single('signatureImage'), updateDoctorProfile);
router.put('/profile/:id', protect, restrictTo('admin'), upload.single('signatureImage'), updateDoctorProfile);
router.post('/', protect, restrictTo('admin'), createDoctorProfile);

module.exports = router;
