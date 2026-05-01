'use strict';
const { query } = require('../config/database');

const searchCities = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  try {
    const result = await query(
      `SELECT id, name, postal_code FROM cities
       WHERE name LIKE $1 OR postal_code LIKE $1
       ORDER BY name ASC LIMIT 10`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('searchCities error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

module.exports = { searchCities };
