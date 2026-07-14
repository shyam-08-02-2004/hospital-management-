const crypto = require('crypto');
const razorpay = require('../config/razorpay');

const isRazorpayConfigured = () => {
  return (
    process.env.RAZORPAY_KEY_ID &&
    !process.env.RAZORPAY_KEY_ID.includes('placeholder') &&
    process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_SECRET.includes('placeholder')
  );
};

/**
 * Creates a payment order.
 * @param {number} amount - Amount in INR (not paise)
 * @param {string} receipt - Unique receipt string
 * @returns {Promise<Object>} order details
 */
const createOrder = async (amount, receipt) => {
  const amountInPaise = Math.round(amount * 100);

  if (isRazorpayConfigured()) {
    try {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt,
      };
      return await razorpay.orders.create(options);
    } catch (error) {
      console.error('[PaymentService] Razorpay order creation failed, falling back to simulation:', error.message);
    }
  }

  // Simulation fallback
  console.log('[PaymentService] Running in SIMULATOR mode.');
  return {
    id: `order_sim_${Math.random().toString(36).substring(2, 11)}`,
    entity: 'order',
    amount: amountInPaise,
    amount_paid: 0,
    amount_due: amountInPaise,
    currency: 'INR',
    receipt,
    status: 'created',
    created_at: Math.floor(Date.now() / 1000),
    notes: { simulated: true }
  };
};

/**
 * Verifies Razorpay payment signature
 * @returns {boolean}
 */
const verifyPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  if (razorpayOrderId.startsWith('order_sim_')) {
    // Simulated success
    console.log(`[PaymentService] Verifying simulated payment order: ${razorpayOrderId}`);
    return true;
  }

  if (!isRazorpayConfigured()) {
    return false;
  }

  try {
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generated_signature === razorpaySignature;
  } catch (error) {
    console.error('[PaymentService] Payment verification failed:', error.message);
    return false;
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};
