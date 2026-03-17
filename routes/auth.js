const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// POST /api/auth/register (customer)
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Valid email required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  validate,
  authController.register
);

// PUT /api/auth/profile (protected)
router.put('/profile', authenticate, authController.updateProfile);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  authController.login
);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, authController.me);

// PUT /api/auth/change-password  (protected) – kept for backwards compatibility
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password required.'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
  ],
  validate,
  authController.changePassword
);

// POST /api/auth/change-password  (protected) – used by mobile app
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password required.'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
  ],
  validate,
  authController.changePassword
);

module.exports = router;
