const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../utils/constants');

const paymentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    amount: { type: Number, required: true, min: 0 }, // in the smallest currency unit (paise)
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.CREATED },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    invoiceNumber: { type: String, unique: true, sparse: true },
    invoiceUrl: { type: String },
    refundId: { type: String },
    refundAmount: { type: Number },
    failureReason: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
