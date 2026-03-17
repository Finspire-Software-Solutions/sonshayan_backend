const { pool } = require('../config/db');

const CouponModel = {
  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      'SELECT * FROM coupons ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM coupons');
    return { coupons: rows, total, page, limit };
  },

  async findByCode(code) {
    const [rows] = await pool.query('SELECT * FROM coupons WHERE code = ?', [code.toUpperCase()]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM coupons WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ code, discount_type, discount_value, min_order_amount, expiration_date, usage_limit }) {
    const [result] = await pool.query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, expiration_date, usage_limit)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase(),
        discount_type,
        discount_value,
        min_order_amount || 0,
        expiration_date || null,
        usage_limit || null,
      ]
    );
    return result.insertId;
  },

  async update(id, { code, discount_type, discount_value, min_order_amount, expiration_date, usage_limit, is_active }) {
    const [result] = await pool.query(
      `UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?,
       min_order_amount = ?, expiration_date = ?, usage_limit = ?, is_active = ? WHERE id = ?`,
      [
        code.toUpperCase(), discount_type, discount_value,
        min_order_amount || 0, expiration_date || null,
        usage_limit || null, is_active !== undefined ? is_active : 1, id
      ]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM coupons WHERE id = ?', [id]);
    return result.affectedRows;
  },

  async incrementUsage(id) {
    await pool.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [id]);
  },

  async recordUsage({ coupon_id, user_id, order_id }) {
    await pool.query(
      'INSERT INTO coupon_usage (coupon_id, user_id, order_id) VALUES (?, ?, ?)',
      [coupon_id, user_id || null, order_id]
    );
  },

  async hasUserUsedCoupon(coupon_id, user_id) {
    if (!user_id) return false;
    const [rows] = await pool.query(
      'SELECT id FROM coupon_usage WHERE coupon_id = ? AND user_id = ? LIMIT 1',
      [coupon_id, user_id]
    );
    return rows.length > 0;
  },
};

module.exports = CouponModel;
