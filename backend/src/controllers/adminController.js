'use strict';
const path = require('path');
const { query, pool } = require('../config/database');
const { autoValidateDocument } = require('../services/documentVerificationService');

const API_BASE = process.env.API_URL || 'http://localhost:5000';

/* ── Stats ──────────────────────────────────────────────────────────────── */
const getStats = async (req, res) => {
  try {
    const [uStats, rStats, dStats] = await Promise.all([
      query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM users WHERE role = 'user'
      `),
      query(`
        SELECT
          COUNT(*) as total,
          COALESCE(SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END), 0) as pending,
          COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0) as confirmed,
          COALESCE(SUM(CASE WHEN status = 'active'    THEN 1 ELSE 0 END), 0) as active,
          COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled
        FROM reservations
      `),
      query(`SELECT COUNT(*) as pending FROM documents WHERE status = 'pending'`),
    ]);
    res.json({
      users: uStats.rows[0],
      reservations: rStats.rows[0],
      documents: { pending: Number(dStats.rows[0]?.pending ?? 0) },
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/* ── Users ──────────────────────────────────────────────────────────────── */
const listUsers = async (req, res) => {
  const { status, page = 1, limit = 20, q } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conds = ["u.role = 'user'"];
  let p = 1;

  if (status) { conds.push(`u.status = $${p++}`); params.push(status); }
  if (q) {
    conds.push(`(u.email LIKE $${p} OR u.first_name LIKE $${p} OR u.last_name LIKE $${p})`);
    params.push(`%${q}%`); p++;
  }
  const where = `WHERE ${conds.join(' AND ')}`;

  try {
    const [countRes, rows] = await Promise.all([
      query(`SELECT COUNT(*) FROM users u ${where}`, params),
      query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.commune,
                u.status, u.role, u.is_verified, u.created_at,
                (SELECT COUNT(*) FROM documents d WHERE d.user_id = u.id) as doc_count
         FROM users u ${where}
         ORDER BY u.created_at DESC
         LIMIT $${p++} OFFSET $${p++}`,
        [...params, parseInt(limit), offset]
      ),
    ]);
    res.json({
      users: rows.rows,
      total: parseInt(countRes.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const userRes = await query(
      `SELECT id, email, first_name, last_name, phone, date_of_birth, place_of_birth,
              driver_license_number, professional_card_number, license_number, commune,
              reason_for_immobilization, role, status, is_verified, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!userRes.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const docsRes = await query(
      `SELECT id, type, file_name, file_path, mime_type, file_size,
              status, auto_status, confidence_score, uploaded_at, user_id
       FROM documents WHERE user_id = $1`,
      [req.params.id]
    );

    const docs = docsRes.rows.map((d) => ({
      ...d,
      url: `${API_BASE}/uploads/${d.user_id}/${path.basename(d.file_path)}`,
    }));

    const resRes = await query(
      `SELECT r.id, r.start_date, r.end_date, r.total_days, r.total_amount, r.status,
              r.reason, r.vehicle_location, r.admin_note, r.created_at,
              c.make, c.model, c.year
       FROM reservations r JOIN cars c ON r.car_id = c.id
       WHERE r.user_id = $1 ORDER BY r.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    res.json({ user: userRes.rows[0], documents: docs, reservations: resRes.rows });
  } catch (err) {
    console.error('getUserDetails error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

const updateUserStatus = async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' });
  }
  try {
    await query(
      `UPDATE users SET status = $1 WHERE id = $2 AND role = 'user'`,
      [status, req.params.id]
    );
    const result = await query(
      `SELECT id, email, first_name, last_name, status, role FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateUserStatus error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/* ── Reservations ───────────────────────────────────────────────────────── */
const listReservations = async (req, res) => {
  const { status, page = 1, limit = 20, q } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conds = [];
  let p = 1;

  if (status) { conds.push(`r.status = $${p++}`); params.push(status); }
  if (q) {
    conds.push(`(u.email LIKE $${p} OR u.first_name LIKE $${p} OR u.last_name LIKE $${p} OR r.id LIKE $${p})`);
    params.push(`%${q}%`); p++;
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  try {
    const [countRes, rows] = await Promise.all([
      query(
        `SELECT COUNT(*) FROM reservations r JOIN users u ON r.user_id = u.id ${where}`,
        params
      ),
      query(
        `SELECT r.id, r.start_date, r.end_date, r.pickup_time, r.return_time,
                r.total_days, r.total_amount, r.price_per_day,
                r.status, r.payment_status, r.reason, r.vehicle_location,
                r.pickup_location, r.notes, r.admin_note, r.created_at,
                u.id as user_id, u.first_name, u.last_name, u.email, u.status as user_status,
                c.make, c.model, c.year, c.license_plate, c.color
         FROM reservations r
         JOIN users u ON r.user_id = u.id
         JOIN cars c ON r.car_id = c.id
         ${where}
         ORDER BY r.created_at DESC
         LIMIT $${p++} OFFSET $${p++}`,
        [...params, parseInt(limit), offset]
      ),
    ]);
    res.json({
      reservations: rows.rows,
      total: parseInt(countRes.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('listReservations error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

const updateReservationStatus = async (req, res) => {
  const { status, admin_note } = req.body;
  const valid = ['pending', 'confirmed', 'cancelled', 'active', 'completed'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' });
  }
  try {
    const result = await query(
      `UPDATE reservations SET status = $1, admin_note = $2 WHERE id = $3 RETURNING *`,
      [status, admin_note || null, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Réservation introuvable.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateReservationStatus error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/* ── Documents ──────────────────────────────────────────────────────────── */
const listPendingDocuments = async (req, res) => {
  // view=pending (default) — admin review queue (status='pending')
  // view=auto_rejected     — AI-rejected, may need admin override
  const { type, view = 'pending', page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const baseFilter = view === 'auto_rejected'
    ? "d.auto_status = 'auto_rejected'"
    : "d.status = 'pending'";

  const params = [];
  let p = 1;
  let typeFilter = '';
  if (type) { typeFilter = `AND d.type = $${p++}`; params.push(type); }

  const countParams = [...params];
  const rowParams   = [...params];

  try {
    const [countRes, rows] = await Promise.all([
      query(
        `SELECT COUNT(*) FROM documents d WHERE ${baseFilter} ${typeFilter}`,
        countParams
      ),
      query(
        `SELECT d.id, d.type, d.file_name, d.file_path, d.mime_type, d.file_size,
                d.status, d.auto_status, d.confidence_score, d.uploaded_at, d.user_id,
                u.first_name, u.last_name, u.email
         FROM documents d
         JOIN users u ON d.user_id = u.id
         WHERE ${baseFilter} ${typeFilter}
         ORDER BY d.uploaded_at ASC
         LIMIT $${p++} OFFSET $${p++}`,
        [...rowParams, parseInt(limit), offset]
      ),
    ]);

    const docs = rows.rows.map((d) => ({
      ...d,
      url: `${API_BASE}/uploads/${d.user_id}/${path.basename(d.file_path)}`,
    }));

    res.json({
      documents: docs,
      total: parseInt(countRes.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('listPendingDocuments error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

const getDocumentVerification = async (req, res) => {
  try {
    const result = await query(
      `SELECT d.id, d.type, d.status, d.auto_status, d.confidence_score,
              d.extracted_data, d.verification_log, d.uploaded_at,
              u.first_name, u.last_name, u.email
       FROM documents d JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Document introuvable.' });

    const doc = result.rows[0];
    let extractedData   = null;
    let verificationLog = null;
    try { extractedData   = JSON.parse(doc.extracted_data); }   catch {}
    try { verificationLog = JSON.parse(doc.verification_log); } catch {}

    res.json({ ...doc, extracted_data: extractedData, verification_log: verificationLog });
  } catch (err) {
    console.error('getDocumentVerification error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

const updateDocumentStatus = async (req, res) => {
  const { status, admin_note } = req.body;
  if (!['pending', 'verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide. Valeurs acceptées : pending, verified, rejected.' });
  }
  try {
    // Set auto_status = 'manual_override' so audit trail shows human decision replaced AI
    const result = await query(
      `UPDATE documents
         SET status      = $1,
             auto_status = 'manual_override',
             admin_note  = $2
       WHERE id = $3
       RETURNING id, type, status, auto_status, admin_note, user_id`,
      [status, admin_note || null, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Document introuvable.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateDocumentStatus error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

const reprocessDocument = async (req, res) => {
  try {
    const check = await query('SELECT id FROM documents WHERE id = $1', [req.params.id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Document introuvable.' });

    await query(
      `UPDATE documents
         SET auto_status      = 'pending_review',
             status           = 'pending',
             extracted_text   = NULL,
             extracted_data   = NULL,
             confidence_score = NULL,
             verification_log = NULL,
             admin_note       = NULL
       WHERE id = $1`,
      [req.params.id]
    );

    res.json({ message: 'Retraitement OCR lancé en arrière-plan.' });

    // Fire-and-forget — same pattern as initial upload
    setImmediate(() => {
      autoValidateDocument(req.params.id).catch((err) =>
        console.error('[VERIFY] Reprocess failed for', req.params.id, err.message)
      );
    });
  } catch (err) {
    console.error('reprocessDocument error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/* ── User management ────────────────────────────────────────────────────── */
const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' });
  try {
    const result = await query("DELETE FROM users WHERE id = $1 AND role = 'user'", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

const promoteUser = async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'Rôle invalide.' });
  const { id } = req.params;
  if (id === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre rôle.' });
  try {
    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, first_name, last_name, role',
      [role, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('promoteUser error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

const manualVerifyUser = async (req, res) => {
  const { id } = req.params;
  try {
    await query(
      `UPDATE users SET email_verified = 1, phone_verified = 1, status = 'approved' WHERE id = $1`,
      [id]
    );
    const result = await query(
      'SELECT id, email, first_name, last_name, status, email_verified, phone_verified, role FROM users WHERE id = $1',
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('manualVerifyUser error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/* ── Dev-only DB reset ──────────────────────────────────────────────────── */
const resetDatabase = async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const adminId = req.user.id;
  console.log(`[DEV] Database reset requested by admin ${adminId}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM email_logs');
    await client.query('DELETE FROM payments');
    await client.query('DELETE FROM otp_codes');
    await client.query('DELETE FROM reservations');
    await client.query('DELETE FROM documents');
    await client.query('DELETE FROM cars');
    await client.query('DELETE FROM users WHERE id != $1', [adminId]);

    const CARS = [
      ['Skoda','Octavia',2018,'Noir','SK-001-OCT','sedan','manual','diesel',5,4,65,1500,'Berline Skoda Octavia 1.6 TDI équipée taxi.','[]','[]','Paris'],
      ['Skoda','Kodiaq',2020,'Noir','SK-002-KOD','suv','automatic','petrol',5,5,90,1500,'SUV Skoda Kodiaq équipé taxi.','[]','[]','Paris'],
      ['Toyota','Corolla 180ch',2020,'Blanc','TY-001-C18','hybrid','automatic','hybrid',5,4,75,1500,'Toyota Corolla hybride 180ch équipée taxi.','[]','[]','Paris'],
      ['Toyota','Corolla 122ch',2019,'Blanc','TY-002-C12','hybrid','automatic','hybrid',5,4,70,1500,'Toyota Corolla hybride 122ch équipée taxi.','[]','[]','Paris'],
      ['Tesla','Model Y',2024,'Noir','TS-001-MY','electric','automatic','electric',5,5,120,1500,'Tesla Model Y 100% électrique équipée taxi.','[]','[]','Paris'],
    ];
    for (const [make,model,year,color,lp,cat,trans,fuel,seats,doors,ppd,dep,desc,feat,imgs,city] of CARS) {
      await client.query(
        `INSERT INTO cars
           (make,model,year,color,license_plate,category,transmission,fuel_type,
            seats,doors,price_per_day,deposit_amount,description,features,images,city)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [make,model,year,color,lp,cat,trans,fuel,seats,doors,ppd,dep,desc,feat,imgs,city]
      );
    }

    await client.query('COMMIT');
    console.log(`[DEV] Database reset completed by admin ${adminId}`);
    res.json({ success: true, message: 'Database reset completed' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[DEV] resetDatabase error:', err);
    res.status(500).json({ error: 'Reset failed' });
  } finally {
    client.release();
  }
};

module.exports = { getStats, listUsers, getUserDetails, updateUserStatus, deleteUser, promoteUser, manualVerifyUser, listPendingDocuments, getDocumentVerification, updateDocumentStatus, reprocessDocument, listReservations, updateReservationStatus, resetDatabase };
