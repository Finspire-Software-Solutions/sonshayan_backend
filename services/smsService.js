/**
 * Notify.lk SMS Service
 *
 * Sends SMS notifications via the Notify.lk REST API.
 *
 * Required environment variables:
 *   NOTIFYLK_USER_ID   – your Notify.lk user ID
 *   NOTIFYLK_API_KEY   – your Notify.lk API key
 *   NOTIFYLK_SENDER_ID – sender ID registered on Notify.lk (default: NotifyDEMO)
 *   ADMIN_PHONE        – admin phone number to receive SMS (e.g. +94771234567)
 */

const https = require('https');
const querystring = require('querystring');

const NOTIFYLK_BASE = 'app.notify.lk';
const NOTIFYLK_PATH = '/api/v1/send';

/**
 * Send an SMS via Notify.lk.
 * @param {string} to      – Recipient phone number (e.g. "0771234567" or "+94771234567")
 * @param {string} message – SMS body
 */
const sendSMS = (to, message) => {
  return new Promise((resolve, reject) => {
    if (!process.env.NOTIFYLK_USER_ID || !process.env.NOTIFYLK_API_KEY) {
      console.warn('⚠️  Notify.lk credentials not configured. Skipping SMS.');
      return resolve(null);
    }

    // Normalise phone: remove spaces, ensure no leading +
    // Notify.lk expects the number without the leading + (e.g. 94771234567)
    let phone = to.replace(/\s+/g, '').replace(/^\+/, '');

    const body = querystring.stringify({
      user_id: process.env.NOTIFYLK_USER_ID,
      api_key: process.env.NOTIFYLK_API_KEY,
      sender_id: process.env.NOTIFYLK_SENDER_ID || 'NotifyDEMO',
      to: phone,
      message,
    });

    const options = {
      hostname: NOTIFYLK_BASE,
      path: NOTIFYLK_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === 'success') {
            console.log(`📲 SMS sent to ${to}: ${parsed.message || 'OK'}`);
            resolve(parsed);
          } else {
            console.error(`SMS send failed for ${to}:`, parsed);
            resolve(parsed); // Non-fatal
          }
        } catch (_) {
          console.error('SMS response parse error:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.error('SMS request error:', err.message);
      resolve(null); // Non-fatal
    });

    req.write(body);
    req.end();
  });
};

const SmsService = {
  /**
   * Notify admin of a new order via SMS.
   */
  async sendNewOrderSMS({ order_id, order_number, customer_name, total_amount }) {
    const adminPhone = process.env.ADMIN_PHONE;
    if (!adminPhone) {
      console.warn('⚠️  ADMIN_PHONE not configured. Skipping new order SMS.');
      return;
    }

    const message =
      `New order received from ${customer_name}. ` +
      `Order ID: ${order_number}. ` +
      `Total: LKR ${parseFloat(total_amount).toFixed(2)}. ` +
      `Check admin dashboard.`;

    await sendSMS(adminPhone, message);
  },

  /**
   * Generic SMS helper – send any message to any number.
   */
  sendSMS,
};

module.exports = SmsService;
