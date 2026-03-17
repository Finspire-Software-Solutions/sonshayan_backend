require('dotenv').config();
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  const password = 'Admin@123';
  const hash = await bcrypt.hash(password, 12);

  // Check if admin exists
  const [rows] = await pool.query(
    'SELECT id FROM users WHERE email = ?',
    ['admin@sonchayan.com']
  );

  if (rows.length > 0) {
    await pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hash, 'admin@sonchayan.com']
    );
    console.log('✅ Admin password updated successfully.');
  } else {
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Super Admin', 'admin@sonchayan.com', hash, 'ADMIN']
    );
    console.log('✅ Admin user created successfully.');
  }

  console.log('📧 Email   : admin@sonchayan.com');
  console.log('🔑 Password: Admin@123');
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
