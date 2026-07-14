const expressAsyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const Patient = require('../models/Patient');

/**
 * Get all patients (Admin/Doctor only)
 */
const getPatients = expressAsyncHandler(async (req, res) => {
  const patients = await Patient.find().populate('user');

  res.status(200).json({
    success: true,
    count: patients.length,
    patients,
  });
});

/**
 * Get patient profile details by ID
 */
const getPatientById = expressAsyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate('user');

  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  // Ensure Patient is viewing their own profile or request is from doctor/admin
  if (req.user.role === 'patient') {
    const selfPatient = await Patient.findOne({ user: req.user._id });
    if (!selfPatient || selfPatient._id.toString() !== patient._id.toString()) {
      throw new ApiError(403, 'Access denied. You can only view your own profile.');
    }
  }

  res.status(200).json({
    success: true,
    patient,
  });
});

/**
 * Update Patient profile (DOB, Gender, BloodGroup, Address, Allergies, History)
 */
const updatePatientProfile = expressAsyncHandler(async (req, res) => {
  const { dateOfBirth, gender, bloodGroup, address, emergencyContact, allergies, chronicConditions, medicalHistorySummary } = req.body;

  let patient = await Patient.findOne({ user: req.user._id });

  if (req.user.role === 'admin' && req.params.id) {
    patient = await Patient.findById(req.params.id);
  }

  if (!patient) {
    throw new ApiError(404, 'Patient profile not found');
  }

  if (dateOfBirth) patient.dateOfBirth = new Date(dateOfBirth);
  if (gender) patient.gender = gender;
  if (bloodGroup) patient.bloodGroup = bloodGroup;
  if (address) patient.address = { ...patient.address, ...address };
  if (emergencyContact) patient.emergencyContact = { ...patient.emergencyContact, ...emergencyContact };
  if (allergies) patient.allergies = allergies;
  if (chronicConditions) patient.chronicConditions = chronicConditions;
  if (medicalHistorySummary) patient.medicalHistorySummary = medicalHistorySummary;

  await patient.save();

  res.status(200).json({
    success: true,
    message: 'Patient profile updated successfully',
    patient,
  });
});

module.exports = {
  getPatients,
  getPatientById,
  updatePatientProfile,
};
