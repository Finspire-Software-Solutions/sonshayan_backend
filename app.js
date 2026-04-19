require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const blogRoutes = require('./routes/blogs');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const contactRoutes = require('./routes/contacts');
const comboRoutes = require('./routes/combos');
const couponRoutes = require('./routes/coupons');
const offerRoutes = require('./routes/offers');
const heroSlideRoutes = require('./routes/heroSlides');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ── Security Middleware ──────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ── CORS ─────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL || 'http://localhost:5173', // Web frontend (Vite)
  'http://localhost:8081',                            // Expo web (React Native)
  'http://localhost:19006',
  'https://sonshayan.com',                           // Expo web (older default port)
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (native mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin "${origin}" is not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ── Body Parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logger ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Static Files (Uploads) ───────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Son Chayan API is running 🚀' });
});

// ── Delivery Fee Calculator (public) ─────────────────────────
app.get('/api/delivery/fee', (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'lat and lng are required.' });
    }
    const { calculateDeliveryFee, getDeliverySettings } = require('./services/deliveryService');
    const result = calculateDeliveryFee(parseFloat(lat), parseFloat(lng));
    const settings = getDeliverySettings();
    res.json({ success: true, data: { ...result, settings } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to calculate delivery fee.' });
  }
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/combos', comboRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/hero-slides', heroSlideRoutes);

// ── Error Handling ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
