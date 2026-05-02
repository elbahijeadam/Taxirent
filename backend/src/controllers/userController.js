const { query } = require('../config/database');
const { autoValidateDocument } = require('../services/documentVerificationService');

const VALID_DOC_TYPES = [
  'driver_license_front',
  'driver_license_back',
  'professional_card_front',
  'professional_card_back',
  'vehicle_registration',
  'license_document',
  'kbis',
];

const updateProfile = async (req, res) => {
  const {
    first_name, last_name, phone, date_of_birth, place_of_birth,
    driver_license_number, driver_license_date, professional_card_number, license_number,
    commune, address, reason_for_immobilization,
  } = req.body;

  try {
    const result = await query(
      `UPDATE users SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        date_of_birth = COALESCE($4, date_of_birth),
        place_of_birth = COALESCE($5, place_of_birth),
        driver_license_number = COALESCE($6, driver_license_number),
        driver_license_date = COALESCE($7, driver_license_date),
        professional_card_number = COALESCE($8, professional_card_number),
        license_number = COALESCE($9, license_number),
        commune = COALESCE($10, commune),
        address = COALESCE($11, address),
        reason_for_immobilization = COALESCE($12, reason_for_immobilization)
      WHERE id = $13
      RETURNING id, email, first_name, last_name, phone, date_of_birth, place_of_birth,
        driver_license_number, driver_license_date, professional_card_number, license_number,
        commune, address, reason_for_immobilization, role, status, is_verified, email_verified, phone_verified`,
      [
        first_name, last_name, phone, date_of_birth, place_of_birth,
        driver_license_number, driver_license_date, professional_card_number, license_number,
        commune, address, reason_for_immobilization, req.user.id,
      ]
    );
    const { password_hash: _, ...profile } = result.rows[0];
    res.json(profile);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Mise à jour du profil échouée.' });
  }
};

const uploadDocument = async (req, res) => {
  if (!req.user.email_verified || !req.user.phone_verified) {
    return res.status(403).json({
      error: 'Vérifiez votre email et votre téléphone avant de pouvoir uploader des documents.',
      code: 'UNVERIFIED_ACCOUNT',
    });
  }

  const { type } = req.body;

  if (!type || !VALID_DOC_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Type de document invalide.', validTypes: VALID_DOC_TYPES });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier reçu.' });
  }

  try {
    await query('DELETE FROM documents WHERE user_id = $1 AND type = $2', [req.user.id, type]);

    const result = await query(
      `INSERT INTO documents (user_id, type, file_name, file_path, mime_type, file_size, status, auto_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'pending_review') RETURNING *`,
      [req.user.id, type, req.file.filename, req.file.path, req.file.mimetype, req.file.size]
    );

    const doc = result.rows[0];
    res.status(201).json(doc);

    // Fire-and-forget OCR — does not block the response
    setImmediate(() => {
      autoValidateDocument(doc.id).catch((err) =>
        console.error('[VERIFY] Background job failed for', doc.id, err.message)
      );
    });
  } catch (err) {
    console.error('Upload document error:', err);
    res.status(500).json({ error: "Échec de l'enregistrement du document." });
  }
};

const getDocuments = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, type, file_name, mime_type, file_size, status, auto_status, confidence_score, uploaded_at FROM documents WHERE user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer les documents.' });
  }
};

const getUserReservations = async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, c.make, c.model, c.year, c.color, c.images
       FROM reservations r
       JOIN cars c ON r.car_id = c.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer les réservations.' });
  }
};

module.exports = { updateProfile, uploadDocument, getDocuments, getUserReservations };
