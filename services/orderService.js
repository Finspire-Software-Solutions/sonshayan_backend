const OrderModel = require('../models/orderModel');
const ProductModel = require('../models/productModel');
const ComboModel = require('../models/comboModel');
const ProductVariantModel = require('../models/productVariantModel');

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SC-${timestamp}-${random}`;
};

const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'processing'];

const OrderService = {
  async getOrders(query) {
    return OrderModel.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 15,
      status: query.status || null,
    });
  },

  async getOrderById(id) {
    const order = await OrderModel.findById(id);
    if (!order) throw { status: 404, message: 'Order not found.' };
    const items = await OrderModel.findItems(id);
    return { ...order, items };
  },

  async createOrder(data) {
    const { customer_name, phone, address, city, payment_method, items, notes, advance_percent, customer_id, coupon_code, delivery_lat, delivery_lng } = data;

    if (!items || items.length === 0) {
      throw { status: 400, message: 'Order must contain at least one item.' };
    }

    let total_amount = 0;
    const processedItems = [];

    for (const item of items) {
      const qty = parseInt(item.quantity);
      if (!qty || qty < 1) {
        throw { status: 400, message: 'Item quantity must be at least 1.' };
      }

      // ── Combo item: product_id = "combo-{id}" ──────────────────────────
      if (item.product_id && String(item.product_id).startsWith('combo-')) {
        const comboId = parseInt(String(item.product_id).replace('combo-', ''), 10);
        if (!comboId || isNaN(comboId)) {
          throw { status: 400, message: `Invalid combo ID: ${item.product_id}` };
        }

        const combo = await ComboModel.findById(comboId);
        if (!combo) throw { status: 404, message: `Combo ID ${comboId} not found.` };

        const comboPrice = parseFloat(combo.price);
        const subtotal = comboPrice * qty;
        total_amount += subtotal;

        processedItems.push({
          product_id: null,
          product_name: combo.name,
          product_image: combo.image || null,
          price: comboPrice,
          quantity: qty,
          subtotal,
        });
        continue;
      }

      // ── Regular product ────────────────────────────────────────────────
      const productId = item.product_id || item.combo_id;
      if (!productId) {
        throw { status: 400, message: 'Each item must have a product_id or combo_id.' };
      }

      const product = await ProductModel.findById(productId);
      if (!product) throw { status: 404, message: `Product ID ${productId} not found.` };

      if (product.stock < qty) {
        throw { status: 400, message: `Insufficient stock for "${product.name}". Available: ${product.stock}.` };
      }

      // ── Determine item price based on variant or custom weight ────────
      let itemPrice = parseFloat(product.price);
      let variantId = null;
      let variantLabel = null;
      let customWeight = null;

      if (item.variant_id) {
        // Predefined variant selected
        const variant = await ProductVariantModel.findById(item.variant_id);
        if (!variant || variant.product_id !== product.id) {
          throw { status: 400, message: `Invalid variant for product "${product.name}".` };
        }
        itemPrice = parseFloat(variant.price);
        variantId = variant.id;
        variantLabel = variant.size_label;
      } else if (item.custom_weight_kg && item.price_per_kg) {
        // Custom weight entered by customer
        const kg = parseFloat(item.custom_weight_kg);
        const pricePerKg = parseFloat(item.price_per_kg);
        if (isNaN(kg) || kg <= 0) {
          throw { status: 400, message: `Invalid custom weight for product "${product.name}".` };
        }
        itemPrice = parseFloat((kg * pricePerKg).toFixed(2));
        customWeight = kg;
        variantLabel = `${kg}KG (Custom)`;
      }

      const subtotal = parseFloat((itemPrice * qty).toFixed(2));
      total_amount += subtotal;

      // ── Offer container discount ──────────────────────────────────────
      let offerContainerId = null;
      let offerDiscount = 0;

      if (item.offer_container_id) {
        try {
          const OfferContainerModel = require('../models/offerContainerModel');
          const container = await OfferContainerModel.findById(item.offer_container_id);
          if (container && container.is_active) {
            const discountPct = parseFloat(container.discount_percent);
            offerDiscount = parseFloat((subtotal * (discountPct / 100)).toFixed(2));
            offerContainerId = container.id;
            total_amount -= offerDiscount;
          }
        } catch (_) {}
      }

      processedItems.push({
        product_id: product.id,
        variant_id: variantId,
        product_name: product.name,
        variant_label: variantLabel,
        custom_weight: customWeight,
        product_image: product.main_image,
        price: itemPrice,
        quantity: qty,
        subtotal,
        offer_container_id: offerContainerId,
        offer_discount: offerDiscount,
      });
    }

    const order_number = generateOrderNumber();

    // Apply coupon discount if provided
    let coupon_discount = 0;
    let applied_coupon_code = null;
    let applied_coupon_id = null;
    if (coupon_code) {
      try {
        const CouponModel = require('../models/couponModel');
        const CouponService = require('./couponService');
        const couponResult = await CouponService.validateCoupon(coupon_code, total_amount, customer_id);
        coupon_discount = couponResult.discount_amount;
        applied_coupon_code = couponResult.code;
        applied_coupon_id = couponResult.coupon_id;
        total_amount = couponResult.final_total;
      } catch (_) {
        // Ignore coupon errors at this stage (already validated on frontend)
      }
    }

    // ── Delivery fee calculation (haversine) ─────────────────────────────
    let delivery_fee = 0;
    let delivery_distance_km = null;
    if (delivery_lat && delivery_lng) {
      const { calculateDeliveryFee } = require('./deliveryService');
      const result = calculateDeliveryFee(parseFloat(delivery_lat), parseFloat(delivery_lng));
      delivery_fee = result.fee;
      delivery_distance_km = result.distanceKm;
      total_amount = parseFloat((total_amount + delivery_fee).toFixed(2));
    }

    // Calculate advance payment amounts
    let advance_paid = 0;
    let remaining_balance = 0;
    const method = payment_method || 'cash_by_hand';

    if (method === 'advance') {
      const percent = parseFloat(advance_percent) || 30;
      advance_paid = parseFloat(((percent / 100) * total_amount).toFixed(2));
      remaining_balance = parseFloat((total_amount - advance_paid).toFixed(2));
    }

    const orderId = await OrderModel.create({
      order_number,
      customer_name,
      phone,
      address,
      city,
      payment_method: method,
      total_amount,
      delivery_fee,
      delivery_distance_km,
      notes,
      advance_paid,
      remaining_balance,
      customer_id: customer_id || null,
      coupon_code: applied_coupon_code,
      coupon_discount,
    });

    // Record coupon usage
    if (applied_coupon_id) {
      try {
        const CouponModel = require('../models/couponModel');
        await CouponModel.incrementUsage(applied_coupon_id);
        await CouponModel.recordUsage({ coupon_id: applied_coupon_id, user_id: customer_id || null, order_id: orderId });
      } catch (_) {}
    }

    for (const item of processedItems) {
      await OrderModel.addItem({ order_id: orderId, ...item });
    }

    const order = await OrderModel.findById(orderId);
    const orderItems = await OrderModel.findItems(orderId);

    // Emit socket event to admin room (notification + list refresh)
    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      const socketPayload = {
        order_id: orderId,
        order_number,
        customer_name,
        total_amount,
        created_at: new Date(),
      };
      io.to('admin_room').emit('new_order', socketPayload);
      io.to('admin_room').emit('order_created', socketPayload);

      // Notify the customer's personal room (if logged in)
      if (customer_id) {
        io.to(`customer_${customer_id}`).emit('order_created', { order_id: orderId, order_number });
      }
    } catch (_) {}

    // Send Notify.lk SMS to admin
    try {
      const SmsService = require('./smsService');
      await SmsService.sendNewOrderSMS({ order_id: orderId, order_number, customer_name, total_amount });
    } catch (_) {}

    return { ...order, items: orderItems };
  },

  async getOrderItems(orderId, userId) {
    const order = await OrderModel.findById(orderId);
    if (!order) throw { status: 404, message: 'Order not found.' };

    // Verify ownership when a customer requests their own order
    if (userId && order.customer_id && String(order.customer_id) !== String(userId)) {
      throw { status: 403, message: 'Access denied.' };
    }

    return OrderModel.findItemsWithProductDetails(orderId);
  },

  async reorder(orderId, userId) {
    const order = await OrderModel.findById(orderId);
    if (!order) throw { status: 404, message: 'Order not found.' };

    if (userId && order.customer_id && String(order.customer_id) !== String(userId)) {
      throw { status: 403, message: 'Access denied.' };
    }

    const rawItems = await OrderModel.findItemsWithProductDetails(orderId);

    const items = rawItems.map((item) => ({
      product_id: item.product_id,
      name:       item.name,
      price:      parseFloat(item.price),
      quantity:   item.quantity,
      image:      item.image,
      // available = regular product that is still active and in stock
      available:  item.product_id
        ? item.product_active === 1 && item.product_stock > 0
        : false,
    }));

    return items;
  },

  async getOrderByIdPublic(id, phone) {
    const order = await OrderModel.findById(id);
    if (!order || order.phone !== phone) {
      throw { status: 404, message: 'Order not found. Please check your details.' };
    }
    const items = await OrderModel.findItems(id);
    return { ...order, items };
  },

  async getMyOrders(customerId, query) {
    return OrderModel.findByCustomerId(
      customerId,
      parseInt(query.page) || 1,
      parseInt(query.limit) || 10
    );
  },

  async trackOrder(orderNumber, phone) {
    const order = await OrderModel.findByOrderNumberAndPhone(orderNumber, phone);
    if (!order) throw { status: 404, message: 'Order not found. Please check your order number and phone.' };
    const items = await OrderModel.findItems(order.id);
    return { ...order, items };
  },

  async updateStatus(id, order_status) {
    if (!VALID_STATUSES.includes(order_status)) {
      throw { status: 400, message: `Invalid status. Valid: ${VALID_STATUSES.join(', ')}` };
    }

    const order = await OrderModel.findById(id);
    if (!order) throw { status: 404, message: 'Order not found.' };

    await OrderModel.updateStatus(id, order_status);

    const updatedOrder = await OrderModel.findById(id);

    // Emit socket update to admin room, order-specific room, and customer room
    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      const statusPayload = {
        order_id: id,
        order_status,
        updated_at: updatedOrder.updated_at,
      };
      io.to('admin_room').emit('order_status_updated', statusPayload);
      io.to(`order_${id}`).emit('order_status_updated', statusPayload);

      // Notify the customer's personal room
      if (updatedOrder.customer_id) {
        io.to(`customer_${updatedOrder.customer_id}`).emit('order_status_updated', statusPayload);
      }
    } catch (_) {}

    // Send WhatsApp notification
    try {
      const WhatsAppService = require('./whatsappService');
      await WhatsAppService.sendOrderStatusUpdate(updatedOrder);
    } catch (_) {}

    return updatedOrder;
  },

  async updateDeliveryLocation(id, lat, lng) {
    const order = await OrderModel.findById(id);
    if (!order) throw { status: 404, message: 'Order not found.' };
    await OrderModel.updateDeliveryLocation(id, lat, lng);

    // Emit real-time location update
    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      io.to(`order_${id}`).emit('delivery_location_updated', { order_id: id, lat, lng });
    } catch (_) {}

    return OrderModel.findById(id);
  },

  async getDashboardStats() {
    const [totalOrders, totalProducts, totalBlogs, revenue, statusStats] = await Promise.all([
      OrderModel.countAll(),
      ProductModel.countAll(),
      require('../models/blogModel').countAll(),
      OrderModel.totalRevenue(),
      OrderModel.getStatsByStatus(),
    ]);

    return { totalOrders, totalProducts, totalBlogs, revenue, statusStats };
  },
};

module.exports = OrderService;
