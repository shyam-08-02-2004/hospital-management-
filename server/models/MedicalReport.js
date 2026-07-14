const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    title: { type: String, required: true, trim: true },
    reportType: {
      type: String,
      enum: ['lab_result', 'scan', 'xray', 'prescription_scan', 'discharge_summary', 'other'],
      default: 'other',
    },
    file: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      format: { type: String }, // pdf, jpg, png
      originalName: { type: String },
    },
    notes: { type: String, maxlength: 1000 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

medicalReportSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
