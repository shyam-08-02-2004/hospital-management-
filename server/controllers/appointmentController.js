const expressAsyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const Department = require('../models/Department');
const { APPOINTMENT_STATUS, NOTIFICATION_TYPE } = require('../utils/constants');
const { sendAppointmentConfirmationEmail } = require('../services/emailService');

/**
 * Helper to normalize date to midnight UTC
 */
const normalizeToMidnight = (dateStr) => {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Create a new appointment
 */
const createAppointment = expressAsyncHandler(async (req, res) => {
  const { doctorId, departmentId, date, startTime, reasonForVisit } = req.body;

  // 1. Fetch patient associated with logged-in user
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    throw new ApiError(404, 'Patient profile not found. Please set up your profile first.');
  }

  // 2. Fetch doctor & check existence / fee
  const doctor = await Doctor.findById(doctorId).populate('user');
  if (!doctor) {
    throw new ApiError(404, 'Doctor not found');
  }

  if (!doctor.isAvailable) {
    throw new ApiError(400, 'Doctor is currently not available for bookings');
  }

  // Normalize date
  const appointmentDate = normalizeToMidnight(date);

  // Check if date is blocked by doctor
  const isBlocked = doctor.blockedDates?.some(blocked => {
    return new Date(blocked).getTime() === appointmentDate.getTime();
  });
  if (isBlocked) {
    throw new ApiError(400, 'Doctor is on leave on this date');
  }

  // Check if doctor has slot availability on this day of week
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(appointmentDate).toLowerCase();
  const hasDaySlot = doctor.availability?.some(slot => slot.day === weekday);
  if (!hasDaySlot) {
    throw new ApiError(400, `Doctor does not consult on ${weekday}s`);
  }

  // 3. Check for double booking (active status only)
  const existingAppointment = await Appointment.findOne({
    doctor: doctorId,
    date: appointmentDate,
    startTime,
    status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.RESCHEDULED] },
  });

  if (existingAppointment) {
    throw new ApiError(400, 'This timeslot has already been booked. Please choose another slot.');
  }

  // Compute end time based on slot duration (usually 30 mins)
  const duration = doctor.availability?.find(slot => slot.day === weekday)?.slotDurationMinutes || 30;
  const [hourStr, minStr] = startTime.split(':');
  const startTotalMinutes = parseInt(hourStr) * 60 + parseInt(minStr);
  const endTotalMinutes = startTotalMinutes + duration;
  const endHours = Math.floor(endTotalMinutes / 60).toString().padStart(2, '0');
  const endMins = (endTotalMinutes % 60).toString().padStart(2, '0');
  const endTime = `${endHours}:${endMins}`;

  // 4. Create appointment
  const appointment = await Appointment.create({
    patient: patient._id,
    doctor: doctorId,
    department: departmentId,
    date: appointmentDate,
    startTime,
    endTime,
    reasonForVisit,
    consultationFee: doctor.consultationFee,
  });

  // 5. Send notification to Doctor & Patient
  await Notification.create({
    recipient: doctor.user._id,
    type: NOTIFICATION_TYPE.APPOINTMENT_CONFIRMED,
    title: 'New Appointment Scheduled',
    message: `You have a new appointment with patient ${req.user.name} on ${appointmentDate.toLocaleDateString()} at ${startTime}.`,
    relatedAppointment: appointment._id,
  });

  await Notification.create({
    recipient: req.user._id,
    type: NOTIFICATION_TYPE.APPOINTMENT_CONFIRMED,
    title: 'Appointment Booked Successfully',
    message: `Your appointment with Dr. ${doctor.user.name} is scheduled for ${appointmentDate.toLocaleDateString()} at ${startTime}.`,
    relatedAppointment: appointment._id,
  });

  // Try sending email
  try {
    const dept = await Department.findById(departmentId);
    await sendAppointmentConfirmationEmail(req.user.email, req.user.name, {
      doctorName: `Dr. ${doctor.user.name}`,
      departmentName: dept?.name || 'N/A',
      date: appointmentDate.toLocaleDateString(),
      time: startTime,
    });
  } catch (err) {
    console.error('Failed to send confirmation email:', err.message);
  }

  res.status(201).json({
    success: true,
    message: 'Appointment scheduled successfully',
    appointment,
  });
});

/**
 * Retrieve appointments based on role (patient/doctor/admin)
 */
const getAppointments = expressAsyncHandler(async (req, res) => {
  const { status, date } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (date) filter.date = normalizeToMidnight(date);

  // Filter based on user role
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(200).json({ success: true, count: 0, appointments: [] });
    filter.patient = patient._id;
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(200).json({ success: true, count: 0, appointments: [] });
    filter.doctor = doctor._id;
  }

  const appointments = await Appointment.find(filter)
    .populate({ path: 'patient', populate: { path: 'user' } })
    .populate({ path: 'doctor', populate: { path: 'user' } })
    .populate('department')
    .sort('-date -startTime');

  res.status(200).json({
    success: true,
    count: appointments.length,
    appointments,
  });
});

/**
 * Get appointment by ID
 */
const getAppointmentById = expressAsyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'user' } })
    .populate({ path: 'doctor', populate: { path: 'user' } })
    .populate('department');

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  // Access check
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (appointment.patient._id.toString() !== patient?._id.toString()) {
      throw new ApiError(403, 'Unauthorized access to appointment details');
    }
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (appointment.doctor._id.toString() !== doctor?._id.toString()) {
      throw new ApiError(403, 'Unauthorized access to appointment details');
    }
  }

  res.status(200).json({
    success: true,
    appointment,
  });
});

/**
 * Cancel appointment
 */
const cancelAppointment = expressAsyncHandler(async (req, res) => {
  const { cancellationReason } = req.body;
  const appointment = await Appointment.findById(req.params.id).populate('patient doctor');

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  // Access validation
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (appointment.patient._id.toString() !== patient?._id.toString()) {
      throw new ApiError(403, 'Cannot cancel another patient\'s appointment');
    }
  }

  if (appointment.status === APPOINTMENT_STATUS.COMPLETED || appointment.status === APPOINTMENT_STATUS.CANCELLED) {
    throw new ApiError(400, `Cannot cancel an appointment that is already ${appointment.status}`);
  }

  appointment.status = APPOINTMENT_STATUS.CANCELLED;
  appointment.cancellationReason = cancellationReason || 'Cancelled by user';
  await appointment.save();

  // Create notifications
  const userToNotify = req.user.role === 'patient' ? appointment.doctor.user : appointment.patient.user;
  await Notification.create({
    recipient: userToNotify,
    type: NOTIFICATION_TYPE.GENERAL,
    title: 'Appointment Cancelled',
    message: `Appointment scheduled on ${appointment.date.toLocaleDateString()} at ${appointment.startTime} was cancelled. Reason: ${appointment.cancellationReason}`,
    relatedAppointment: appointment._id,
  });

  res.status(200).json({
    success: true,
    message: 'Appointment cancelled successfully',
    appointment,
  });
});

/**
 * Reschedule appointment
 */
const rescheduleAppointment = expressAsyncHandler(async (req, res) => {
  const { date, startTime } = req.body;
  const appointment = await Appointment.findById(req.params.id).populate('patient doctor');

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  if (appointment.status === APPOINTMENT_STATUS.COMPLETED || appointment.status === APPOINTMENT_STATUS.CANCELLED) {
    throw new ApiError(400, 'Cannot reschedule completed or cancelled appointments');
  }

  const appointmentDate = normalizeToMidnight(date);

  // Check slot availability & double booking
  const existing = await Appointment.findOne({
    doctor: appointment.doctor._id,
    date: appointmentDate,
    startTime,
    status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.RESCHEDULED] },
    _id: { $ne: appointment._id },
  });

  if (existing) {
    throw new ApiError(400, 'Selected timeslot is already booked by another patient');
  }

  appointment.date = appointmentDate;
  appointment.startTime = startTime;
  appointment.status = APPOINTMENT_STATUS.RESCHEDULED;
  await appointment.save();

  // Notify counterpart
  const userToNotify = req.user.role === 'patient' ? appointment.doctor.user : appointment.patient.user;
  await Notification.create({
    recipient: userToNotify,
    type: NOTIFICATION_TYPE.GENERAL,
    title: 'Appointment Rescheduled',
    message: `Appointment has been rescheduled to ${appointmentDate.toLocaleDateString()} at ${startTime}.`,
    relatedAppointment: appointment._id,
  });

  res.status(200).json({
    success: true,
    message: 'Appointment rescheduled successfully',
    appointment,
  });
});

/**
 * Update appointment status (Admin / Doctor only)
 */
const updateAppointmentStatus = expressAsyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const appointment = await Appointment.findById(req.params.id).populate('patient doctor');

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  if (status) {
    if (!Object.values(APPOINTMENT_STATUS).includes(status)) {
      throw new ApiError(400, 'Invalid appointment status');
    }
    appointment.status = status;
  }
  
  if (notes) appointment.notes = notes;

  await appointment.save();

  // Send Notification
  await Notification.create({
    recipient: appointment.patient.user,
    type: NOTIFICATION_TYPE.GENERAL,
    title: 'Appointment Status Updated',
    message: `Your appointment with Dr. ${appointment.doctor.user.name} status is now: ${status}.`,
    relatedAppointment: appointment._id,
  });

  res.status(200).json({
    success: true,
    message: `Appointment status updated to ${status}`,
    appointment,
  });
});

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
};
