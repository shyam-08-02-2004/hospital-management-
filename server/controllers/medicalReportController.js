const expressAsyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const MedicalReport = require('../models/MedicalReport');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { uploadFile, deleteFile } = require('../services/uploadService');

/**
 * Upload a new medical report
 */
const uploadReport = expressAsyncHandler(async (req, res) => {
  const { title, reportType, notes, appointmentId, doctorId } = req.body;

  if (!req.file) {
    throw new ApiError(400, 'Please upload a file (PDF or Image)');
  }

  // Find patient profile
  let patientId;
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      throw new ApiError(404, 'Patient profile not found');
    }
    patientId = patient._id;
  } else {
    // If admin or doctor is uploading for a patient, patientId must be provided in body
    patientId = req.body.patientId;
    if (!patientId) {
      throw new ApiError(400, 'patientId is required when uploading as Doctor/Admin');
    }
  }

  // Upload file
  const folder = `medical_reports/${patientId}`;
  const uploadResult = await uploadFile(req.file, folder);

  if (!uploadResult) {
    throw new ApiError(500, 'Failed to upload report file');
  }

  const format = req.file.originalname.split('.').pop();

  const report = await MedicalReport.create({
    patient: patientId,
    doctor: doctorId || undefined,
    appointment: appointmentId || undefined,
    title,
    reportType: reportType || 'other',
    file: {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      format,
      originalName: req.file.originalname,
    },
    notes,
    uploadedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Medical report uploaded successfully',
    report,
  });
});

/**
 * Get all reports
 */
const getReports = expressAsyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(200).json({ success: true, count: 0, reports: [] });
    filter.patient = patient._id;
  } else if (req.user.role === 'doctor') {
    // If doctor is viewing, they can filter by a patient ID or view all patients' reports
    const { patientId } = req.query;
    if (patientId) {
      filter.patient = patientId;
    }
  } else {
    // Admin can filter by patientId
    const { patientId } = req.query;
    if (patientId) filter.patient = patientId;
  }

  const reports = await MedicalReport.find(filter)
    .populate({ path: 'patient', populate: { path: 'user' } })
    .populate({ path: 'doctor', populate: { path: 'user' } })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: reports.length,
    reports,
  });
});

/**
 * Delete a report
 */
const deleteReport = expressAsyncHandler(async (req, res) => {
  const report = await MedicalReport.findById(req.params.id);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Access validation
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (report.patient.toString() !== patient?._id.toString()) {
      throw new ApiError(403, 'Unauthorized access to delete this report');
    }
  }

  // Delete file from storage
  if (report.file && report.file.publicId) {
    await deleteFile(report.file.publicId);
  }

  await report.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Medical report deleted successfully',
  });
});

module.exports = {
  uploadReport,
  getReports,
  deleteReport,
};
