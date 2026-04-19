const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const blogController = require('../controllers/blogController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');
const { upload, uploadToCloudinary } = require('../middleware/upload');

// Public routes
router.get('/', blogController.getAll);
router.get('/slug/:slug', blogController.getBySlug);
router.get('/:id', blogController.getById);

// Admin routes
router.get('/admin/all', authenticate, authorize('ADMIN'), blogController.getAllAdmin);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  upload.single('thumbnail'),
  uploadToCloudinary,
  [
    body('title').notEmpty().withMessage('Blog title is required.'),
    body('content').notEmpty().withMessage('Blog content is required.'),
  ],
  validate,
  blogController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  upload.single('thumbnail'),
  uploadToCloudinary,
  [
    body('title').notEmpty().withMessage('Blog title is required.'),
    body('content').notEmpty().withMessage('Blog content is required.'),
  ],
  validate,
  blogController.update
);

router.delete('/:id', authenticate, authorize('ADMIN'), blogController.delete);

module.exports = router;
