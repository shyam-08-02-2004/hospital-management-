const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Middleware to handle express-validator results and raise standard ApiError
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = errors.array().map((err) => err.msg);
  return next(new ApiError(400, 'Validation failed', extractedErrors));
};

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('role').optional().isIn(['patient', 'doctor', 'admin']).withMessage('Invalid role'),
  body('phone').optional().trim(),
  validate,
];

const validateLogin = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const validateAppointment = [
  body('doctorId').isMongoId().withMessage('Invalid Doctor ID'),
  body('departmentId').isMongoId().withMessage('Invalid Department ID'),
  body('date').isISO8601().withMessage('Invalid date format. Use ISO date string.'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('reasonForVisit').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  validate,
];

const validatePrescription = [
  body('appointmentId').isMongoId().withMessage('Invalid Appointment ID'),
  body('patientId').isMongoId().withMessage('Invalid Patient ID'),
  body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required').isLength({ max: 1000 }).withMessage('Diagnosis cannot exceed 1000 characters'),
  body('medicines').isArray({ min: 1 }).withMessage('At least one medicine is required'),
  body('medicines.*.name').trim().notEmpty().withMessage('Medicine name is required'),
  body('medicines.*.dosage').trim().notEmpty().withMessage('Medicine dosage is required'),
  body('medicines.*.frequency').trim().notEmpty().withMessage('Medicine frequency is required'),
  body('medicines.*.duration').trim().notEmpty().withMessage('Medicine duration is required'),
  validate,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateAppointment,
  validatePrescription,
};
