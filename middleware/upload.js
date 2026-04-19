const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary');

// Use memory storage since we'll upload to Cloudinary
const storage = multer.memoryStorage();

// File filter – allow images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5 MB
  },
});

// Middleware to upload files to Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }

  try {
    // Determine folder based on route
    let folder = 'misc';
    if (req.baseUrl.includes('products')) {
      folder = 'products';
    } else if (req.baseUrl.includes('blogs')) {
      folder = 'blogs';
    } else if (req.baseUrl.includes('categories')) {
      folder = 'categories';
    } else if (req.baseUrl.includes('heroSlides')) {
      folder = 'hero';
    } else if (req.baseUrl.includes('combos')) {
      folder = 'combos';
    }

    // Handle single file upload (e.g., thumbnail, image)
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `son-chayan/${folder}` },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      req.file.path = result.secure_url;
      req.file.public_id = result.public_id;
    }

    // Handle multiple files upload (e.g., gallery, combo_image, image + background_image)
    if (req.files) {
      for (const fieldName in req.files) {
        const files = req.files[fieldName];
        req.files[fieldName] = await Promise.all(
          files.map((file) =>
            new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                { folder: `son-chayan/${folder}` },
                (error, result) => {
                  if (error) reject(error);
                  else
                    resolve({
                      ...file,
                      path: result.secure_url,
                      public_id: result.public_id,
                    });
                }
              );
              stream.end(file.buffer);
            })
          )
        );
      }
    }

    next();
  } catch (error) {
    return res.status(400).json({ error: `Upload failed: ${error.message}` });
  }
};

module.exports = { upload, uploadToCloudinary };
