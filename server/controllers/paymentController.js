const expressAsyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const { PAYMENT_STATUS, NOTIFICATION_TYPE } = require('../utils/constants');
const { createOrder, verifyPayment } = require('../services/paymentService');

/**
 * Initiate a Razorpay payment order
 */
const initiatePayment = expressAsyncHandler(async (req, res) => {
  const { appointmentId } = req.body;

  // 1. Fetch patient
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    throw new ApiError(404, 'Patient profile not found');
  }

  // 2. Fetch appointment
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  if (appointment.isPaid) {
    throw new ApiError(400, 'Appointment is already paid');
  }

  // 3. Initiate Order via Service
  const receipt = `rcpt_${appointment._id}_${Date.now()}`;
  const order = await createOrder(appointment.consultationFee, receipt);

  if (!order) {
    throw new ApiError(500, 'Unable to create payment order. Please try again.');
  }

  // 4. Create Payment record in DB (amount in paise)
  const payment = await Payment.create({
    patient: patient._id,
    appointment: appointment._id,
    amount: order.amount,
    currency: order.currency,
    razorpayOrderId: order.id,
    status: PAYMENT_STATUS.CREATED,
    invoiceNumber: `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
  });

  // Link payment back to appointment
  appointment.payment = payment._id;
  await appointment.save();

  res.status(200).json({
    success: true,
    order,
    payment,
  });
});

/**
 * Verify Razorpay payment signature
 */
const confirmPayment = expressAsyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  // Find payment record
  const payment = await Payment.findOne({ razorpayOrderId }).populate({ path: 'patient', populate: { path: 'user' } });
  if (!payment) {
    throw new ApiError(404, 'Payment transaction record not found');
  }

  // Verify Signature
  const isValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

  if (!isValid) {
    payment.status = PAYMENT_STATUS.FAILED;
    payment.failureReason = 'Signature validation failed';
    await payment.save();
    throw new ApiError(400, 'Payment verification failed. Invalid signature.');
  }

  // Update payment status
  payment.status = PAYMENT_STATUS.PAID;
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  await payment.save();

  // Update appointment payment status
  const appointment = await Appointment.findById(payment.appointment);
  if (appointment) {
    appointment.isPaid = true;
    await appointment.save();
  }

  // Send push notification
  await Notification.create({
    recipient: payment.patient.user._id,
    type: NOTIFICATION_TYPE.PAYMENT_CONFIRMATION,
    title: 'Payment Received',
    message: `Payment of INR ${payment.amount / 100} for your appointment was processed successfully. Invoice: ${payment.invoiceNumber}`,
    relatedAppointment: appointment?._id,
  });

  res.status(200).json({
    success: true,
    message: 'Payment completed and verified successfully',
    payment,
  });
});

/**
 * Get all payment records (Patient views own, Admin views all)
 */
const getPayments = expressAsyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(200).json({ success: true, count: 0, payments: [] });
    filter.patient = patient._id;
  }

  const payments = await Payment.find(filter)
    .populate({ path: 'patient', populate: { path: 'user' } })
    .populate({ path: 'appointment', populate: { path: 'doctor', populate: { path: 'user' } } })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: payments.length,
    payments,
  });
});

module.exports = {
  initiatePayment,
  confirmPayment,
  getPayments,
};
