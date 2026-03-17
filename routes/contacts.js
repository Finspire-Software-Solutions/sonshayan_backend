const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const contactController = require('../controllers/contactController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');

// Public – submit contact form
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Valid email required.'),
    body('message').notEmpty().withMessage('Message is required.'),
  ],
  validate,
  contactController.submit
);

// Admin only
router.get('/', authenticate, authorize('ADMIN'), contactController.getAll);
router.patch('/:id/read', authenticate, authorize('ADMIN'), contactController.markRead);
router.delete('/:id', authenticate, authorize('ADMIN'), contactController.delete);

module.exports = router;
