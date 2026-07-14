const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    allergies: [{ type: String, trim: true }],
    chronicConditions: [{ type: String, trim: true }],
    // Denormalized quick-reference list; source of truth remains the
    // MedicalReport / Prescription collections.
    medicalHistorySummary: { type: String, maxlength: 2000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
