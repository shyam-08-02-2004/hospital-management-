const expressAsyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { uploadFile, deleteFile } = require('../services/uploadService');

/**
 * Get all doctors with filters
 */
const getDoctors = expressAsyncHandler(async (req, res) => {
  const { department, search, specialization } = req.query;
  const filter = {};

  if (department) filter.department = department;
  if (specialization) filter.specialization = { $regex: specialization, $options: 'i' };

  let query = Doctor.find(filter).populate('user').populate('department');

  let doctors = await query;

  if (search) {
    doctors = doctors.filter(doc => 
      doc.user && 
      (doc.user.name.toLowerCase().includes(search.toLowerCase()) || 
       doc.specialization.toLowerCase().includes(search.toLowerCase()))
    );
  }

  res.status(200).json({
    success: true,
    count: doctors.length,
    doctors,
  });
});

/**
 * Get doctor by ID
 */
const getDoctorById = expressAsyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('user').populate('department');

  if (!doctor) {
    throw new ApiError(404, 'Doctor not found');
  }

  res.status(200).json({
    success: true,
    doctor,
  });
});

/**
 * Update doctor profile (specialization, bio, consult fees, qualifications, availability)
 * Accessible by Doctor (Self) or Admin.
 */
const updateDoctorProfile = expressAsyncHandler(async (req, res) => {
  const { specialization, qualifications, experienceYears, consultationFee, bio, availability, blockedDates } = req.body;
  
  let doctor = await Doctor.findOne({ user: req.user._id });
  
  // Admin can also edit doctor profiles
  if (req.user.role === 'admin' && req.params.id) {
    doctor = await Doctor.findById(req.params.id);
  }

  if (!doctor) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  if (specialization) doctor.specialization = specialization;
  if (qualifications) doctor.qualifications = qualifications;
  if (experienceYears !== undefined) doctor.experienceYears = experienceYears;
  if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
  if (bio) doctor.bio = bio;
  if (availability) doctor.availability = availability;
  if (blockedDates) doctor.blockedDates = blockedDates.map(d => new Date(d));

  if (req.file) {
    if (doctor.signatureImage && doctor.signatureImage.publicId) {
      await deleteFile(doctor.signatureImage.publicId);
    }
    const uploaded = await uploadFile(req.file, 'signatures');
    doctor.signatureImage = {
      url: uploaded.url,
      publicId: uploaded.publicId,
    };
  }

  await doctor.save();

  res.status(200).json({
    success: true,
    message: 'Doctor profile updated successfully',
    doctor,
  });
});

/**
 * Create Doctor Profile (Admin only)
 */
const createDoctorProfile = expressAsyncHandler(async (req, res) => {
  const { name, email, password, phone, department, specialization, qualifications, experienceYears, licenseNumber, consultationFee, bio, availability } = req.body;

  // Check if user exists
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(400, 'Email already exists');
  }

  // Create User
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: 'doctor',
    isEmailVerified: true,
  });

  // Create Doctor profile
  const doctor = await Doctor.create({
    user: user._id,
    department,
    specialization,
    qualifications,
    experienceYears,
    licenseNumber,
    consultationFee,
    bio,
    availability,
  });

  res.status(201).json({
    success: true,
    message: 'Doctor account created successfully',
    doctor,
  });
});

module.exports = {
  getDoctors,
  getDoctorById,
  updateDoctorProfile,
  createDoctorProfile,
};
