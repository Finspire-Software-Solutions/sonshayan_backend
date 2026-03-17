const { pool } = require('../config/db');

const ReviewModel = {
  async findByProduct(productId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT r.*, u.name AS customer_name
       FROM product_reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [productId, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM product_reviews WHERE product_id = ?',
      [productId]
    );
    return { reviews: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getAverageRating(productId) {
    const [[row]] = await pool.query(
      `SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count
       FROM product_reviews WHERE product_id = ?`,
      [productId]
    );
    return {
      avg_rating: row.avg_rating ? parseFloat(row.avg_rating).toFixed(1) : null,
      review_count: row.review_count,
    };
  },

  async checkPurchased(userId, productId) {
    // Check if user has purchased this product via an order linked to their account
    const [rows] = await pool.query(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.customer_id = ? AND oi.product_id = ? AND o.order_status = 'delivered'
       LIMIT 1`,
      [userId, productId]
    );
    return rows.length > 0;
  },

  async checkDuplicate(userId, productId) {
    const [rows] = await pool.query(
      'SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ? LIMIT 1',
      [userId, productId]
    );
    return rows.length > 0;
  },

  async create({ product_id, user_id, order_id, rating, review_text }) {
    const [result] = await pool.query(
      `INSERT INTO product_reviews (product_id, user_id, order_id, rating, review_text)
       VALUES (?, ?, ?, ?, ?)`,
      [product_id, user_id, order_id, rating, review_text || null]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM product_reviews WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM product_reviews WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = ReviewModel;
