const jwt = require('jsonwebtoken');
const expressAsyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Protect routes - Verifies JWT access token in authorization header or cookies.
 */
const protect = expressAsyncHandler(async (req, res, next) => {
  let token;

  // 1. Get token from Authorization header or cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, please login first');
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'replace_with_a_long_random_string');

    // 3. Get user from db (excluding password)
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, 'User associated with this token no longer exists');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Your account has been deactivated. Please contact support.');
    }

    // 4. Grant access and store user details in req.user
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Session expired, please refresh token or login again');
    }
    throw new ApiError(401, 'Not authorized, invalid token');
  }
});

/**
 * Restrict access to specific roles (RBAC)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, `Role (${req.user?.role || 'anonymous'}) is not authorized to access this resource`));
    }
    next();
  };
};

module.exports = { protect, restrictTo };
