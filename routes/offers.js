const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const offerContainerController = require('../controllers/offerContainerController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');

// Public – get active offer containers
router.get('/containers', offerContainerController.getAll);
router.get('/containers/:id', offerContainerController.getById);

// Cart validation (public – check if product is eligible)
router.post(
  '/containers/validate',
  [
    body('container_id').isInt().withMessage('container_id is required.'),
    body('product_id').isInt().withMessage('product_id is required.'),
    body('price').isFloat({ min: 0 }).withMessage('price is required.'),
  ],
  validate,
  offerContainerController.validateForCart
);

// Admin – manage offer containers
router.post(
  '/containers',
  authenticate,
  authorize('ADMIN'),
  [body('name').notEmpty().withMessage('Container name is required.')],
  validate,
  offerContainerController.create
);

router.put('/containers/:id', authenticate, authorize('ADMIN'), offerContainerController.update);
router.delete('/containers/:id', authenticate, authorize('ADMIN'), offerContainerController.delete);

module.exports = router;
