const { pool } = require('../config/db');

const OrderModel = {
  async findAll({ page = 1, limit = 15, status } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('o.order_status = ?');
      params.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT o.* FROM orders o
       ${where}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders o ${where}`,
      params
    );

    return { orders: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findItems(orderId) {
    const [rows] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    return rows;
  },

  async findItemsWithProductDetails(orderId) {
    const [rows] = await pool.query(
      `SELECT
         oi.product_id,
         oi.product_name   AS name,
         oi.price,
         oi.quantity,
         oi.subtotal,
         oi.product_image  AS image,
         p.is_active       AS product_active,
         p.stock           AS product_stock
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    );
    return rows;
  },

  async create({ order_number, customer_name, phone, address, city, payment_method, total_amount, delivery_fee, delivery_distance_km, notes, advance_paid, remaining_balance, customer_id, coupon_code, coupon_discount }) {
    const [result] = await pool.query(
      `INSERT INTO orders (order_number, customer_name, phone, address, city, payment_method, total_amount, delivery_fee, delivery_distance_km, notes, advance_paid, remaining_balance, customer_id, coupon_code, coupon_discount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_number, customer_name, phone, address, city || null,
        payment_method, total_amount,
        delivery_fee || 0, delivery_distance_km || null,
        notes || null,
        advance_paid || 0, remaining_balance || 0,
        customer_id || null,
        coupon_code || null, coupon_discount || 0,
      ]
    );
    return result.insertId;
  },

  async updateDeliveryLocation(id, lat, lng) {
    const [result] = await pool.query(
      'UPDATE orders SET delivery_lat = ?, delivery_lng = ?, delivery_updated_at = NOW() WHERE id = ?',
      [lat, lng, id]
    );
    return result.affectedRows;
  },

  async findByIdForCustomer(id) {
    // Returns order without sensitive admin-only data
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByPhone(phone, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [phone, limit, offset]
    );
    return rows;
  },

  async findByCustomerId(customerId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [customerId, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders WHERE customer_id = ?`,
      [customerId]
    );
    return { orders: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findByOrderNumberAndPhone(orderNumber, phone) {
    const [rows] = await pool.query(
      `SELECT * FROM orders WHERE order_number = ? AND phone = ?`,
      [orderNumber, phone]
    );
    return rows[0] || null;
  },

  async addItem({ order_id, product_id, variant_id, product_name, variant_label, custom_weight, product_image, price, quantity, subtotal, offer_container_id, offer_discount }) {
    const [result] = await pool.query(
      `INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_label, custom_weight, product_image, price, quantity, subtotal, offer_container_id, offer_discount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_id, product_id || null, variant_id || null,
        product_name, variant_label || null, custom_weight || null,
        product_image || null, price, quantity, subtotal,
        offer_container_id || null, offer_discount || 0,
      ]
    );
    return result.insertId;
  },

  async updateStatus(id, order_status) {
    const [result] = await pool.query(
      'UPDATE orders SET order_status = ? WHERE id = ?',
      [order_status, id]
    );
    return result.affectedRows;
  },

  async getStatsByStatus() {
    const [rows] = await pool.query(
      `SELECT order_status, COUNT(*) AS count, SUM(total_amount) AS revenue
       FROM orders GROUP BY order_status`
    );
    return rows;
  },

  async countAll() {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM orders');
    return total;
  },

  async totalRevenue() {
    const [[{ revenue }]] = await pool.query(
      "SELECT SUM(total_amount) AS revenue FROM orders WHERE order_status = 'delivered'"
    );
    return revenue || 0;
  },
};

module.exports = OrderModel;
