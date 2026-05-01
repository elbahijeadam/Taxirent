const router = require('express').Router();
const express = require('express');
const { createPaymentIntent, handleWebhook, getPaymentHistory } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// Stripe webhook needs raw body
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.post('/create-intent', authenticate, createPaymentIntent);
router.get('/history', authenticate, getPaymentHistory);

module.exports = router;
