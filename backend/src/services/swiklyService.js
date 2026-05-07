'use strict';

const SWIKLY_BASE = 'https://api.v2.swikly.com/v1';

async function swiklyRequest(path, method = 'GET', body = null) {
  const key = process.env.SWIKLY_API_KEY;
  if (!key) throw new Error('SWIKLY_API_KEY non configuré');

  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${SWIKLY_BASE}${path}`, opts);

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    throw new Error(`Swikly API ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// Create a deposit swik — returns { id, acceptUrl, ... }
async function createSwik({ reservationId, userEmail, amount, endDate, callbackUrl }) {
  return swiklyRequest('/swiks', 'POST', {
    id:          reservationId,
    email:       userEmail,
    language:    'FR',
    amount,
    description: `Dépôt de garantie — Réf. ${reservationId.slice(0, 8).toUpperCase()}`,
    endDate,
    callbackUrl,
  });
}

// Get swik details to verify status
async function getSwik(swikId) {
  return swiklyRequest(`/swiks/${swikId}`, 'GET');
}

// Release swik (no damages — end of rental or cancellation)
async function deleteSwik(swikId) {
  return swiklyRequest(`/swiks/${swikId}`, 'DELETE');
}

// Claim/capture swik (damages case). amount in EUR.
async function claimSwik(swikId, amount) {
  return swiklyRequest(`/swiks/${swikId}/claim`, 'POST', { amount });
}

module.exports = { createSwik, getSwik, deleteSwik, claimSwik };
