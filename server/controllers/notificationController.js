const expressAsyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const Notification = require('../models/Notification');

/**
 * Get all notifications for current user
 */
const getNotifications = expressAsyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate('relatedAppointment')
    .populate('relatedPayment')
    .sort('-createdAt');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  res.status(200).json({
    success: true,
    unreadCount,
    count: notifications.length,
    notifications,
  });
});

/**
 * Mark a single notification as read
 */
const markAsRead = expressAsyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    notification,
  });
});

/**
 * Mark all notifications as read for current user
 */
const markAllAsRead = expressAsyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
