const router = require('express').Router();
const { createPaymentIntent, getPaymentHistory } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// NOTE: /webhook is registered directly in index.js (before express.json) — not here
router.post('/create-intent', authenticate, createPaymentIntent);
router.get('/history', authenticate, getPaymentHistory);

module.exports = router;
