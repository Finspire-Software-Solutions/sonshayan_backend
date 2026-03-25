const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const heroSlideController = require('../controllers/heroSlideController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Dedicated upload storage for hero slides
const heroUploadDir = 'uploads/hero';
if (!fs.existsSync(heroUploadDir)) {
  fs.mkdirSync(heroUploadDir, { recursive: true });
}

const heroStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, heroUploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const heroUpload = multer({
  storage: heroStorage,
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok =
      allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only image files are allowed.'));
  },
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
});

const slideImageFields = heroUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'background_image', maxCount: 1 },
]);

// ── Public ──────────────────────────────────────────────────────────────
router.get('/', heroSlideController.getActive);

// ── Admin ────────────────────────────────────────────────────────────────
router.get('/admin/all', authenticate, authorize('ADMIN'), heroSlideController.getAll);
router.post('/', authenticate, authorize('ADMIN'), slideImageFields, heroSlideController.create);
router.put('/:id', authenticate, authorize('ADMIN'), slideImageFields, heroSlideController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), heroSlideController.delete);

module.exports = router;
