const CouponModel = require('../models/couponModel');

const CouponService = {
  async validateCoupon(code, orderTotal, userId = null) {
    const coupon = await CouponModel.findByCode(code);
    if (!coupon) throw { status: 404, message: 'Invalid coupon code.' };
    if (!coupon.is_active) throw { status: 400, message: 'This coupon is no longer active.' };

    // Check expiry
    if (coupon.expiration_date && new Date(coupon.expiration_date) < new Date()) {
      throw { status: 400, message: 'This coupon has expired.' };
    }

    // Check usage limit
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      throw { status: 400, message: 'This coupon has reached its usage limit.' };
    }

    // Check min order amount
    if (orderTotal < parseFloat(coupon.min_order_amount)) {
      throw {
        status: 400,
        message: `Minimum order amount of LKR ${coupon.min_order_amount} required for this coupon.`,
      };
    }

    // Check user-level reuse
    if (userId) {
      const alreadyUsed = await CouponModel.hasUserUsedCoupon(coupon.id, userId);
      if (alreadyUsed) throw { status: 400, message: 'You have already used this coupon.' };
    }

    // Calculate discount
    let discountAmount;
    if (coupon.discount_type === 'percentage') {
      discountAmount = parseFloat(((parseFloat(coupon.discount_value) / 100) * orderTotal).toFixed(2));
    } else {
      discountAmount = Math.min(parseFloat(coupon.discount_value), orderTotal);
    }

    return {
      coupon_id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount: discountAmount,
      final_total: parseFloat((orderTotal - discountAmount).toFixed(2)),
    };
  },

  async getCoupons(page = 1, limit = 20) {
    return CouponModel.findAll(page, limit);
  },

  async createCoupon(data) {
    const existing = await CouponModel.findByCode(data.code);
    if (existing) throw { status: 409, message: 'Coupon code already exists.' };
    const id = await CouponModel.create(data);
    return CouponModel.findById(id);
  },

  async updateCoupon(id, data) {
    const coupon = await CouponModel.findById(id);
    if (!coupon) throw { status: 404, message: 'Coupon not found.' };
    await CouponModel.update(id, data);
    return CouponModel.findById(id);
  },

  async deleteCoupon(id) {
    const coupon = await CouponModel.findById(id);
    if (!coupon) throw { status: 404, message: 'Coupon not found.' };
    await CouponModel.delete(id);
  },
};

module.exports = CouponService;
