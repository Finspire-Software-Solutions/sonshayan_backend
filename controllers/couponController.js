const CouponService = require('../services/couponService');

const couponController = {
  async validate(req, res, next) {
    try {
      const { code, order_total } = req.body;
      if (!code || !order_total) {
        return res.status(400).json({ success: false, error: 'Coupon code and order total are required.' });
      }
      const userId = req.user?.id || null;
      const result = await CouponService.validateCoupon(code, parseFloat(order_total), userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getAll(req, res, next) {
    try {
      const result = await CouponService.getCoupons(
        parseInt(req.query.page) || 1,
        parseInt(req.query.limit) || 20
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const coupon = await CouponService.createCoupon(req.body);
      res.status(201).json({ success: true, data: coupon, message: 'Coupon created.' });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const coupon = await CouponService.updateCoupon(req.params.id, req.body);
      res.json({ success: true, data: coupon, message: 'Coupon updated.' });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await CouponService.deleteCoupon(req.params.id);
      res.json({ success: true, message: 'Coupon deleted.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = couponController;
