const { pool } = require('../config/db');

const ProductVariantModel = {
  async findByProductId(productId) {
    const [rows] = await pool.query(
      `SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY weight_grams ASC, price ASC`,
      [productId]
    );
    return rows;
  },

  async findAllByProductId(productId) {
    const [rows] = await pool.query(
      `SELECT * FROM product_variants WHERE product_id = ? ORDER BY weight_grams ASC, price ASC`,
      [productId]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM product_variants WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ product_id, size_label, weight_grams, price, price_per_kg, is_active = 1 }) {
    const [result] = await pool.query(
      `INSERT INTO product_variants (product_id, size_label, weight_grams, price, price_per_kg, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [product_id, size_label, weight_grams || null, price, price_per_kg || null, is_active]
    );
    return result.insertId;
  },

  async update(id, { size_label, weight_grams, price, price_per_kg, is_active }) {
    const [result] = await pool.query(
      `UPDATE product_variants SET size_label = ?, weight_grams = ?, price = ?, price_per_kg = ?, is_active = ? WHERE id = ?`,
      [size_label, weight_grams || null, price, price_per_kg || null, is_active, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM product_variants WHERE id = ?', [id]);
    return result.affectedRows;
  },

  async deleteByProductId(productId) {
    await pool.query('DELETE FROM product_variants WHERE product_id = ?', [productId]);
  },
};

module.exports = ProductVariantModel;
