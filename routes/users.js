const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');

// Admin only
router.get('/', authenticate, authorize('ADMIN'), userController.getAll);
router.get('/:id', authenticate, authorize('ADMIN'), userController.getById);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  [
    body('name').notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Valid email required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('role').isIn(['ADMIN', 'DELIVERY']).withMessage('Role must be ADMIN or DELIVERY.'),
  ],
  validate,
  userController.create
);

router.put('/:id', authenticate, authorize('ADMIN'), userController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), userController.delete);

module.exports = router;
