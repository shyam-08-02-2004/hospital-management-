const expressAsyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const { sendEmail } = require('../services/emailService');
const { APPOINTMENT_STATUS } = require('../utils/constants');

/**
 * Endpoint triggered by Vercel Cron to send appointment reminders
 */
const triggerReminders = expressAsyncHandler(async (req, res) => {
  // Security check: Vercel sends a CRON_SECRET if configured. 
  // We check if the authorization header matches CRON_SECRET
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized cron trigger' });
    }
  }

  console.log('[Cron] Running daily appointment reminder check via Vercel Cron...');
  let sentCount = 0;

  try {
    const now = new Date();
    
    // Look ahead to tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      status: APPOINTMENT_STATUS.CONFIRMED,
      date: tomorrow,
      reminderSent: { $ne: true }
    }).populate({ path: 'patient', populate: { path: 'user' } })
      .populate({ path: 'doctor', populate: { path: 'user' } });

    for (const apt of appointments) {
      const userEmail = apt.patient?.user?.email;
      const userName = apt.patient?.user?.name;
      const docName = apt.doctor?.user?.name;

      if (userEmail) {
        const subject = 'Appointment Reminder - HMS';
        const html = `
          <h2>Hello ${userName},</h2>
          <p>This is a friendly reminder for your upcoming appointment <strong>tomorrow</strong>.</p>
          <p><strong>Doctor:</strong> Dr. ${docName}</p>
          <p><strong>Time:</strong> ${apt.startTime}</p>
          <p>Please arrive 10 minutes early. Have a great day!</p>
        `;
          
        await sendEmail(userEmail, subject, html);
        
        apt.reminderSent = true;
        await apt.save();
        sentCount++;
      }
    }

    res.status(200).json({ success: true, message: `Reminders sent: ${sentCount}` });
  } catch (err) {
    console.error('[Cron] Error running reminder job:', err.message);
    res.status(500).json({ success: false, message: 'Failed to run cron job' });
  }
});

module.exports = { triggerReminders };
