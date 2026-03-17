const { pool } = require('../config/db');

const ComboModel = {
  async findAll({ activeOnly = true } = {}) {
    const where = activeOnly ? 'WHERE c.is_active = 1' : '';
    const [rows] = await pool.query(
      `SELECT c.* FROM combos c ${where} ORDER BY c.created_at DESC`
    );

    // Attach items for each combo
    for (const combo of rows) {
      combo.items = await ComboModel.findItems(combo.id);
    }

    return rows;
  },

  async findById(id) {
    const [[combo]] = await pool.query('SELECT * FROM combos WHERE id = ?', [id]);
    if (!combo) return null;
    combo.items = await ComboModel.findItems(id);
    return combo;
  },

  async findItems(comboId) {
    const [rows] = await pool.query(
      `SELECT ci.id, ci.combo_id, ci.product_id, ci.product_name,
              p.main_image, p.price
       FROM combo_items ci
       LEFT JOIN products p ON p.id = ci.product_id
       WHERE ci.combo_id = ?`,
      [comboId]
    );
    return rows;
  },

  async create({ name, description, price, image, is_active = 1 }) {
    const [result] = await pool.query(
      `INSERT INTO combos (name, description, price, image, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [name, description || null, price, image || null, is_active ? 1 : 0]
    );
    return result.insertId;
  },

  async addItem(comboId, { product_id, product_name }) {
    const [result] = await pool.query(
      `INSERT INTO combo_items (combo_id, product_id, product_name) VALUES (?, ?, ?)`,
      [comboId, product_id || null, product_name]
    );
    return result.insertId;
  },

  async deleteItems(comboId) {
    await pool.query('DELETE FROM combo_items WHERE combo_id = ?', [comboId]);
  },

  async update(id, { name, description, price, image, is_active }) {
    const [result] = await pool.query(
      `UPDATE combos SET name = ?, description = ?, price = ?, image = ?, is_active = ? WHERE id = ?`,
      [name, description || null, price, image, is_active ? 1 : 0, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM combos WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = ComboModel;
