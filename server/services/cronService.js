const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { sendEmail } = require('./emailService');
const { APPOINTMENT_STATUS } = require('../utils/constants');

// Schedule tasks to be run on the server.
// Runs every 30 minutes
const startCronJobs = () => {
  cron.schedule('*/30 * * * *', async () => {
    console.log('[Cron] Running appointment reminder check...');
    try {
      const now = new Date();
      // Look ahead 2 hours
      const lookAhead = new Date(now.getTime() + 2 * 60 * 60 * 1000); 

      // We need appointments for today that are confirmed
      // Since date and time are stored separately:
      // date is stored at midnight UTC, startTime is "HH:MM"
      
      const startOfDay = new Date(now);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const appointments = await Appointment.find({
        status: APPOINTMENT_STATUS.CONFIRMED,
        date: startOfDay,
        reminderSent: { $ne: true } // Don't send multiple reminders
      }).populate({ path: 'patient', populate: { path: 'user' } })
        .populate({ path: 'doctor', populate: { path: 'user' } });

      for (const apt of appointments) {
        // Parse start time
        const [hours, mins] = apt.startTime.split(':');
        const aptDateTime = new Date(startOfDay);
        aptDateTime.setUTCHours(parseInt(hours), parseInt(mins), 0, 0);

        // If appointment is within the next 2 hours and in the future
        if (aptDateTime > now && aptDateTime <= lookAhead) {
          console.log(`[Cron] Sending reminder for Appointment ID: ${apt._id}`);
          
          const userEmail = apt.patient?.user?.email;
          const userName = apt.patient?.user?.name;
          const docName = apt.doctor?.user?.name;

          if (userEmail) {
            const subject = 'Appointment Reminder - HMS';
            const html = `
              <h2>Hello ${userName},</h2>
              <p>This is a friendly reminder for your upcoming appointment.</p>
              <p><strong>Doctor:</strong> Dr. ${docName}</p>
              <p><strong>Time:</strong> ${apt.startTime} (Today)</p>
              <p>Please arrive 10 minutes early. Have a great day!</p>
            `;
            
            await sendEmail(userEmail, subject, html);
            
            // Mark as sent
            apt.reminderSent = true;
            await apt.save();
          }
        }
      }
    } catch (err) {
      console.error('[Cron] Error running reminder job:', err.message);
    }
  });
  console.log('[Cron] Automated Reminder Job Scheduled.');
};

module.exports = { startCronJobs };
