const express = require('express');
const router = express.Router();
const { triggerReminders } = require('../controllers/cronController');

// Triggered by Vercel Cron
router.get('/reminders', triggerReminders);

module.exports = router;
