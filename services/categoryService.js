const slugify = require('slugify');
const CategoryModel = require('../models/categoryModel');

const generateSlug = (name) =>
  slugify(name, { lower: true, strict: true, trim: true });

const CategoryService = {
  async getCategories(activeOnly = false) {
    return CategoryModel.findAll({ activeOnly });
  },

  async getCategoryById(id) {
    const category = await CategoryModel.findById(id);
    if (!category) throw { status: 404, message: 'Category not found.' };
    return category;
  },

  async createCategory(data, file) {
    const slug = generateSlug(data.name);
    const existing = await CategoryModel.findBySlug(slug);
    if (existing) throw { status: 409, message: 'Category with this name already exists.' };

    const image = file ? file.path : null;

    const id = await CategoryModel.create({
      name: data.name,
      slug,
      description: data.description,
      image,
    });

    return CategoryModel.findById(id);
  },

  async updateCategory(id, data, file) {
    const category = await CategoryModel.findById(id);
    if (!category) throw { status: 404, message: 'Category not found.' };

    const slug = generateSlug(data.name);
    const image = file ? file.path : category.image;

    await CategoryModel.update(id, {
      name: data.name,
      slug,
      description: data.description,
      image,
      is_active: data.is_active !== undefined ? data.is_active : category.is_active,
    });

    return CategoryModel.findById(id);
  },

  async deleteCategory(id) {
    const category = await CategoryModel.findById(id);
    if (!category) throw { status: 404, message: 'Category not found.' };
    await CategoryModel.delete(id);
  },
};

module.exports = CategoryService;
