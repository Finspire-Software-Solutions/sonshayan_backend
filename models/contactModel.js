const { pool } = require('../config/db');

const ContactModel = {
  async findAll({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      'SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM contacts');
    return { contacts: rows, total, page, limit };
  },

  async create({ name, email, phone, message }) {
    const [result] = await pool.query(
      'INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)',
      [name, email, phone || null, message]
    );
    return result.insertId;
  },

  async markRead(id) {
    await pool.query('UPDATE contacts SET is_read = 1 WHERE id = ?', [id]);
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM contacts WHERE id = ?', [id]);
    return result.affectedRows;
  },

  async countUnread() {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM contacts WHERE is_read = 0'
    );
    return count;
  },
};

module.exports = ContactModel;
