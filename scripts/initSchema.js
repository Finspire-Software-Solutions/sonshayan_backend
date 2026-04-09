require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');

async function initSchema() {
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const rawSql = await fs.readFile(schemaPath, 'utf8');

  // Use the currently configured Clever Cloud database instead of hardcoded DB statements.
  const sanitizedSql = rawSql
    .replace(/^\s*CREATE DATABASE IF NOT EXISTS .*?;\s*$/gim, '')
    .replace(/^\s*USE .*?;\s*$/gim, '')
    // Some MySQL setups reject emoji defaults unless utf8mb4 is explicitly configured.
    .replace(/DEFAULT\s+'🍟'/g, "DEFAULT NULL");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    await connection.query(sanitizedSql);
    console.log('✅ Schema initialized successfully.');
  } finally {
    await connection.end();
  }
}

initSchema().catch((error) => {
  console.error('❌ Failed to initialize schema:', error.message);
  process.exit(1);
});
