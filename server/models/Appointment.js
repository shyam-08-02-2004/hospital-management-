const mongoose = require('mongoose');
const { APPOINTMENT_STATUS } = require('../utils/constants');

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    date: { type: Date, required: true }, // calendar day, normalized to midnight UTC
    startTime: { type: String, required: true }, // "09:30"
    endTime: { type: String, required: true }, // "10:00"
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.PENDING,
    },
    reasonForVisit: { type: String, maxlength: 500 },
    notes: { type: String, maxlength: 1000 }, // internal doctor/admin notes
    cancellationReason: { type: String },
    rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    consultationFee: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  },
  { timestamps: true }
);

// A doctor cannot be double-booked for the same date + startTime.
// This is the DB-level guarantee; controller-level checks give a friendlier
// error message before this constraint would ever be hit.
appointmentSchema.index(
  { doctor: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'confirmed', 'rescheduled'] } },
  }
);
appointmentSchema.index({ patient: 1, date: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
