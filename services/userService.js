const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');

const UserService = {
  async getUsers(query) {
    return UserModel.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
    });
  },

  async getUserById(id) {
    const user = await UserModel.findById(id);
    if (!user) throw { status: 404, message: 'User not found.' };
    return user;
  },

  async createUser({ name, email, password, role }) {
    const existing = await UserModel.findByEmail(email);
    if (existing) throw { status: 409, message: 'Email already registered.' };

    const hashed = await bcrypt.hash(password, 12);
    const id = await UserModel.create({ name, email, password: hashed, role });
    return UserModel.findById(id);
  },

  async updateUser(id, { name, email, role, is_active }) {
    const user = await UserModel.findById(id);
    if (!user) throw { status: 404, message: 'User not found.' };

    await UserModel.update(id, {
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      is_active: is_active !== undefined ? is_active : user.is_active,
    });

    return UserModel.findById(id);
  },

  async deleteUser(id, requesterId) {
    if (id === requesterId) throw { status: 400, message: 'Cannot delete your own account.' };
    const user = await UserModel.findById(id);
    if (!user) throw { status: 404, message: 'User not found.' };
    await UserModel.delete(id);
  },
};

module.exports = UserService;
