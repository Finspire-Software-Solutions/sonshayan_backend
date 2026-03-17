const UserService = require('../services/userService');

const userController = {
  async getAll(req, res, next) {
    try {
      const result = await UserService.getUsers(req.query);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const user = await UserService.getUserById(req.params.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const user = await UserService.createUser(req.body);
      res.status(201).json({ success: true, data: user, message: 'User created successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const user = await UserService.updateUser(req.params.id, req.body);
      res.json({ success: true, data: user, message: 'User updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await UserService.deleteUser(req.params.id, req.user.id);
      res.json({ success: true, message: 'User deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userController;
