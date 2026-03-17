const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const AuthService = {
  async register(name, email, password) {
    const existing = await UserModel.findByEmail(email);
    if (existing) throw { status: 409, message: 'An account with this email already exists.' };

    const hashed = await bcrypt.hash(password, 12);
    const userId = await UserModel.create({ name, email, password: hashed, role: 'CUSTOMER' });
    const user = await UserModel.findById(userId);

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return { token, user };
  },

  async updateProfile(userId, { name, phone, address }) {
    await UserModel.updateProfile(userId, { name, phone, address });
    return UserModel.findById(userId);
  },

  async login(email, password) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw { status: 401, message: 'Invalid email or password.' };
    }

    if (!user.is_active) {
      throw { status: 403, message: 'Account is deactivated. Contact administrator.' };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw { status: 401, message: 'Invalid email or password.' };
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async hashPassword(password) {
    return bcrypt.hash(password, 12);
  },

  async changePassword(userId, currentPassword, newPassword) {
    // Re-fetch user with password field included
    const { pool } = require('../config/db');
    const [[fullRow]] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (!fullRow) throw { status: 404, message: 'User not found.' };

    const isMatch = await bcrypt.compare(currentPassword, fullRow.password);
    if (!isMatch) throw { status: 400, message: 'Current password is incorrect.' };

    const hashed = await bcrypt.hash(newPassword, 12);
    await UserModel.updatePassword(userId, hashed);
  },
};

module.exports = AuthService;
