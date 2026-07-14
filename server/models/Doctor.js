const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
    },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "17:00"
    slotDurationMinutes: { type: Number, default: 30 },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    specialization: { type: String, required: true, trim: true },
    qualifications: [{ type: String, trim: true }],
    experienceYears: { type: Number, default: 0, min: 0 },
    licenseNumber: { type: String, required: true, unique: true },
    consultationFee: { type: Number, required: true, min: 0 },
    bio: { type: String, maxlength: 1000 },
    availability: [availabilitySlotSchema],
    // Dates the doctor has explicitly blocked off (leave, conference, etc.)
    blockedDates: [{ type: Date }],
    rating: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    isAvailable: { type: Boolean, default: true },
    signatureImage: { url: String, publicId: String },
  },
  { timestamps: true }
);

doctorSchema.index({ department: 1 });
doctorSchema.index({ specialization: 'text' });

module.exports = mongoose.model('Doctor', doctorSchema);
