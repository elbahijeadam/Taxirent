'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { createOtp, verifyOtp } = require('../services/otpService');
const { sendOtpEmail, sendOtpSms } = require('../services/emailService');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const register = async (req, res) => {
  const { email, password, first_name, last_name, phone, commune } = req.body;

  if (!email || !password || !first_name || !last_name || !phone) {
    return res.status(400).json({ error: 'Email, mot de passe, prénom, nom et téléphone sont requis.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
  }
  if (phone.replace(/\D/g, '').length < 6) {
    return res.status(400).json({ error: 'Numéro de téléphone invalide.' });
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Un compte avec cet email existe déjà.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, commune)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, phone, role, status, email_verified, phone_verified`,
      [email.trim().toLowerCase(), hash, first_name, last_name, phone.trim(), commune || null]
    );

    const { password_hash: _ph, ...user } = result.rows[0];
    const token = generateToken(user.id);

    const emailCode = await createOtp(user.id, 'email');
    sendOtpEmail({ to: user.email, firstName: user.first_name, code: emailCode }).catch((err) => console.error('[EMAIL ERROR]', err.message));

    console.log(`[AUTH FLOW] userId=${user.id} step=registered email=${user.email}`);

    const payload = { token, user };
    if (process.env.NODE_ENV !== 'production') payload._dev_otp = emailCode;

    res.status(201).json(payload);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: "L'inscription a échoué." });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const token = generateToken(user.id);
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'La connexion a échoué.' });
  }
};

const verifyEmail = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code de vérification requis.' });

  if (req.user.email_verified) {
    return res.status(400).json({ error: 'Email déjà vérifié.' });
  }

  const result = await verifyOtp(req.user.id, 'email', String(code).trim());
  if (!result.ok) {
    const msg = result.reason === 'OTP_EXPIRED'  ? 'Code expiré. Demandez un nouveau code.'
              : result.reason === 'MAX_ATTEMPTS' ? 'Trop de tentatives. Demandez un nouveau code.'
              : 'Code invalide.';
    return res.status(400).json({ error: msg, code: result.reason });
  }

  await query('UPDATE users SET email_verified = 1 WHERE id = $1', [req.user.id]);
  console.log(`[AUTH FLOW] userId=${req.user.id} step=email_verified`);

  const phoneCode = await createOtp(req.user.id, 'phone');
  await sendOtpSms({ to: req.user.phone, firstName: req.user.first_name, code: phoneCode }).catch(() => {});

  const payload = { success: true, next: 'phone' };
  if (process.env.NODE_ENV !== 'production') payload._dev_otp = phoneCode;

  res.json(payload);
};

const verifyPhone = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code de vérification requis.' });

  if (!req.user.email_verified) {
    return res.status(400).json({ error: "Vérifiez votre email en premier." });
  }
  if (req.user.phone_verified) {
    return res.status(400).json({ error: 'Téléphone déjà vérifié.' });
  }

  const result = await verifyOtp(req.user.id, 'phone', String(code).trim());
  if (!result.ok) {
    const msg = result.reason === 'OTP_EXPIRED'  ? 'Code expiré. Demandez un nouveau code.'
              : result.reason === 'MAX_ATTEMPTS' ? 'Trop de tentatives. Demandez un nouveau code.'
              : 'Code invalide.';
    return res.status(400).json({ error: msg, code: result.reason });
  }

  await query('UPDATE users SET phone_verified = 1 WHERE id = $1', [req.user.id]);
  console.log(`[AUTH FLOW] userId=${req.user.id} step=phone_verified`);
  res.json({ success: true });
};

const resendOtp = async (req, res) => {
  const { type } = req.body;
  if (!['email', 'phone'].includes(type)) {
    return res.status(400).json({ error: 'Type invalide. Utilisez "email" ou "phone".' });
  }
  if (type === 'email' && req.user.email_verified) {
    return res.status(400).json({ error: 'Email déjà vérifié.' });
  }
  if (type === 'phone' && req.user.phone_verified) {
    return res.status(400).json({ error: 'Téléphone déjà vérifié.' });
  }
  if (type === 'phone' && !req.user.email_verified) {
    return res.status(400).json({ error: "Vérifiez votre email en premier." });
  }

  try {
    const code = await createOtp(req.user.id, type);

    if (type === 'email') {
      await sendOtpEmail({ to: req.user.email, firstName: req.user.first_name, code }).catch(() => {});
    } else {
      await sendOtpSms({ to: req.user.phone, firstName: req.user.first_name, code }).catch(() => {});
    }

    const payload = { success: true };
    if (process.env.NODE_ENV !== 'production') payload._dev_otp = code;

    res.json(payload);
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: "Échec de l'envoi du code." });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, phone, date_of_birth, place_of_birth,
              driver_license_number, professional_card_number, license_number, commune,
              reason_for_immobilization, role, status, is_verified,
              email_verified, phone_verified, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer le profil.' });
  }
};

module.exports = { register, login, verifyEmail, verifyPhone, resendOtp, getMe };
