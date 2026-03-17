const ReviewModel = require('../models/reviewModel');
const OrderModel = require('../models/orderModel');

const reviewController = {
  // GET /api/products/:id/reviews
  async getProductReviews(req, res, next) {
    try {
      const productId = req.params.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const [reviewsData, ratingData] = await Promise.all([
        ReviewModel.findByProduct(productId, page, limit),
        ReviewModel.getAverageRating(productId),
      ]);
      res.json({ success: true, data: { ...reviewsData, ...ratingData } });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/products/:id/reviews  (authenticated CUSTOMER)
  async submitReview(req, res, next) {
    try {
      const productId = req.params.id;
      const userId = req.user.id;
      const { rating, review_text, order_id } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5.' });
      }

      // Check the user is a CUSTOMER
      if (req.user.role !== 'CUSTOMER') {
        return res.status(403).json({ success: false, error: 'Only customers can submit reviews.' });
      }

      // Verify this customer purchased the product (delivered order)
      const hasPurchased = await ReviewModel.checkPurchased(userId, productId);
      if (!hasPurchased) {
        return res.status(403).json({ success: false, error: 'You can only review products you have purchased.' });
      }

      // Check for duplicate review on same product
      const isDuplicate = await ReviewModel.checkDuplicate(userId, productId);
      if (isDuplicate) {
        return res.status(409).json({ success: false, error: 'You have already reviewed this product.' });
      }

      // Find a delivered order that contains this product for the order_id
      let resolvedOrderId = order_id;
      if (!resolvedOrderId) {
        const { pool } = require('../config/db');
        const [[row]] = await pool.query(
          `SELECT o.id FROM orders o
           JOIN order_items oi ON oi.order_id = o.id
           WHERE o.customer_id = ? AND oi.product_id = ? AND o.order_status = 'delivered'
           ORDER BY o.created_at DESC LIMIT 1`,
          [userId, productId]
        );
        resolvedOrderId = row?.id;
      }

      if (!resolvedOrderId) {
        return res.status(403).json({ success: false, error: 'No valid delivered order found for this product.' });
      }

      const id = await ReviewModel.create({
        product_id: productId,
        user_id: userId,
        order_id: resolvedOrderId,
        rating: parseInt(rating),
        review_text,
      });

      const review = await ReviewModel.findById(id);
      res.status(201).json({ success: true, data: review, message: 'Review submitted successfully.' });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/products/:id/reviews/:reviewId  (admin only)
  async deleteReview(req, res, next) {
    try {
      await ReviewModel.delete(req.params.reviewId);
      res.json({ success: true, message: 'Review deleted.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reviewController;
