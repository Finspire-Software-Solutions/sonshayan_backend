const CategoryService = require('../services/categoryService');

const categoryController = {
  async getAll(req, res, next) {
    try {
      const activeOnly = req.query.active === 'true';
      const categories = await CategoryService.getCategories(activeOnly);
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id);
      res.json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const category = await CategoryService.createCategory(req.body, req.file);
      res.status(201).json({ success: true, data: category, message: 'Category created successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const category = await CategoryService.updateCategory(req.params.id, req.body, req.file);
      res.json({ success: true, data: category, message: 'Category updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await CategoryService.deleteCategory(req.params.id);
      res.json({ success: true, message: 'Category deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = categoryController;
