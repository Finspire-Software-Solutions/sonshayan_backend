const slugify = require('slugify');
const fs = require('fs');
const path = require('path');
const ProductModel = require('../models/productModel');
const ProductVariantModel = require('../models/productVariantModel');

const generateSlug = (name) =>
  slugify(name, { lower: true, strict: true, trim: true });

const deleteFile = (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

const ProductService = {
  async getProducts(query) {
    return ProductModel.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 12,
      category_id: query.category_id || null,
      search: query.search || null,
      activeOnly: true,
    });
  },

  async getProductsAdmin(query) {
    return ProductModel.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 15,
      category_id: query.category_id || null,
      search: query.search || null,
      activeOnly: false,
    });
  },

  async getPopularProducts(limit = 6) {
    return ProductModel.findPopular(limit);
  },

  async getProductById(id) {
    const product = await ProductModel.findById(id);
    if (!product) throw { status: 404, message: 'Product not found.' };

    const images = await ProductModel.findImages(id);
    const related = await ProductModel.findRelated(id, product.category_id);
    const variants = await ProductVariantModel.findByProductId(id);

    return { ...product, images, related, variants };
  },

  async createProduct(data, files) {
    const slug = generateSlug(data.name);

    const existing = await ProductModel.findBySlug(slug);
    if (existing) throw { status: 409, message: 'A product with this name already exists.' };

    const mainImageFile = files?.main_image?.[0];
    const main_image = mainImageFile ? mainImageFile.path.replace(/\\/g, '/') : null;

    const productId = await ProductModel.create({
      name: data.name,
      slug,
      description: data.description,
      ingredients: data.ingredients,
      price: parseFloat(data.price),
      price_per_kg: data.price_per_kg ? parseFloat(data.price_per_kg) : null,
      category_id: data.category_id || null,
      stock: parseInt(data.stock) || 0,
      main_image,
      is_popular: data.is_popular === 'true' || data.is_popular === true ? 1 : 0,
      fresh_today: data.fresh_today === 'true' || data.fresh_today === true ? 1 : 0,
    });

    // Handle gallery images
    const galleryFiles = files?.gallery || [];
    for (let i = 0; i < galleryFiles.length; i++) {
      const imgPath = galleryFiles[i].path.replace(/\\/g, '/');
      await ProductModel.addImage(productId, imgPath, i);
    }

    return ProductModel.findById(productId);
  },

  async updateProduct(id, data, files) {
    const product = await ProductModel.findById(id);
    if (!product) throw { status: 404, message: 'Product not found.' };

    const slug = generateSlug(data.name);
    let main_image = product.main_image;

    // Replace main image if new file uploaded
    if (files?.main_image?.[0]) {
      deleteFile(product.main_image);
      main_image = files.main_image[0].path.replace(/\\/g, '/');
    }

    await ProductModel.update(id, {
      name: data.name,
      slug,
      description: data.description,
      ingredients: data.ingredients,
      price: parseFloat(data.price),
      price_per_kg: data.price_per_kg ? parseFloat(data.price_per_kg) : null,
      category_id: data.category_id || null,
      stock: parseInt(data.stock) || 0,
      main_image,
      is_active: data.is_active !== undefined ? data.is_active : product.is_active,
      is_popular: data.is_popular === 'true' || data.is_popular === true ? 1 : 0,
      fresh_today: data.fresh_today === 'true' || data.fresh_today === true ? 1 : 0,
    });

    // Add new gallery images if uploaded
    const galleryFiles = files?.gallery || [];
    for (let i = 0; i < galleryFiles.length; i++) {
      const imgPath = galleryFiles[i].path.replace(/\\/g, '/');
      await ProductModel.addImage(id, imgPath, i);
    }

    return ProductModel.findById(id);
  },

  async deleteProduct(id) {
    const product = await ProductModel.findById(id);
    if (!product) throw { status: 404, message: 'Product not found.' };

    deleteFile(product.main_image);
    await ProductModel.delete(id);
  },

  async getRecommendations(productId, limit = 6) {
    const product = await ProductModel.findById(productId);
    if (!product) throw { status: 404, message: 'Product not found.' };
    return ProductModel.findRecommendations(productId, product.category_id, limit);
  },

  async getTopRecommendations(limit = 6) {
    return ProductModel.findTopRecommendations(limit);
  },

  // ── Product Variants ───────────────────────────────────────
  async getVariants(productId) {
    const product = await ProductModel.findById(productId);
    if (!product) throw { status: 404, message: 'Product not found.' };
    return ProductVariantModel.findAllByProductId(productId);
  },

  async createVariant(productId, data) {
    const product = await ProductModel.findById(productId);
    if (!product) throw { status: 404, message: 'Product not found.' };
    const variantId = await ProductVariantModel.create({
      product_id: productId,
      size_label: data.size_label,
      weight_grams: data.weight_grams ? parseFloat(data.weight_grams) : null,
      price: parseFloat(data.price),
      price_per_kg: data.price_per_kg ? parseFloat(data.price_per_kg) : null,
      is_active: data.is_active !== undefined ? data.is_active : 1,
    });
    return ProductVariantModel.findById(variantId);
  },

  async updateVariant(variantId, data) {
    const variant = await ProductVariantModel.findById(variantId);
    if (!variant) throw { status: 404, message: 'Variant not found.' };
    await ProductVariantModel.update(variantId, {
      size_label: data.size_label,
      weight_grams: data.weight_grams ? parseFloat(data.weight_grams) : null,
      price: parseFloat(data.price),
      price_per_kg: data.price_per_kg ? parseFloat(data.price_per_kg) : null,
      is_active: data.is_active !== undefined ? parseInt(data.is_active) : variant.is_active,
    });
    return ProductVariantModel.findById(variantId);
  },

  async deleteVariant(variantId) {
    const variant = await ProductVariantModel.findById(variantId);
    if (!variant) throw { status: 404, message: 'Variant not found.' };
    await ProductVariantModel.delete(variantId);
  },

  async deleteProductImage(imageId) {
    const { pool } = require('../config/db');
    const [[img]] = await pool.query('SELECT * FROM product_images WHERE id = ?', [imageId]);
    if (!img) throw { status: 404, message: 'Image not found.' };
    deleteFile(img.image_url);
    await ProductModel.deleteImage(imageId);
  },
};

module.exports = ProductService;
