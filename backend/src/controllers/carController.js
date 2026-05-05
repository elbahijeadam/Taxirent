const { query } = require('../config/database');

// Simple in-memory cache for car listings (60s TTL, invalidated on writes)
const cache = {};
const CACHE_TTL = 60_000;
function cacheGet(key) {
  const now = Date.now();
  if (cache[key] && (now - cache[key].ts) < CACHE_TTL) return cache[key].data;
  return null;
}
function cacheSet(key, data) { cache[key] = { data, ts: Date.now() }; }
function cacheInvalidate() {
  for (const k of Object.keys(cache)) delete cache[k];
}

const listCars = async (req, res) => {
  const { category, transmission, fuel_type, min_price, max_price, seats, city, available_from, available_to } = req.query;

  let conditions = [];
  const params = [];
  let p = 1;

  if (category) { conditions.push(`c.category = $${p++}`); params.push(category); }
  if (transmission) { conditions.push(`c.transmission = $${p++}`); params.push(transmission); }
  if (fuel_type) { conditions.push(`c.fuel_type = $${p++}`); params.push(fuel_type); }
  if (min_price) { conditions.push(`c.price_per_day >= $${p++}`); params.push(min_price); }
  if (max_price) { conditions.push(`c.price_per_day <= $${p++}`); params.push(max_price); }
  if (seats) { conditions.push(`c.seats >= $${p++}`); params.push(seats); }
  if (city) { conditions.push(`c.city = $${p++}`); params.push(city); }

  // When date range given: only show available cars not already reserved
  if (available_from && available_to) {
    conditions.push(`c.is_available = 1`);
    conditions.push(`c.id NOT IN (
      SELECT car_id FROM reservations
      WHERE status NOT IN ('cancelled')
        AND start_date <= $${p++}
        AND end_date >= $${p++}
    )`);
    params.push(available_to, available_from);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const cacheKey = `list:${where}:${params.join(',')}`;

  try {
    const cached = cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const result = await query(
      `SELECT c.* FROM cars c ${where} ORDER BY c.is_available DESC, c.price_per_day ASC`,
      params
    );
    cacheSet(cacheKey, result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('List cars error:', err);
    res.status(500).json({ error: 'Failed to fetch cars.' });
  }
};

const getCar = async (req, res) => {
  try {
    const result = await query('SELECT * FROM cars WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Car not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch car.' });
  }
};

const getCarAvailability = async (req, res) => {
  try {
    // Return booked date ranges for the car
    const result = await query(
      `SELECT start_date, end_date FROM reservations
       WHERE car_id = $1 AND status NOT IN ('cancelled')
         AND end_date >= to_char(CURRENT_DATE, 'YYYY-MM-DD')
       ORDER BY start_date`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch availability.' });
  }
};

// Admin: create car
const createCar = async (req, res) => {
  const { make, model, year, color, license_plate, category, transmission, fuel_type, seats, doors, price_per_day, deposit_amount, description, features, city } = req.body;

  if (!make || !model || !year || !license_plate || !price_per_day) {
    return res.status(400).json({ error: 'Missing required car fields.' });
  }

  try {
    const result = await query(
      `INSERT INTO cars (make, model, year, color, license_plate, category, transmission, fuel_type, seats, doors, price_per_day, deposit_amount, description, features, city)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [make, model, year, color, license_plate, category, transmission, fuel_type, seats || 5, doors || 4, price_per_day, deposit_amount || 0, description, JSON.stringify(features || []), city || 'Paris']
    );
    cacheInvalidate();
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create car error:', err);
    res.status(500).json({ error: 'Failed to create car.' });
  }
};

// Admin: update car
const updateCar = async (req, res) => {
  const fields = ['make','model','year','color','license_plate','category','transmission','fuel_type','seats','doors','price_per_day','deposit_amount','description','features','is_available','city'];
  const updates = [];
  const params = [];
  let p = 1;

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${p++}`);
      params.push(field === 'features' ? JSON.stringify(req.body[field]) : req.body[field]);
    }
  }

  if (!updates.length) return res.status(400).json({ error: 'No fields to update.' });
  params.push(req.params.id);

  try {
    const result = await query(
      `UPDATE cars SET ${updates.join(', ')} WHERE id = $${p} RETURNING *`,
      params
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Car not found.' });
    cacheInvalidate();
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update car.' });
  }
};

// Admin: delete car (only if no active reservations)
const deleteCar = async (req, res) => {
  try {
    const activeRes = await query(
      `SELECT COUNT(*) FROM reservations WHERE car_id = $1 AND status NOT IN ('cancelled', 'completed')`,
      [req.params.id]
    );
    if (parseInt(activeRes.rows[0].count) > 0) {
      return res.status(409).json({ error: 'Ce véhicule a des réservations actives. Annulez-les avant de supprimer.' });
    }
    const result = await query('DELETE FROM cars WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Véhicule introuvable.' });
    cacheInvalidate();
    res.json({ success: true });
  } catch (err) {
    console.error('Delete car error:', err);
    res.status(500).json({ error: 'Failed to delete car.' });
  }
};

module.exports = { listCars, getCar, getCarAvailability, createCar, updateCar, deleteCar };
