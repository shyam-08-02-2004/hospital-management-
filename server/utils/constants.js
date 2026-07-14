const ROLES = Object.freeze({
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  STAFF: 'staff',
});

const APPOINTMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  RESCHEDULED: 'rescheduled',
  NO_SHOW: 'no_show',
});

const PAYMENT_STATUS = Object.freeze({
  CREATED: 'created',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

const NOTIFICATION_TYPE = Object.freeze({
  APPOINTMENT_REMINDER: 'appointment_reminder',
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  PRESCRIPTION_READY: 'prescription_ready',
  GENERAL: 'general',
});

module.exports = { ROLES, APPOINTMENT_STATUS, PAYMENT_STATUS, NOTIFICATION_TYPE };
