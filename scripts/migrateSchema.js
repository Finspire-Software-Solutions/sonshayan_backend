require('dotenv').config();
const { pool } = require('../config/db');

async function tableExists(tableName) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?
     LIMIT 1`,
    [tableName]
  );
  return rows.length > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
     LIMIT 1`,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function ensureColumn(tableName, columnName, definition) {
  const exists = await columnExists(tableName, columnName);
  if (exists) {
    console.log(`✓ ${tableName}.${columnName} already exists`);
    return;
  }
  await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  console.log(`+ Added ${tableName}.${columnName}`);
}

async function ensureIndex(tableName, indexName, sql) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?
     LIMIT 1`,
    [tableName, indexName]
  );
  if (rows.length > 0) {
    console.log(`✓ Index ${indexName} exists on ${tableName}`);
    return;
  }
  await pool.query(sql);
  console.log(`+ Added index ${indexName} on ${tableName}`);
}

async function run() {
  try {
    // Users table upgrades
    if (await tableExists('users')) {
      await ensureColumn('users', 'phone', 'VARCHAR(20) DEFAULT NULL');
      await ensureColumn('users', 'address', 'TEXT DEFAULT NULL');
      await pool.query(
        "ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN','DELIVERY','CUSTOMER') NOT NULL DEFAULT 'DELIVERY'"
      );
      console.log('~ Updated users.role enum');
    }

    // Products table upgrades
    if (await tableExists('products')) {
      await ensureColumn('products', 'price_per_kg', 'DECIMAL(10,2) DEFAULT NULL');
      await ensureColumn('products', 'is_popular', 'TINYINT(1) NOT NULL DEFAULT 0');
      await ensureColumn('products', 'fresh_today', 'TINYINT(1) NOT NULL DEFAULT 0');
      await ensureIndex(
        'products',
        'idx_popular',
        'CREATE INDEX idx_popular ON products (is_popular)'
      );
    }

    // Orders table upgrades
    if (await tableExists('orders')) {
      await ensureColumn('orders', 'customer_id', 'INT DEFAULT NULL');
      await ensureColumn('orders', 'advance_paid', 'DECIMAL(10,2) NOT NULL DEFAULT 0.00');
      await ensureColumn('orders', 'remaining_balance', 'DECIMAL(10,2) NOT NULL DEFAULT 0.00');
      await ensureColumn('orders', 'coupon_discount', 'DECIMAL(10,2) NOT NULL DEFAULT 0.00');
      await ensureColumn('orders', 'coupon_code', 'VARCHAR(50) DEFAULT NULL');
      await ensureColumn('orders', 'delivery_lat', 'DECIMAL(10,7) DEFAULT NULL');
      await ensureColumn('orders', 'delivery_lng', 'DECIMAL(10,7) DEFAULT NULL');
      await ensureColumn('orders', 'delivery_updated_at', 'TIMESTAMP NULL DEFAULT NULL');
      await ensureColumn('orders', 'delivery_fee', 'DECIMAL(10,2) NOT NULL DEFAULT 0.00');
      await ensureColumn('orders', 'delivery_distance_km', 'DECIMAL(8,3) DEFAULT NULL');
      await ensureIndex(
        'orders',
        'idx_customer',
        'CREATE INDEX idx_customer ON orders (customer_id)'
      );
      await pool.query(
        "ALTER TABLE orders MODIFY COLUMN payment_method ENUM('cash_by_hand','online','advance') NOT NULL DEFAULT 'cash_by_hand'"
      );
      await pool.query(
        "ALTER TABLE orders MODIFY COLUMN order_status ENUM('pending','confirmed','preparing','shipped','out_for_delivery','delivered','cancelled','processing') NOT NULL DEFAULT 'pending'"
      );
      console.log('~ Updated orders enums');
    }

    // Order items table upgrades
    if (await tableExists('order_items')) {
      await ensureColumn('order_items', 'variant_id', 'INT DEFAULT NULL');
      await ensureColumn('order_items', 'variant_label', 'VARCHAR(100) DEFAULT NULL');
      await ensureColumn('order_items', 'custom_weight', 'DECIMAL(10,3) DEFAULT NULL');
      await ensureColumn('order_items', 'offer_container_id', 'INT DEFAULT NULL');
      await ensureColumn('order_items', 'offer_discount', 'DECIMAL(10,2) NOT NULL DEFAULT 0.00');
    }

    console.log('✅ Schema migration completed successfully.');
  } catch (error) {
    console.error('❌ Schema migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
