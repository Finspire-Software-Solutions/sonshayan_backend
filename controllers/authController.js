const AuthService = require('../services/authService');

const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const result = await AuthService.register(name, email, password);
      res.status(201).json({ success: true, data: result, message: 'Account created successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { name, phone, address } = req.body;
      const user = await AuthService.updateProfile(req.user.id, { name, phone, address });
      res.json({ success: true, data: user, message: 'Profile updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.json({ success: true, data: result, message: 'Login successful.' });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const UserModel = require('../models/userModel');
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
