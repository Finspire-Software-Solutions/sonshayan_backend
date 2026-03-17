const { pool } = require('../config/db');

const UserModel = {
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, address, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findAll({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM users');
    return { users: rows, total, page, limit };
  },

  async create({ name, email, password, role, phone, address }) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, password, role, phone || null, address || null]
    );
    return result.insertId;
  },

  async update(id, { name, email, role, is_active }) {
    const [result] = await pool.query(
      'UPDATE users SET name = ?, email = ?, role = ?, is_active = ? WHERE id = ?',
      [name, email, role, is_active, id]
    );
    return result.affectedRows;
  },

  async updateProfile(id, { name, phone, address }) {
    const [result] = await pool.query(
      'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
      [name, phone || null, address || null, id]
    );
    return result.affectedRows;
  },

  async updatePassword(id, hashedPassword) {
    const [result] = await pool.query('UPDATE users SET password = ? WHERE id = ?', [
      hashedPassword,
      id,
    ]);
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = UserModel;
