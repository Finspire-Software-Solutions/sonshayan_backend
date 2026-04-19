const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const comboController = require('../controllers/comboController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');
const { upload, uploadToCloudinary } = require('../middleware/upload');

const comboValidation = [
  body('name').notEmpty().withMessage('Combo name is required.'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required.'),
];

// Public routes
router.get('/', comboController.getAll);
router.get('/:id', comboController.getById);

// Admin routes
router.get('/admin/all', authenticate, authorize('ADMIN'), comboController.getAllAdmin);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  upload.fields([{ name: 'combo_image', maxCount: 1 }]),
  uploadToCloudinary,
  comboValidation,
  validate,
  comboController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  upload.fields([{ name: 'combo_image', maxCount: 1 }]),
  uploadToCloudinary,
  comboValidation,
  validate,
  comboController.update
);

router.delete('/:id', authenticate, authorize('ADMIN'), comboController.delete);

module.exports = router;
