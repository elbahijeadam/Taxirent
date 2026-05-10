const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../config/database');
const { sendPaymentConfirmationEmail } = require('../services/emailService');

// Create payment intent (full payment only)
const createPaymentIntent = async (req, res) => {
  const { reservation_id, payment_type } = req.body;
  const VALID_TYPES = ['full_payment', 'deposit'];

  if (!reservation_id || !payment_type || !VALID_TYPES.includes(payment_type)) {
    return res.status(400).json({ error: 'Invalid payment request.' });
  }

  try {
    const result = await query(
      'SELECT * FROM reservations WHERE id = $1 AND user_id = $2',
      [reservation_id, req.user.id]
    );
    const reservation = result.rows[0];
    if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });
    if (reservation.payment_status === 'paid') {
      return res.status(400).json({ error: 'Reservation already paid.' });
    }

    // Determine amount in cents
    let amountCents;
    if (payment_type === 'deposit') {
      amountCents = Math.round(parseFloat(reservation.deposit_amount) * 100);
    } else {
      amountCents = Math.round(parseFloat(reservation.total_amount) * 100);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      metadata: { reservation_id, user_id: req.user.id, payment_type },
      payment_method_options: {
        card: { request_three_d_secure: 'automatic' },
      },
    });

    // Save payment record
    await query(
      `INSERT INTO payments (reservation_id, user_id, stripe_payment_intent_id, amount, type, status)
       VALUES ($1,$2,$3,$4,$5,'pending')`,
      [reservation_id, req.user.id, paymentIntent.id, amountCents / 100, payment_type]
    );

    // Update reservation with payment intent ID
    await query(
      'UPDATE reservations SET stripe_payment_intent_id = $1 WHERE id = $2',
      [paymentIntent.id, reservation_id]
    );

    res.json({ clientSecret: paymentIntent.client_secret, amount: amountCents });
  } catch (err) {
    console.error('Create payment intent error:', err);
    res.status(500).json({ error: 'Failed to create payment.' });
  }
};

// Stripe webhook for payment confirmation
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  // Deposit authorized (manual capture = hold placed on card, not charged yet)
  if (event.type === 'payment_intent.amount_capturable_updated') {
    const pi = event.data.object;
    if (pi.metadata.type === 'deposit' && pi.metadata.reservation_id) {
      try {
        await query(
          `UPDATE reservations SET deposit_status = 'authorized' WHERE id = $1`,
          [pi.metadata.reservation_id]
        );
        await query(
          `UPDATE payments SET status = 'authorized' WHERE stripe_payment_intent_id = $1`,
          [pi.id]
        );
      } catch (err) {
        console.error('Webhook deposit authorization error:', err);
      }
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const { reservation_id, payment_type } = pi.metadata;

    try {
      await query(
        `UPDATE payments SET status = 'succeeded' WHERE stripe_payment_intent_id = $1`,
        [pi.id]
      );

      const newPaymentStatus = payment_type === 'full_payment' ? 'paid' : 'prepaid';
      const reservationResult = await query(
        `UPDATE reservations SET payment_status = $1, status = 'confirmed'
         WHERE id = $2 RETURNING *`,
        [newPaymentStatus, reservation_id]
      );

      const reservation = reservationResult.rows[0];
      if (reservation) {
        const userResult = await query('SELECT * FROM users WHERE id = $1', [reservation.user_id]);
        const carResult = await query('SELECT * FROM cars WHERE id = $1', [reservation.car_id]);
        if (userResult.rows[0] && carResult.rows[0]) {
          sendPaymentConfirmationEmail(userResult.rows[0], reservation, carResult.rows[0]).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Webhook processing error:', err);
    }
  }

  res.json({ received: true });
};

const getPaymentHistory = async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, r.start_date, r.end_date, c.make, c.model
       FROM payments p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN cars c ON r.car_id = c.id
       WHERE p.user_id = $1 ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment history.' });
  }
};

module.exports = { createPaymentIntent, handleWebhook, getPaymentHistory };
