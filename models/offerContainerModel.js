const { pool } = require('../config/db');

const OfferContainerModel = {
  async findAll({ activeOnly = false } = {}) {
    const today = new Date().toISOString().slice(0, 10);
    let where = '';
    if (activeOnly) {
      where = `WHERE oc.is_active = 1 AND (oc.start_date IS NULL OR oc.start_date <= '${today}')
               AND (oc.end_date IS NULL OR oc.end_date >= '${today}')`;
    }
    const [rows] = await pool.query(
      `SELECT oc.* FROM offer_containers oc ${where} ORDER BY oc.created_at DESC`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM offer_containers WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findProducts(containerId) {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.price, p.main_image, p.is_active
       FROM offer_container_products ocp
       JOIN products p ON p.id = ocp.product_id
       WHERE ocp.container_id = ?`,
      [containerId]
    );
    return rows;
  },

  async isProductEligible(containerId, productId) {
    const [rows] = await pool.query(
      `SELECT 1 FROM offer_container_products WHERE container_id = ? AND product_id = ?`,
      [containerId, productId]
    );
    return rows.length > 0;
  },

  async create({ name, discount_percent, max_items, is_active, start_date, end_date }) {
    const [result] = await pool.query(
      `INSERT INTO offer_containers (name, discount_percent, max_items, is_active, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, discount_percent || 0, max_items || 5, is_active !== undefined ? is_active : 1,
       start_date || null, end_date || null]
    );
    return result.insertId;
  },

  async update(id, { name, discount_percent, max_items, is_active, start_date, end_date }) {
    const [result] = await pool.query(
      `UPDATE offer_containers SET name = ?, discount_percent = ?, max_items = ?, is_active = ?, start_date = ?, end_date = ? WHERE id = ?`,
      [name, discount_percent, max_items, is_active, start_date || null, end_date || null, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM offer_containers WHERE id = ?', [id]);
    return result.affectedRows;
  },

  async addProduct(containerId, productId) {
    await pool.query(
      `INSERT IGNORE INTO offer_container_products (container_id, product_id) VALUES (?, ?)`,
      [containerId, productId]
    );
  },

  async removeProduct(containerId, productId) {
    await pool.query(
      `DELETE FROM offer_container_products WHERE container_id = ? AND product_id = ?`,
      [containerId, productId]
    );
  },

  async setProducts(containerId, productIds) {
    // Replace all products for this container
    await pool.query('DELETE FROM offer_container_products WHERE container_id = ?', [containerId]);
    for (const pid of productIds) {
      await pool.query(
        `INSERT IGNORE INTO offer_container_products (container_id, product_id) VALUES (?, ?)`,
        [containerId, pid]
      );
    }
  },
};

module.exports = OfferContainerModel;
