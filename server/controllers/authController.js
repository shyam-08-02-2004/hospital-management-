const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const expressAsyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET || 'replace_with_a_long_random_string', {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'replace_with_a_different_long_random_string', {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

const sendTokenResponse = async (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to database
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.status(statusCode).json({
    success: true,
    accessToken,
    user: user.toSafeObject(),
  });
};

/**
 * Register a new user (Patient only via public register)
 */
const register = expressAsyncHandler(async (req, res) => {
  const { name, email, password, phone, gender, dateOfBirth, bloodGroup } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email is already registered');
  }

  // Create verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  // Create base User
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: 'patient', // public registration is always patient
    emailVerificationToken: verificationToken,
    emailVerificationExpire: verificationExpire,
  });

  // Create Patient Profile
  await Patient.create({
    user: user._id,
    gender,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    bloodGroup,
  });

  // Try sending verification email, log error if fails (app won't crash)
  try {
    await sendVerificationEmail(user.email, user.name, verificationToken);
  } catch (err) {
    console.error('Failed to send verification email during registration:', err.message);
  }

  // Auto-login after registration for seamless UX (optionally, you can require verification)
  await sendTokenResponse(user, 210, res); // 201 Created
});

/**
 * Login user
 */
const login = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Get user with password field (since it is select: false)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated. Please contact support.');
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  await sendTokenResponse(user, 200, res);
});

/**
 * Logout user
 */
const logout = expressAsyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
    }
  }

  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

/**
 * Refresh access token
 */
const refresh = expressAsyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token not found');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'replace_with_a_different_long_random_string');

    const user = await User.findOne({ _id: decoded.id, refreshToken });
    if (!user) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated');
    }

    const accessToken = generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    throw new ApiError(401, 'Refresh token verification failed');
  }
});

/**
 * Forgot password
 */
const forgotPassword = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, 'No user found with that email address');
  }

  // Generate and hash reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user.email, user.name, resetToken);
    res.status(200).json({ success: true, message: 'Reset email sent successfully' });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, 'Email could not be sent');
  }
});

/**
 * Reset password
 */
const resetPassword = expressAsyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshToken = undefined; // invalidate current sessions
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successful. Please login.' });
});

/**
 * Verify email
 */
const verifyEmail = expressAsyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw new ApiError(400, 'Verification token is required');
  }

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Email verified successfully!' });
});

/**
 * Get current logged in user details
 */
const getMe = expressAsyncHandler(async (req, res) => {
  let profile = null;

  if (req.user.role === 'patient') {
    profile = await Patient.findOne({ user: req.user._id });
  } else if (req.user.role === 'doctor') {
    profile = await Doctor.findOne({ user: req.user._id }).populate('department');
  }

  res.status(200).json({
    success: true,
    user: req.user.toSafeObject(),
    profile,
  });
});

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
};
