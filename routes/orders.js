const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');

// Public route – track order by order_number + phone
router.get('/track', orderController.trackOrder);

// Customer protected route – get own orders
router.get('/my', authenticate, orderController.getMyOrders);

// Public route – customers place orders
router.post(
  '/',
  [
    body('customer_name').notEmpty().withMessage('Customer name is required.'),
    body('phone').notEmpty().withMessage('Phone number is required.'),
    body('address').notEmpty().withMessage('Delivery address is required.'),
    body('items').isArray({ min: 1 }).withMessage('Order must have at least one item.'),
  ],
  validate,
  orderController.create
);

// Customer reorder endpoints (authenticated customer)
router.get('/:orderId/items', authenticate, orderController.getOrderItems);
router.post('/reorder/:orderId', authenticate, orderController.reorder);

// Admin & Delivery protected routes
router.get('/', authenticate, authorize('ADMIN', 'DELIVERY'), orderController.getAll);
router.get('/dashboard/stats', authenticate, authorize('ADMIN'), orderController.getDashboardStats);
router.get('/:id', authenticate, authorize('ADMIN', 'DELIVERY'), orderController.getById);

// Status update (both ADMIN and DELIVERY can update)
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'DELIVERY'),
  [body('order_status').notEmpty().withMessage('Order status is required.')],
  validate,
  orderController.updateStatus
);

// Update delivery location (DELIVERY + ADMIN)
router.patch(
  '/:id/location',
  authenticate,
  authorize('ADMIN', 'DELIVERY'),
  orderController.updateDeliveryLocation
);

// Public: get single order by ID + phone (for customer tracking)
router.get('/public/:id', orderController.getOrderPublic);

// Invoice download (customer-specific – by order_number+phone query params)
router.get('/:id/invoice', orderController.downloadInvoice);

module.exports = router;
