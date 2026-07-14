const expressAsyncHandler = require('express-async-handler');
const { User, Doctor, Patient, Appointment, Payment, Prescription } = require('../models');
const { APPOINTMENT_STATUS } = require('../utils/constants');

/**
 * Fetch dashboard metrics based on user role (Admin, Doctor, Patient)
 */
const getDashboardStats = expressAsyncHandler(async (req, res) => {
  const role = req.user.role;

  if (role === 'admin') {
    // 1. Total counts
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    // 2. Revenue calculation (stored in paise, return in INR)
    const paidTransactions = await Payment.find({ status: 'paid' });
    const totalRevenue = paidTransactions.reduce((acc, curr) => acc + (curr.amount / 100), 0);

    // 3. Appointment status split
    const statusSplit = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const formattedStatusSplit = {};
    Object.values(APPOINTMENT_STATUS).forEach(s => formattedStatusSplit[s] = 0);
    statusSplit.forEach(item => {
      if (item._id) formattedStatusSplit[item._id] = item.count;
    });

    // 4. Recent appointments
    const recentAppointments = await Appointment.find()
      .populate({ path: 'patient', populate: { path: 'user' } })
      .populate({ path: 'doctor', populate: { path: 'user' } })
      .populate('department')
      .sort('-createdAt')
      .limit(5);

    return res.status(200).json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalRevenue,
        statusSplit: formattedStatusSplit,
        recentAppointments,
      }
    });
  }

  if (role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(200).json({ success: true, stats: {} });
    }

    const doctorId = doctor._id;
    
    // 1. Today's Appointments
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);

    const todaysAppointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: startOfToday, $lte: endOfToday },
      status: { $in: [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.RESCHEDULED, APPOINTMENT_STATUS.PENDING] }
    })
    .populate({ path: 'patient', populate: { path: 'user' } })
    .sort('startTime');

    // 2. Overall counts
    const totalAppointments = await Appointment.countDocuments({ doctor: doctorId });
    const completedAppointments = await Appointment.countDocuments({ doctor: doctorId, status: APPOINTMENT_STATUS.COMPLETED });
    
    // 3. Unique patients treated
    const uniquePatients = await Appointment.distinct('patient', { doctor: doctorId });

    // 4. Recent prescriptions
    const recentPrescriptions = await Prescription.find({ doctor: doctorId })
      .populate({ path: 'patient', populate: { path: 'user' } })
      .sort('-createdAt')
      .limit(5);

    return res.status(200).json({
      success: true,
      stats: {
        todaysAppointments,
        totalAppointments,
        completedAppointments,
        uniquePatientsCount: uniquePatients.length,
        recentPrescriptions,
      }
    });
  }

  if (role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(200).json({ success: true, stats: {} });
    }

    const patientId = patient._id;

    // 1. Total stats
    const totalAppointments = await Appointment.countDocuments({ patient: patientId });
    const totalPrescriptions = await Prescription.countDocuments({ patient: patientId });

    // 2. Next upcoming appointment
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    const upcomingAppointment = await Appointment.findOne({
      patient: patientId,
      date: { $gte: now },
      status: { $in: [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.RESCHEDULED, APPOINTMENT_STATUS.PENDING] }
    })
    .populate({ path: 'doctor', populate: { path: 'user' } })
    .populate('department')
    .sort('date startTime');

    // 3. Outstanding payment alerts
    const unpaidAppointmentsCount = await Appointment.countDocuments({
      patient: patientId,
      isPaid: false,
      status: { $ne: APPOINTMENT_STATUS.CANCELLED }
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalAppointments,
        totalPrescriptions,
        upcomingAppointment,
        unpaidAppointmentsCount,
      }
    });
  }

  return res.status(400).json({ success: false, message: 'Invalid role for dashboard' });
});

module.exports = {
  getDashboardStats,
};
