const Razorpay = require('razorpay');

/**
 * Razorpay instance.
 * NOTE: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in .env are placeholders.
 * Replace them with real test/live keys from https://dashboard.razorpay.com/app/keys
 * before attempting real payment flows. Order creation will fail with a clear
 * Razorpay auth error until valid keys are set - this is expected and safe.
 */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'mock_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_key_secret',
});

module.exports = razorpay;
