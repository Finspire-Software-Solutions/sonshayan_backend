const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'bvpu6qq7nfejrnx1c0ky-mysql.services.clever-cloud.com',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'uan2gyejedqd4plp',
  password: process.env.DB_PASSWORD || 'jEGxBRWKUJDL150IXKuQ',
  database: process.env.DB_NAME || 'bvpu6qq7nfejrnx1c0ky',
  waitForConnections: true,
  connectionLimit: 4,
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
