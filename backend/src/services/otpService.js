'use strict';
const crypto = require('crypto');
const { query } = require('../config/database');

const MAX_ATTEMPTS = 5;

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

async function createOtp(userId, type) {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await query(
    `UPDATE otp_codes SET used = 1 WHERE user_id = $1 AND type = $2 AND used = 0`,
    [userId, type]
  );

  await query(
    `INSERT INTO otp_codes (user_id, type, code, expires_at, attempts) VALUES ($1, $2, $3, $4, 0)`,
    [userId, type, code, expiresAt]
  );

  return code;
}

// Returns { ok: true } or { ok: false, reason: 'INVALID_OTP' | 'OTP_EXPIRED' | 'MAX_ATTEMPTS' }
async function verifyOtp(userId, type, code) {
  const result = await query(
    `SELECT id, code, expires_at, attempts FROM otp_codes
     WHERE user_id = $1 AND type = $2 AND used = 0
     ORDER BY created_at DESC LIMIT 1`,
    [userId, type]
  );

  const otp = result.rows[0];
  if (!otp) return { ok: false, reason: 'INVALID_OTP' };

  if (otp.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'MAX_ATTEMPTS' };

  // Increment attempts before checking to prevent exhaustion timing attacks
  await query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [otp.id]);

  if (new Date(otp.expires_at) < new Date()) return { ok: false, reason: 'OTP_EXPIRED' };

  if (otp.code !== code) return { ok: false, reason: 'INVALID_OTP' };

  await query(`UPDATE otp_codes SET used = 1 WHERE id = $1`, [otp.id]);
  return { ok: true };
}

module.exports = { createOtp, verifyOtp };
