const { pool } = require('../config/db');

const BlogModel = {
  async findAll({ page = 1, limit = 9, publishedOnly = true } = {}) {
    const offset = (page - 1) * limit;
    const where = publishedOnly ? 'WHERE is_published = 1' : '';

    const [rows] = await pool.query(
      `SELECT id, title, slug, thumbnail, author,
              LEFT(content, 300) AS excerpt, created_at
       FROM blogs ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM blogs ${where}`
    );

    return { blogs: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM blogs WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findBySlug(slug) {
    const [rows] = await pool.query('SELECT * FROM blogs WHERE slug = ? AND is_published = 1', [slug]);
    return rows[0] || null;
  },

  async create({ title, slug, thumbnail, content, author }) {
    const [result] = await pool.query(
      'INSERT INTO blogs (title, slug, thumbnail, content, author) VALUES (?, ?, ?, ?, ?)',
      [title, slug, thumbnail || null, content, author || 'Son Shayan Team']
    );
    return result.insertId;
  },

  async update(id, { title, slug, thumbnail, content, author, is_published }) {
    const [result] = await pool.query(
      'UPDATE blogs SET title = ?, slug = ?, thumbnail = ?, content = ?, author = ?, is_published = ? WHERE id = ?',
      [title, slug, thumbnail || null, content, author, is_published, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM blogs WHERE id = ?', [id]);
    return result.affectedRows;
  },

  async countAll() {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM blogs WHERE is_published = 1');
    return total;
  },
};

module.exports = BlogModel;
