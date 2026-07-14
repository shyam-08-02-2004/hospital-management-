const express = require('express');
const router = express.Router();
const { createAppointment, getAppointments, getAppointmentById, cancelAppointment, rescheduleAppointment, updateAppointmentStatus } = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validateAppointment } = require('../validators');

router.post('/', protect, restrictTo('patient'), validateAppointment, createAppointment);
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointmentById);
router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/reschedule', protect, rescheduleAppointment);
router.put('/:id/status', protect, restrictTo('doctor', 'admin'), updateAppointmentStatus);

module.exports = router;
