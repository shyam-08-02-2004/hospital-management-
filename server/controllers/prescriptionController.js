const expressAsyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { generatePrescriptionPDF } = require('../services/pdfService');
const { uploadFile } = require('../services/uploadService');
const { APPOINTMENT_STATUS, NOTIFICATION_TYPE } = require('../utils/constants');

/**
 * Create a new prescription
 * Saves data, generates PDF, uploads it, updates appointment to completed.
 */
const createPrescription = expressAsyncHandler(async (req, res) => {
  const { appointmentId, patientId, diagnosis, symptoms, medicines, advice, followUpDate } = req.body;

  // 1. Validate doctor authorization
  const doctor = await Doctor.findOne({ user: req.user._id }).populate('user');
  if (!doctor) {
    throw new ApiError(403, 'Only doctors can write prescriptions');
  }

  // 2. Fetch appointment
  const appointment = await Appointment.findById(appointmentId).populate('patient department');
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  if (appointment.doctor.toString() !== doctor._id.toString()) {
    throw new ApiError(403, 'You are not authorized to write prescriptions for this appointment');
  }

  // 3. Fetch patient profile
  const patient = await Patient.findById(patientId).populate('user');
  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  // 4. Create prescription document (preliminary)
  const prescription = new Prescription({
    appointment: appointmentId,
    patient: patientId,
    doctor: doctor._id,
    diagnosis,
    symptoms: symptoms || [],
    medicines,
    advice,
    followUpDate: followUpDate ? new Date(followUpDate) : undefined,
  });

  // 5. Generate and upload PDF prescription
  const pdfData = {
    patientName: patient.user.name,
    patientDOB: patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A',
    patientGender: patient.gender,
    patientBloodGroup: patient.bloodGroup,
    doctorName: doctor.user.name,
    doctorSpecialization: doctor.specialization,
    doctorLicense: doctor.licenseNumber,
    date: new Date().toLocaleDateString(),
    diagnosis,
    symptoms: symptoms || [],
    medicines,
    advice,
    followUpDate: followUpDate ? new Date(followUpDate).toLocaleDateString() : undefined,
    doctorSignatureSnapshot: doctor.signatureImage?.url,
  };

  let pdfUrl = '';
  try {
    const pdfBuffer = await generatePrescriptionPDF(pdfData);
    
    // Create a mock Multer file object for uploadService
    const mockFile = {
      buffer: pdfBuffer,
      originalname: `prescription_${prescription._id}.pdf`,
      mimetype: 'application/pdf',
    };
    
    const uploadResult = await uploadFile(mockFile, 'prescriptions');
    if (uploadResult) {
      pdfUrl = uploadResult.url;
    }
  } catch (err) {
    console.error('[PrescriptionController] PDF generation/upload failed:', err.message);
  }

  prescription.pdfUrl = pdfUrl;
  await prescription.save();

  // 6. Automatically complete the appointment
  appointment.status = APPOINTMENT_STATUS.COMPLETED;
  await appointment.save();

  // 7. Push notification to the Patient
  await Notification.create({
    recipient: patient.user._id,
    type: NOTIFICATION_TYPE.PRESCRIPTION_READY,
    title: 'New Prescription Uploaded',
    message: `Dr. ${doctor.user.name} has added a new prescription. You can view or download the PDF copy.`,
    relatedAppointment: appointment._id,
  });

  res.status(201).json({
    success: true,
    message: 'Prescription written and finalized successfully',
    prescription,
  });
});

/**
 * Get prescriptions based on role
 */
const getPrescriptions = expressAsyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(200).json({ success: true, count: 0, prescriptions: [] });
    filter.patient = patient._id;
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(200).json({ success: true, count: 0, prescriptions: [] });
    filter.doctor = doctor._id;
  }

  const prescriptions = await Prescription.find(filter)
    .populate({ path: 'patient', populate: { path: 'user' } })
    .populate({ path: 'doctor', populate: { path: 'user' } })
    .populate('appointment')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: prescriptions.length,
    prescriptions,
  });
});

/**
 * Get single prescription by ID
 */
const getPrescriptionById = expressAsyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'user' } })
    .populate({ path: 'doctor', populate: { path: 'user' } })
    .populate('appointment');

  if (!prescription) {
    throw new ApiError(404, 'Prescription not found');
  }

  // Access validation
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (prescription.patient._id.toString() !== patient?._id.toString()) {
      throw new ApiError(403, 'Unauthorized access to prescription');
    }
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (prescription.doctor._id.toString() !== doctor?._id.toString()) {
      throw new ApiError(403, 'Unauthorized access to prescription');
    }
  }

  res.status(200).json({
    success: true,
    prescription,
  });
});

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
};
