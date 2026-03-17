const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Public/optional-auth: validate a coupon code
router.post('/validate', (req, res, next) => {
  // Optionally attach user if logged in (not required)
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    const jwt = require('jsonwebtoken');
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) {}
  }
  next();
}, couponController.validate);

// Admin routes
router.get('/', authenticate, authorize('ADMIN'), couponController.getAll);
router.post('/', authenticate, authorize('ADMIN'), couponController.create);
router.put('/:id', authenticate, authorize('ADMIN'), couponController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), couponController.delete);

module.exports = router;
