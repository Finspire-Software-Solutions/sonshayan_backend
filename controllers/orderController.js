const OrderService = require('../services/orderService');

const orderController = {
  async getAll(req, res, next) {
    try {
      const result = await OrderService.getOrders(req.query);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const order = await OrderService.createOrder(req.body);
      res.status(201).json({ success: true, data: order, message: 'Order placed successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const order = await OrderService.updateStatus(req.params.id, req.body.order_status);
      res.json({ success: true, data: order, message: 'Order status updated.' });
    } catch (err) {
      next(err);
    }
  },

  async getDashboardStats(req, res, next) {
    try {
      const stats = await OrderService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },

  async getMyOrders(req, res, next) {
    try {
      const result = await OrderService.getMyOrders(req.user.id, req.query);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async trackOrder(req, res, next) {
    try {
      const { order_number, phone } = req.query;
      if (!order_number || !phone) {
        return res.status(400).json({ success: false, error: 'Order number and phone are required.' });
      }
      const order = await OrderService.trackOrder(order_number, phone);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  },

  async getOrderPublic(req, res, next) {
    try {
      const { phone } = req.query;
      if (!phone) {
        return res.status(400).json({ success: false, error: 'Phone number is required for verification.' });
      }
      const order = await OrderService.getOrderByIdPublic(req.params.id, phone);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  },

  async updateDeliveryLocation(req, res, next) {
    try {
      const { lat, lng } = req.body;
      if (!lat || !lng) {
        return res.status(400).json({ success: false, error: 'lat and lng are required.' });
      }
      const order = await OrderService.updateDeliveryLocation(req.params.id, lat, lng);
      res.json({ success: true, data: order, message: 'Location updated.' });
    } catch (err) {
      next(err);
    }
  },

  async getOrderItems(req, res, next) {
    try {
      const items = await OrderService.getOrderItems(req.params.orderId, req.user?.id);
      res.json({ success: true, items });
    } catch (err) {
      next(err);
    }
  },

  async reorder(req, res, next) {
    try {
      const items = await OrderService.reorder(req.params.orderId, req.user?.id);
      res.json({ success: true, items });
    } catch (err) {
      next(err);
    }
  },

  async downloadInvoice(req, res, next) {
    try {
      const { phone } = req.query;
      let order;

      // Allow admin/delivery to download without phone verification
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
          if (['ADMIN', 'DELIVERY'].includes(decoded.role)) {
            order = await OrderService.getOrderById(req.params.id);
          }
        } catch (_) {}
      }

      if (!order) {
        if (!phone) return res.status(400).json({ success: false, error: 'Phone required for verification.' });
        order = await OrderService.getOrderByIdPublic(req.params.id, phone);
      }

      const InvoiceService = require('../services/invoiceService');
      await InvoiceService.generateInvoice(order, res);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = orderController;
