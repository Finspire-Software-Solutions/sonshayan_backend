require('dotenv').config();
const { pool } = require('../config/db');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hero_slides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        badge VARCHAR(100),
        title TEXT NOT NULL,
        description TEXT,
        button_text VARCHAR(100),
        button_link VARCHAR(255),
        button2_text VARCHAR(100),
        button2_link VARCHAR(255),
        image_url VARCHAR(500),
        background_image VARCHAR(500) NULL,
        bg_color_from VARCHAR(20) DEFAULT '#400303',
        bg_color_to VARCHAR(20) DEFAULT '#400303',
        emoji VARCHAR(10) DEFAULT '🍟',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        order_index INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_active (is_active),
        INDEX idx_order (order_index)
      )
    `);
    console.log('✅ hero_slides table created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
