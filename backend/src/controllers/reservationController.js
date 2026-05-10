const { query } = require('../config/database');
const { sendReservationEmail, sendAdminNotificationEmail, sendContractEmail, sendCancellationEmail, sendRefundEmail, sendDepositAuthorizedEmail } = require('../services/emailService');
const { generateContractHtml } = require('../services/contractService');
const { createSwik, getSwik, deleteSwik } = require('../services/swiklyService');

// Return the Swikly acceptUrl so the user can authorize the deposit hold
const getSwiklyDepositUrl = async (req, res) => {
  try {
    if (!process.env.SWIKLY_API_KEY) return res.status(503).json({ error: 'Swikly non configuré.' });
    const result = await query(
      `SELECT deposit_swikly_id, deposit_status FROM reservations WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    const reservation = result.rows[0];
    if (!reservation) return res.status(404).json({ error: 'Réservation introuvable.' });
    if (!reservation.deposit_swikly_id) return res.status(404).json({ error: 'Aucun dépôt associé.' });
    if (reservation.deposit_status !== 'awaiting_authorization') {
      return res.status(400).json({ error: 'Le dépôt est déjà traité.' });
    }
    const swik = await getSwik(reservation.deposit_swikly_id);
    const acceptUrl = swik.acceptUrl || swik.accept_url || swik.url;
    if (!acceptUrl) return res.status(500).json({ error: 'URL Swikly introuvable.' });
    res.json({ acceptUrl, amount: DEPOSIT_AMOUNT_EUR });
  } catch (err) {
    console.error('getSwiklyDepositUrl error:', err);
    res.status(500).json({ error: 'Impossible de récupérer le dépôt.' });
  }
};

// Called by the frontend after returning from Swikly — marks the deposit as authorized
const confirmDepositAuthorization = async (req, res) => {
  try {
    const result = await query(
      `SELECT deposit_swikly_id, deposit_status FROM reservations WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    const reservation = result.rows[0];
    if (!reservation) return res.status(404).json({ error: 'Réservation introuvable.' });

    // Already authorized — idempotent
    if (reservation.deposit_status === 'authorized') {
      const updated = await query(`SELECT * FROM reservations WHERE id = $1`, [req.params.id]);
      return res.json(updated.rows[0]);
    }
    if (!reservation.deposit_swikly_id) {
      return res.status(404).json({ error: 'Aucun dépôt associé.' });
    }

    // Optionally verify with Swikly API that the swik exists
    if (process.env.SWIKLY_API_KEY) {
      try {
        await getSwik(reservation.deposit_swikly_id);
      } catch (swikErr) {
        console.warn('[DEPOSIT] Swikly verification warning:', swikErr.message);
        // Continue — Swikly redirected to our callback which implies authorization
      }
    }

    await query(
      `UPDATE reservations SET deposit_status = 'authorized' WHERE id = $1`,
      [req.params.id]
    );
    const updated = await query(`SELECT * FROM reservations WHERE id = $1`, [req.params.id]);
    const updatedRes = updated.rows[0];
    // Email confirmation dépôt (non-bloquant)
    Promise.all([
      query('SELECT * FROM users WHERE id = $1', [req.user.id]),
      query('SELECT * FROM cars WHERE id = $1', [updatedRes.car_id]),
    ]).then(([uRes, cRes]) => {
      if (uRes.rows[0] && cRes.rows[0])
        sendDepositAuthorizedEmail(uRes.rows[0], updatedRes, cRes.rows[0]).catch(() => {});
    }).catch(() => {});
    res.json(updatedRes);
  } catch (err) {
    console.error('confirmDepositAuthorization error:', err);
    res.status(500).json({ error: 'Erreur de confirmation du dépôt.' });
  }
};

const VALID_REASONS = ['engine_failure', 'accident', 'body_damage'];
const REQUIRED_DOC_TYPES = ['driver_license_front', 'kbis', 'vehicle_registration'];
const DEPOSIT_AMOUNT_EUR = 1500;

const createReservation = async (req, res) => {
  const {
    car_id, start_date, end_date,
    pickup_location, dropoff_location, pickup_time, return_time,
    reason, vehicle_location, immobilized_plate, notes,
  } = req.body;

  // Explicitly rejected users cannot book
  if (req.user.role !== 'admin' && req.user.status === 'rejected') {
    return res.status(403).json({
      error: 'Votre compte a été refusé. Veuillez contacter le support.',
      code: 'ACCOUNT_REJECTED',
    });
  }

  // All three required documents must be present and not rejected (pending or verified)
  if (req.user.role !== 'admin') {
    let docsRows;
    try {
      const docsRes = await query(
        'SELECT type, status FROM documents WHERE user_id = $1',
        [req.user.id]
      );
      docsRows = docsRes.rows;
    } catch {
      return res.status(500).json({ error: 'Erreur lors de la vérification des documents.' });
    }

    const missing = REQUIRED_DOC_TYPES.filter((t) => !docsRows.some((d) => d.type === t));
    if (missing.length > 0) {
      return res.status(403).json({
        error: 'Documents requis manquants avant de pouvoir soumettre une demande de location.',
        missing,
        code: 'MISSING_DOCUMENTS',
      });
    }

    const rejected = REQUIRED_DOC_TYPES.filter((t) =>
      docsRows.some((d) => d.type === t && d.status === 'rejected')
    );
    if (rejected.length > 0) {
      return res.status(403).json({
        error: 'Un ou plusieurs documents requis ont été refusés. Veuillez les re-soumettre.',
        rejected,
        code: 'REJECTED_DOCUMENTS',
      });
    }
  }

  if (!car_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'Véhicule, date de début et date de fin sont requis.' });
  }
  if (!reason || !VALID_REASONS.includes(reason)) {
    return res.status(400).json({ error: 'Motif de location requis (panne moteur, accident, carrosserie).' });
  }
  if (!vehicle_location || !vehicle_location.trim()) {
    return res.status(400).json({ error: 'La localisation du véhicule immobilisé est requise.' });
  }

  const start = new Date(start_date);
  const end = new Date(end_date);
  if (start >= end) return res.status(400).json({ error: 'La date de fin doit être après la date de début.' });
  if (start < new Date()) return res.status(400).json({ error: 'La date de début doit être dans le futur.' });

  try {
    const carResult = await query('SELECT * FROM cars WHERE id = $1 AND is_available = 1', [car_id]);
    if (!carResult.rows[0]) return res.status(404).json({ error: 'Véhicule introuvable ou indisponible.' });
    const car = carResult.rows[0];

    const conflict = await query(
      `SELECT id FROM reservations WHERE car_id = $1 AND status NOT IN ('cancelled')
       AND start_date <= $2 AND end_date >= $3`,
      [car_id, end_date, start_date]
    );
    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: 'Ce véhicule est déjà réservé pour ces dates.' });
    }

    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const totalAmount = (totalDays * parseFloat(car.price_per_day)).toFixed(2);

    const result = await query(
      `INSERT INTO reservations
         (user_id, car_id, start_date, end_date, pickup_location, dropoff_location,
          pickup_time, return_time, reason, vehicle_location, immobilized_plate, total_days,
          price_per_day, total_amount, deposit_amount, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        req.user.id, car_id, start_date, end_date,
        pickup_location || null, dropoff_location || null,
        pickup_time || null, return_time || null,
        reason, vehicle_location.trim(),
        immobilized_plate ? immobilized_plate.trim().toUpperCase() : null,
        totalDays, car.price_per_day, totalAmount, car.deposit_amount,
        notes || null,
      ]
    );
    const reservation = result.rows[0];

    // Create Swikly deposit swik (card hold, never charged unless damages)
    let swiklyAcceptUrl = null;
    if (req.user.role !== 'admin' && process.env.SWIKLY_API_KEY) {
      try {
        const swikEndDate = new Date(end_date);
        swikEndDate.setDate(swikEndDate.getDate() + 7); // 7-day buffer for damage assessment
        const callbackUrl = `${process.env.FRONTEND_URL}/reservations/${reservation.id}?deposit=success`;

        const swik = await createSwik({
          reservationId: reservation.id,
          userEmail:     req.user.email,
          amount:        DEPOSIT_AMOUNT_EUR,
          endDate:       swikEndDate.toISOString().split('T')[0],
          callbackUrl,
        });

        const swikId = swik.id || swik.swikId || swik.swik_id;
        swiklyAcceptUrl = swik.acceptUrl || swik.accept_url || swik.url;

        await query(
          `UPDATE reservations SET deposit_swikly_id = $1, deposit_status = 'awaiting_authorization' WHERE id = $2`,
          [swikId, reservation.id]
        );
      } catch (swiklyErr) {
        console.error('[RESERVATION] Swikly swik creation failed:', swiklyErr.message);
        // Non-fatal: reservation created, admin will follow up on deposit
      }
    }

    // Reload to get deposit fields if they were just written
    const finalRes = await query('SELECT * FROM reservations WHERE id = $1', [reservation.id]);
    const finalReservation = finalRes.rows[0] || reservation;

    // Fetch full user for contract
    const userResult = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    // Generate and send contract email (non-blocking)
    const contractHtml = generateContractHtml({ reservation: finalReservation, user, car });
    sendReservationEmail(user, finalReservation, car).catch(() => {});
    sendContractEmail(user, finalReservation, car, contractHtml).catch(() => {});
    sendAdminNotificationEmail(user, finalReservation, car).catch(() => {});

    res.status(201).json({
      ...finalReservation,
      contractReady: true,
      ...(swiklyAcceptUrl ? { swiklyAcceptUrl, depositAmount: DEPOSIT_AMOUNT_EUR } : {}),
    });
  } catch (err) {
    console.error('Create reservation error:', err);
    res.status(500).json({ error: 'Échec de la création de la réservation.' });
  }
};

const getReservation = async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, c.make, c.model, c.year, c.color, c.images, c.license_plate, c.transmission, c.fuel_type, c.category
       FROM reservations r JOIN cars c ON r.car_id = c.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Réservation introuvable.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer la réservation.' });
  }
};

const getContract = async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, c.make, c.model, c.year, c.color, c.license_plate, c.transmission, c.fuel_type, c.category, c.price_per_day as car_price_per_day
       FROM reservations r JOIN cars c ON r.car_id = c.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Réservation introuvable.' });

    const row = result.rows[0];
    const userResult = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    const car = {
      make: row.make, model: row.model, year: row.year, color: row.color,
      license_plate: row.license_plate, transmission: row.transmission,
      fuel_type: row.fuel_type, category: row.category,
      price_per_day: row.price_per_day,
    };

    const contractHtml = generateContractHtml({ reservation: row, user, car });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="contrat-${req.params.id.slice(0,8)}.html"`);
    res.send(contractHtml);
  } catch (err) {
    console.error('Get contract error:', err);
    res.status(500).json({ error: 'Impossible de générer le contrat.' });
  }
};

const cancelReservation = async (req, res) => {
  try {
    // Fetch reservation BEFORE updating to get Stripe info
    const existing = await query(
      `SELECT * FROM reservations WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'confirmed')`,
      [req.params.id, req.user.id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Réservation introuvable ou non annulable.' });
    const reservation = existing.rows[0];

    await query(
      `UPDATE reservations SET status = 'cancelled' WHERE id = $1`,
      [req.params.id]
    );

    // Release Swikly deposit swik on cancellation (non-fatal)
    if (reservation.deposit_swikly_id && process.env.SWIKLY_API_KEY) {
      try {
        await deleteSwik(reservation.deposit_swikly_id);
        await query(`UPDATE reservations SET deposit_status = 'released' WHERE id = $1`, [req.params.id]);
      } catch (swiklyErr) {
        console.warn('[CANCEL] Could not delete Swikly swik:', swiklyErr.message);
      }
    }

    // Handle the rental payment intent: void if pending, refund if already captured
    let refunded = false;
    if (reservation.stripe_payment_intent_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const pi = await stripe.paymentIntents.retrieve(reservation.stripe_payment_intent_id);

        if (pi.status === 'succeeded') {
          await stripe.refunds.create({ payment_intent: reservation.stripe_payment_intent_id });
          await query(
            `UPDATE payments SET status = 'refunded' WHERE stripe_payment_intent_id = $1`,
            [reservation.stripe_payment_intent_id]
          );
          await query(
            `UPDATE reservations SET payment_status = 'refunded' WHERE id = $1`,
            [req.params.id]
          );
          refunded = true;
        } else if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(pi.status)) {
          await stripe.paymentIntents.cancel(reservation.stripe_payment_intent_id);
          await query(
            `UPDATE payments SET status = 'cancelled' WHERE stripe_payment_intent_id = $1`,
            [reservation.stripe_payment_intent_id]
          );
        }
      } catch (stripeErr) {
        console.warn('[CANCEL] Could not process Stripe payment intent:', stripeErr.message);
      }
    }

    const result = await query('SELECT * FROM reservations WHERE id = $1', [req.params.id]);
    const cancelled = result.rows[0];

    // Send cancellation (or refund) email to user (non-blocking)
    const userResult = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const carResult  = await query('SELECT * FROM cars WHERE id = $1', [reservation.car_id]);
    if (userResult.rows[0] && carResult.rows[0]) {
      if (refunded) {
        sendRefundEmail(userResult.rows[0], cancelled, carResult.rows[0]).catch(() => {});
      } else {
        sendCancellationEmail(userResult.rows[0], cancelled, carResult.rows[0]).catch(() => {});
      }
    }

    res.json(cancelled);
  } catch (err) {
    console.error('cancelReservation error:', err);
    res.status(500).json({ error: "Impossible d'annuler la réservation." });
  }
};

const listReservations = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let p = 1;

  if (status) { conditions.push(`r.status = $${p++}`); params.push(status); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await query(`SELECT COUNT(*) FROM reservations r ${where}`, params);
    params.push(limit, offset);
    const result = await query(
      `SELECT r.*, u.first_name, u.last_name, u.email, c.make, c.model, c.year
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN cars c ON r.car_id = c.id
       ${where} ORDER BY r.created_at DESC LIMIT $${p++} OFFSET $${p++}`,
      params
    );
    res.json({
      reservations: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer les réservations.' });
  }
};

module.exports = { createReservation, getReservation, getContract, cancelReservation, listReservations, getSwiklyDepositUrl, confirmDepositAuthorization };
