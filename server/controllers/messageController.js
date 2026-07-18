const expressAsyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

// Get all messages between logged-in user and another user
const getMessages = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params; // ID of the other user

  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id },
    ],
  }).sort('createdAt');

  res.status(200).json({ success: true, messages });
});

// Send a message
const sendMessage = expressAsyncHandler(async (req, res) => {
  const { receiverId, text } = req.body;

  if (!receiverId || !text) {
    throw new ApiError(400, 'Receiver ID and text are required');
  }

  const message = await Message.create({
    sender: req.user._id,
    receiver: receiverId,
    text,
  });

  res.status(201).json({ success: true, message });
});

// Get a list of users the current user has chatted with
const getContacts = expressAsyncHandler(async (req, res) => {
  // Find all messages where current user is sender or receiver
  const messages = await Message.find({
    $or: [{ sender: req.user._id }, { receiver: req.user._id }],
  });

  const contactIds = new Set();
  messages.forEach((msg) => {
    if (msg.sender.toString() !== req.user._id.toString()) {
      contactIds.add(msg.sender.toString());
    }
    if (msg.receiver.toString() !== req.user._id.toString()) {
      contactIds.add(msg.receiver.toString());
    }
  });

  const contacts = await User.find({ _id: { $in: Array.from(contactIds) } }).select('name role avatar');

  res.status(200).json({ success: true, contacts });
});

module.exports = { getMessages, sendMessage, getContacts };
