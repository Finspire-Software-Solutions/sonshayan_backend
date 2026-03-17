const ProductService = require('../services/productService');

const productController = {
  async getAll(req, res, next) {
    try {
      const result = await ProductService.getProducts(req.query);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getAllAdmin(req, res, next) {
    try {
      const result = await ProductService.getProductsAdmin(req.query);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getPopular(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 6;
      const products = await ProductService.getPopularProducts(limit);
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const product = await ProductService.createProduct(req.body, req.files);
      res.status(201).json({ success: true, data: product, message: 'Product created successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body, req.files);
      res.json({ success: true, data: product, message: 'Product updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await ProductService.deleteProduct(req.params.id);
      res.json({ success: true, message: 'Product deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async getRecommendations(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 6;
      const products = await ProductService.getRecommendations(req.params.productId, limit);
      res.json({ success: true, products });
    } catch (err) {
      next(err);
    }
  },

  async getTopRecommendations(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 6;
      const products = await ProductService.getTopRecommendations(limit);
      res.json({ success: true, products });
    } catch (err) {
      next(err);
    }
  },

  async deleteImage(req, res, next) {
    try {
      await ProductService.deleteProductImage(req.params.imageId);
      res.json({ success: true, message: 'Image deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },

  // ── Variant endpoints ────────────────────────────────────────
  async getVariants(req, res, next) {
    try {
      const variants = await ProductService.getVariants(req.params.id);
      res.json({ success: true, data: variants });
    } catch (err) {
      next(err);
    }
  },

  async createVariant(req, res, next) {
    try {
      const variant = await ProductService.createVariant(req.params.id, req.body);
      res.status(201).json({ success: true, data: variant, message: 'Variant created successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async updateVariant(req, res, next) {
    try {
      const variant = await ProductService.updateVariant(req.params.variantId, req.body);
      res.json({ success: true, data: variant, message: 'Variant updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async deleteVariant(req, res, next) {
    try {
      await ProductService.deleteVariant(req.params.variantId);
      res.json({ success: true, message: 'Variant deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = productController;
