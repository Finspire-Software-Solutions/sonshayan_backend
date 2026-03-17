const { pool } = require('../config/db');

const CategoryModel = {
  async findAll({ activeOnly = false } = {}) {
    const where = activeOnly ? 'WHERE c.is_active = 1' : '';
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
       ${where}
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findBySlug(slug) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE slug = ?', [slug]);
    return rows[0] || null;
  },

  async create({ name, slug, description, image }) {
    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, description, image) VALUES (?, ?, ?, ?)',
      [name, slug, description || null, image || null]
    );
    return result.insertId;
  },

  async update(id, { name, slug, description, image, is_active }) {
    const [result] = await pool.query(
      'UPDATE categories SET name = ?, slug = ?, description = ?, image = ?, is_active = ? WHERE id = ?',
      [name, slug, description || null, image || null, is_active, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = CategoryModel;
