const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'yamabiko.proxy.rlwy.net',
  port: process.env.DB_PORT || 43824,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'eDxqsUqwUinQAHnPXsHCXTVNmlcFAxfb',
  database: process.env.DB_NAME || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

// Test connection on startup
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
