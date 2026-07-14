const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true }, // "500mg"
    frequency: { type: String, required: true }, // "1-0-1" or "Twice daily"
    duration: { type: String, required: true }, // "5 days"
    instructions: { type: String, trim: true }, // "After food"
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    diagnosis: { type: String, required: true, maxlength: 1000 },
    symptoms: [{ type: String, trim: true }],
    medicines: { type: [medicineSchema], required: true, validate: (v) => v.length > 0 },
    advice: { type: String, maxlength: 1000 },
    followUpDate: { type: Date },
    pdfUrl: { type: String }, // generated PDF stored via Cloudinary or local /uploads
    doctorSignatureSnapshot: { type: String }, // URL snapshot at time of signing
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
