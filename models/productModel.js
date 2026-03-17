const { pool } = require('../config/db');

const ProductModel = {
  async findAll({ page = 1, limit = 12, category_id, search, activeOnly = true, popularOnly = false } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (activeOnly) {
      conditions.push('p.is_active = 1');
    }
    if (popularOnly) {
      conditions.push('p.is_popular = 1');
    }
    if (category_id) {
      conditions.push('p.category_id = ?');
      params.push(category_id);
    }
    if (search) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p ${where}`,
      params
    );

    return { products: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findPopular(limit = 6) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_popular = 1 AND p.is_active = 1
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name,
              ROUND(AVG(r.rating), 1) AS avg_rating,
              COUNT(r.id) AS review_count
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN product_reviews r ON r.product_id = p.id
       WHERE p.id = ?
       GROUP BY p.id`,
      [id]
    );
    return rows[0] || null;
  },

  async findBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.is_active = 1`,
      [slug]
    );
    return rows[0] || null;
  },

  async findImages(productId) {
    const [rows] = await pool.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
      [productId]
    );
    return rows;
  },

  /**
   * Recommendations: same category first, then popular/newest to fill up to `limit`.
   */
  async findRecommendations(productId, categoryId, limit = 6) {
    let results = [];

    // Priority 1: same category
    if (categoryId) {
      const [rows] = await pool.query(
        `SELECT p.id, p.name, p.price, p.main_image
         FROM products p
         WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
         ORDER BY p.is_popular DESC, p.created_at DESC
         LIMIT ?`,
        [categoryId, productId, limit]
      );
      results = rows;
    }

    // Priority 2: fill remaining with popular/newest from any category
    if (results.length < limit) {
      const remaining = limit - results.length;
      const excludeIds = [productId, ...results.map((p) => p.id)];
      const placeholders = excludeIds.map(() => '?').join(',');
      const [rows] = await pool.query(
        `SELECT p.id, p.name, p.price, p.main_image
         FROM products p
         WHERE p.id NOT IN (${placeholders}) AND p.is_active = 1
         ORDER BY p.is_popular DESC, p.created_at DESC
         LIMIT ?`,
        [...excludeIds, remaining]
      );
      results = [...results, ...rows];
    }

    return results;
  },

  async findTopRecommendations(limit = 6) {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.price, p.main_image
       FROM products p
       WHERE p.is_active = 1
       ORDER BY p.is_popular DESC, p.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  },

  async findRelated(productId, categoryId, limit = 4) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
       LIMIT ?`,
      [categoryId, productId, limit]
    );
    return rows;
  },

  async create({ name, slug, description, ingredients, price, price_per_kg, category_id, stock, main_image, is_popular = 0, fresh_today = 0 }) {
    const [result] = await pool.query(
      `INSERT INTO products (name, slug, description, ingredients, price, price_per_kg, category_id, stock, main_image, is_popular, fresh_today)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description, ingredients, price, price_per_kg || null, category_id || null, stock || 0, main_image || null, is_popular ? 1 : 0, fresh_today ? 1 : 0]
    );
    return result.insertId;
  },

  async addImage(productId, imageUrl, sortOrder = 0) {
    const [result] = await pool.query(
      'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)',
      [productId, imageUrl, sortOrder]
    );
    return result.insertId;
  },

  async deleteImages(productId) {
    await pool.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
  },

  async deleteImage(imageId) {
    await pool.query('DELETE FROM product_images WHERE id = ?', [imageId]);
  },

  async update(id, { name, slug, description, ingredients, price, price_per_kg, category_id, stock, main_image, is_active, is_popular, fresh_today }) {
    const [result] = await pool.query(
      `UPDATE products
       SET name = ?, slug = ?, description = ?, ingredients = ?, price = ?, price_per_kg = ?,
           category_id = ?, stock = ?, main_image = ?, is_active = ?,
           is_popular = ?, fresh_today = ?
       WHERE id = ?`,
      [name, slug, description, ingredients, price, price_per_kg || null, category_id || null, stock, main_image, is_active,
       is_popular ? 1 : 0, fresh_today ? 1 : 0, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows;
  },

  async countAll() {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM products WHERE is_active = 1');
    return total;
  },
};

module.exports = ProductModel;
