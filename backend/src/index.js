require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('./middleware/auth');

const app = express();

// Security middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin === o) || origin.endsWith('.vercel.app')) {
      cb(null, true);
    } else {
      cb(new Error('CORS: origin not allowed'));
    }
  },
  credentials: true,
}));

// Strict rate limit for OTP verification endpoints (prevent brute-force)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.', code: 'RATE_LIMITED' },
  skipSuccessfulRequests: true,
});
app.use('/api/auth/verify-email', otpLimiter);
app.use('/api/auth/verify-phone', otpLimiter);
app.use('/api/auth/resend-otp',   rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Trop de demandes de renvoi. Réessayez dans 15 minutes.' } }));

// Strict rate limit for login (brute-force protection)
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, skipSuccessfulRequests: true, message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.', code: 'RATE_LIMITED' } }));

// General auth and API rate limits
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many requests, please try again later.' } }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Stripe webhook must receive raw body — mount BEFORE express.json()
app.use('/api/payments/webhook', require('./routes/payments'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Authenticated file serving — no public access to uploads
const UPLOADS_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
app.get('/uploads/:userId/:filename', authenticate, (req, res) => {
  if (req.user.role !== 'admin' && req.params.userId !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé.' });
  }
  // Prevent path traversal
  const filePath = path.join(UPLOADS_DIR, req.params.userId, req.params.filename);
  if (!filePath.startsWith(UPLOADS_DIR + path.sep)) {
    return res.status(400).json({ error: 'Chemin invalide.' });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier introuvable.' });
  }
  res.sendFile(filePath);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cities', require('./routes/cities'));
app.use('/api/cars', require('./routes/cars'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const { initDb } = require('./config/database');
const PORT = process.env.PORT || 5000;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('[FATAL] Database init failed:', err.message || err);
    process.exit(1);
  });

module.exports = app;
