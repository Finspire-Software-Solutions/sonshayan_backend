/**
 * WhatsApp Notification Service
 *
 * Uses Twilio's WhatsApp API to send order status notifications.
 *
 * Setup:
 * 1. Create a Twilio account at https://www.twilio.com
 * 2. Enable WhatsApp in Twilio console
 * 3. Set environment variables in .env:
 *    TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *    TWILIO_AUTH_TOKEN=your_auth_token
 *    TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
 *    WHATSAPP_NOTIFICATIONS_ENABLED=true
 */

const STATUS_MESSAGES = {
  confirmed: (name, orderNum) =>
    `✅ Hi ${name}! Your Son Chayan order *#${orderNum}* has been confirmed. We'll start preparing it shortly.`,
  preparing: (name, orderNum) =>
    `🍟 Hi ${name}! Your Son Chayan order *#${orderNum}* is now being prepared with care.`,
  shipped: (name, orderNum) =>
    `📦 Hi ${name}! Your Son Chayan order *#${orderNum}* has been shipped and is on its way!`,
  out_for_delivery: (name, orderNum) =>
    `🛵 Hi ${name}! Your Son Chayan order *#${orderNum}* is out for delivery. Expect it soon!`,
  delivered: (name, orderNum) =>
    `🎉 Hi ${name}! Your Son Chayan order *#${orderNum}* has been delivered. Enjoy your chips! Thank you for shopping with us.`,
  cancelled: (name, orderNum) =>
    `❌ Hi ${name}! Unfortunately your Son Chayan order *#${orderNum}* has been cancelled. Contact us if you have questions.`,
};

const WhatsAppService = {
  async sendOrderStatusUpdate(order) {
    if (process.env.WHATSAPP_NOTIFICATIONS_ENABLED !== 'true') return;

    const messageFn = STATUS_MESSAGES[order.order_status];
    if (!messageFn) return; // No message for this status

    const message = messageFn(order.customer_name, order.order_number);

    // Format phone: ensure it starts with country code
    let phone = order.phone.replace(/\s+/g, '').replace(/^0/, '+94');
    if (!phone.startsWith('+')) phone = '+' + phone;

    try {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
        to: `whatsapp:${phone}`,
        body: message,
      });

      console.log(`📱 WhatsApp sent to ${phone}: ${order.order_status}`);
    } catch (err) {
      console.error(`WhatsApp send error for order ${order.order_number}:`, err.message);
      // Non-fatal – don't throw, just log
    }
  },

  async sendCustomMessage(phone, message) {
    if (process.env.WHATSAPP_NOTIFICATIONS_ENABLED !== 'true') return;

    let formattedPhone = phone.replace(/\s+/g, '').replace(/^0/, '+94');
    if (!formattedPhone.startsWith('+')) formattedPhone = '+' + formattedPhone;

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
      to: `whatsapp:${formattedPhone}`,
      body: message,
    });
  },
};

module.exports = WhatsAppService;
