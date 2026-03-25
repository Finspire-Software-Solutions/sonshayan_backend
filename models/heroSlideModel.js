const { pool } = require('../config/db');

const HeroSlideModel = {
  async findAllActive() {
    const [rows] = await pool.query(
      'SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY order_index ASC, id ASC'
    );
    return rows;
  },

  async findAll() {
    const [rows] = await pool.query(
      'SELECT * FROM hero_slides ORDER BY order_index ASC, id ASC'
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM hero_slides WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const {
      badge, title, description, button_text, button_link,
      button2_text, button2_link, image_url, background_image,
      bg_color_from, bg_color_to, emoji, is_active, order_index,
    } = data;
    const [result] = await pool.query(
      `INSERT INTO hero_slides
        (badge, title, description, button_text, button_link,
         button2_text, button2_link, image_url, background_image,
         bg_color_from, bg_color_to, emoji, is_active, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        badge || null, title, description || null,
        button_text || null, button_link || null,
        button2_text || null, button2_link || null,
        image_url || null, background_image || null,
        bg_color_from || '#400303', bg_color_to || '#400303',
        emoji || '🍟', is_active !== undefined ? is_active : 1,
        order_index || 0,
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    const {
      badge, title, description, button_text, button_link,
      button2_text, button2_link, image_url, background_image,
      bg_color_from, bg_color_to, emoji, is_active, order_index,
    } = data;
    const [result] = await pool.query(
      `UPDATE hero_slides SET
        badge = ?, title = ?, description = ?, button_text = ?, button_link = ?,
        button2_text = ?, button2_link = ?, image_url = ?, background_image = ?,
        bg_color_from = ?, bg_color_to = ?, emoji = ?, is_active = ?, order_index = ?
       WHERE id = ?`,
      [
        badge || null, title, description || null,
        button_text || null, button_link || null,
        button2_text || null, button2_link || null,
        image_url || null, background_image || null,
        bg_color_from || '#400303', bg_color_to || '#400303',
        emoji || '🍟', is_active !== undefined ? is_active : 1,
        order_index || 0, id,
      ]
    );
    return result.affectedRows;
  },

  async toggleActive(id, is_active) {
    const [result] = await pool.query(
      'UPDATE hero_slides SET is_active = ? WHERE id = ?',
      [is_active ? 1 : 0, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM hero_slides WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = HeroSlideModel;
