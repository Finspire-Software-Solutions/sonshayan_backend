const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');
const { upload, uploadToCloudinary } = require('../middleware/upload');

const productValidation = [
  body('name').notEmpty().withMessage('Product name is required.'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required.'),
];

// Public routes
router.get('/', productController.getAll);
router.get('/popular', productController.getPopular);
router.get('/recommendations', productController.getTopRecommendations);
router.get('/recommendations/:productId', productController.getRecommendations);
router.get('/:id', productController.getById);

// Product reviews (public read, customer write)
router.get('/:id/reviews', reviewController.getProductReviews);
router.post('/:id/reviews', authenticate, reviewController.submitReview);
router.delete('/:id/reviews/:reviewId', authenticate, authorize('ADMIN'), reviewController.deleteReview);

// Admin routes
router.get('/admin/all', authenticate, authorize('ADMIN'), productController.getAllAdmin);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
  ]),
  uploadToCloudinary,
  productValidation,
  validate,
  productController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
  ]),
  uploadToCloudinary,
  productValidation,
  validate,
  productController.update
);

router.delete('/:id', authenticate, authorize('ADMIN'), productController.delete);
router.delete('/images/:imageId', authenticate, authorize('ADMIN'), productController.deleteImage);

// Product variants (public read, admin write)
router.get('/:id/variants', productController.getVariants);
router.post(
  '/:id/variants',
  authenticate,
  authorize('ADMIN'),
  [
    body('size_label').notEmpty().withMessage('Size label is required.'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required.'),
  ],
  validate,
  productController.createVariant
);
router.put('/:id/variants/:variantId', authenticate, authorize('ADMIN'), productController.updateVariant);
router.delete('/:id/variants/:variantId', authenticate, authorize('ADMIN'), productController.deleteVariant);

module.exports = router;
