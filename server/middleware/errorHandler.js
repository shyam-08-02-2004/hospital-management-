const ApiError = require('../utils/ApiError');

/**
 * Catches 404s for unmatched routes.
 */
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found - ${req.originalUrl}`));
};

/**
 * Centralized error handler. Normalizes Mongoose/JWT errors into ApiError
 * shape so the frontend always receives a consistent { success, message, errors } body.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (error.name === 'CastError') {
    error = new ApiError(400, `Invalid value for field "${error.path}": ${error.value}`);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    error = new ApiError(409, `Duplicate value for "${field}". It must be unique.`);
  }

  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((e) => e.message);
    error = new ApiError(400, 'Validation failed', messages);
  }

  if (error.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token');
  }

  if (error.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token has expired');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
