const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');
const { upload, uploadToCloudinary } = require('../middleware/upload');

// Public
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// Admin only
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  upload.single('image'),
  uploadToCloudinary,
  [body('name').notEmpty().withMessage('Category name is required.')],
  validate,
  categoryController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  upload.single('image'),
  uploadToCloudinary,
  [body('name').notEmpty().withMessage('Category name is required.')],
  validate,
  categoryController.update
);

router.delete('/:id', authenticate, authorize('ADMIN'), categoryController.delete);

module.exports = router;
