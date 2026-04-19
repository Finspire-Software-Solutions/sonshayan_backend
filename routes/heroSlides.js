const express = require('express');
const router = express.Router();
const heroSlideController = require('../controllers/heroSlideController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { upload, uploadToCloudinary } = require('../middleware/upload');

const slideImageFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'background_image', maxCount: 1 },
]);

// ── Public ──────────────────────────────────────────────────────────────
router.get('/', heroSlideController.getActive);

// ── Admin ────────────────────────────────────────────────────────────────
router.get('/admin/all', authenticate, authorize('ADMIN'), heroSlideController.getAll);
router.post('/', authenticate, authorize('ADMIN'), slideImageFields, uploadToCloudinary, heroSlideController.create);
router.put('/:id', authenticate, authorize('ADMIN'), slideImageFields, uploadToCloudinary, heroSlideController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), heroSlideController.delete);

module.exports = router;
