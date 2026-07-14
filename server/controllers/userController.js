const expressAsyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const { uploadFile, deleteFile } = require('../services/uploadService');

/**
 * Update current user profile (name, phone, avatar)
 */
const updateMe = expressAsyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = req.user;

  if (name) user.name = name;
  if (phone) user.phone = phone;

  if (req.file) {
    // If user already has an avatar, delete it first
    if (user.avatar && user.avatar.publicId) {
      await deleteFile(user.avatar.publicId);
    }
    const uploaded = await uploadFile(req.file, 'avatars');
    user.avatar = {
      url: uploaded.url,
      publicId: uploaded.publicId,
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: user.toSafeObject(),
  });
});

/**
 * Get all users (Admin only)
 */
const getUsers = expressAsyncHandler(async (req, res) => {
  const { role, isActive, search } = req.query;
  const filter = {};

  if (role) filter.role = role;
  if (isActive) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: users.length,
    users: users.map(u => u.toSafeObject()),
  });
});

/**
 * Toggle user active status (Admin only)
 */
const toggleUserStatus = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot deactivate yourself');
  }

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: `User status changed to ${user.isActive ? 'Active' : 'Inactive'}`,
    user: user.toSafeObject(),
  });
});

module.exports = {
  updateMe,
  getUsers,
  toggleUserStatus,
};
