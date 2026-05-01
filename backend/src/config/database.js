'use strict';
const { DatabaseSync } = require('node:sqlite');
const { v4: uuidv4 }   = require('uuid');
const path = require('path');
const fs   = require('fs');

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_PATH  = path.join(DATA_DIR, 'car_rental.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

const isNew = !fs.existsSync(DB_PATH);
const db    = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

/* ── Auto-initialise on first run ──────────────────────────────────────── */
if (isNew) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id                        TEXT PRIMARY KEY,
      email                     TEXT UNIQUE NOT NULL,
      password_hash             TEXT NOT NULL,
      first_name                TEXT NOT NULL,
      last_name                 TEXT NOT NULL,
      phone                     TEXT,
      date_of_birth             TEXT,
      place_of_birth            TEXT,
      driver_license_number     TEXT,
      professional_card_number  TEXT,
      license_number            TEXT,
      commune                   TEXT,
      reason_for_immobilization TEXT,
      role           TEXT    NOT NULL DEFAULT 'user'
                             CHECK (role IN ('user','admin')),
      status         TEXT    NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','approved','rejected')),
      is_verified    INTEGER NOT NULL DEFAULT 0,
      email_verified INTEGER NOT NULL DEFAULT 0,
      phone_verified INTEGER NOT NULL DEFAULT 0,
      created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id          TEXT PRIMARY KEY,
      user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
      type        TEXT NOT NULL,
      file_name   TEXT NOT NULL,
      file_path   TEXT NOT NULL,
      mime_type   TEXT,
      file_size   INTEGER,
      status      TEXT NOT NULL DEFAULT 'pending',
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type        TEXT NOT NULL,
      code        TEXT NOT NULL,
      expires_at  TEXT NOT NULL,
      attempts    INTEGER NOT NULL DEFAULT 0,
      used        INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cities (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country     TEXT NOT NULL DEFAULT 'France'
    );
    CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);

    CREATE TABLE IF NOT EXISTS cars (
      id             TEXT PRIMARY KEY,
      make           TEXT    NOT NULL,
      model          TEXT    NOT NULL,
      year           INTEGER NOT NULL,
      color          TEXT,
      license_plate  TEXT UNIQUE NOT NULL,
      category       TEXT CHECK (category IN
                       ('economy','compact','midsize','suv','luxury','van',
                        'sedan','electric','hybrid')),
      transmission   TEXT CHECK (transmission IN ('automatic','manual')),
      fuel_type      TEXT CHECK (fuel_type IN ('petrol','diesel','electric','hybrid')),
      seats          INTEGER NOT NULL DEFAULT 5,
      doors          INTEGER NOT NULL DEFAULT 4,
      price_per_day  REAL    NOT NULL DEFAULT 0,
      deposit_amount REAL    NOT NULL DEFAULT 0,
      description    TEXT,
      features       TEXT NOT NULL DEFAULT '[]',
      images         TEXT NOT NULL DEFAULT '[]',
      is_available   INTEGER NOT NULL DEFAULT 1,
      mileage        INTEGER NOT NULL DEFAULT 0,
      city           TEXT    NOT NULL DEFAULT 'Paris',
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id                       TEXT PRIMARY KEY,
      user_id                  TEXT REFERENCES users(id) ON DELETE SET NULL,
      car_id                   TEXT REFERENCES cars(id)  ON DELETE SET NULL,
      start_date               TEXT    NOT NULL,
      end_date                 TEXT    NOT NULL,
      pickup_location          TEXT,
      dropoff_location         TEXT,
      pickup_time              TEXT,
      return_time              TEXT,
      reason                   TEXT,
      vehicle_location         TEXT,
      total_days               INTEGER NOT NULL,
      price_per_day            REAL    NOT NULL,
      total_amount             REAL    NOT NULL,
      deposit_amount           REAL    NOT NULL DEFAULT 0,
      status         TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN
                            ('pending','confirmed','active','completed','cancelled')),
      payment_status TEXT NOT NULL DEFAULT 'unpaid'
                          CHECK (payment_status IN
                            ('unpaid','prepaid','paid','refunded')),
      stripe_payment_intent_id TEXT,
      notes      TEXT,
      admin_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id                       TEXT PRIMARY KEY,
      reservation_id           TEXT REFERENCES reservations(id) ON DELETE SET NULL,
      user_id                  TEXT REFERENCES users(id)        ON DELETE SET NULL,
      stripe_payment_intent_id TEXT UNIQUE,
      amount     REAL NOT NULL,
      currency   TEXT NOT NULL DEFAULT 'eur',
      type       TEXT CHECK (type IN ('prepayment','full_payment','deposit','refund')),
      status     TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','succeeded','failed','refunded')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id             TEXT PRIMARY KEY,
      user_id        TEXT REFERENCES users(id)        ON DELETE SET NULL,
      reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
      type           TEXT,
      recipient      TEXT,
      subject        TEXT,
      status         TEXT NOT NULL DEFAULT 'sent',
      sent_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_reservations_car_id  ON reservations(car_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_dates   ON reservations(start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_documents_user_id    ON documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_cars_available       ON cars(is_available);

    CREATE TRIGGER IF NOT EXISTS cars_updated_at
      AFTER UPDATE ON cars BEGIN
        UPDATE cars SET updated_at = datetime('now') WHERE id = NEW.id;
      END;
    CREATE TRIGGER IF NOT EXISTS users_updated_at
      AFTER UPDATE ON users BEGIN
        UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
      END;
    CREATE TRIGGER IF NOT EXISTS reservations_updated_at
      AFTER UPDATE ON reservations BEGIN
        UPDATE reservations SET updated_at = datetime('now') WHERE id = NEW.id;
      END;
  `);

  /* Seed cities */
  const insertCity = db.prepare('INSERT INTO cities (id, name, postal_code, country) VALUES (?,?,?,?)');
  const FRENCH_CITIES = [
    ['Paris','75001'],['Marseille','13001'],['Lyon','69001'],['Toulouse','31000'],
    ['Nice','06000'],['Nantes','44000'],['Montpellier','34000'],['Strasbourg','67000'],
    ['Bordeaux','33000'],['Lille','59000'],['Rennes','35000'],['Reims','51100'],
    ['Le Havre','76600'],['Saint-Étienne','42000'],['Toulon','83000'],['Grenoble','38000'],
    ['Dijon','21000'],['Angers','49000'],['Nîmes','30000'],['Villeurbanne','69100'],
    ['Le Mans','72000'],['Aix-en-Provence','13100'],['Clermont-Ferrand','63000'],
    ['Brest','29200'],['Tours','37000'],['Amiens','80000'],['Limoges','87000'],
    ['Perpignan','66000'],['Metz','57000'],['Nancy','54000'],
    ['Boulogne-Billancourt','92100'],['Argenteuil','95100'],['Montreuil','93100'],
    ['Roubaix','59100'],['Tourcoing','59200'],['Avignon','84000'],['Nanterre','92000'],
    ['Créteil','94000'],['Poitiers','86000'],['Versailles','78000'],['Mulhouse','68100'],
    ['Pau','64000'],['Caen','14000'],['Orléans','45000'],['Rouen','76000'],
    ['Troyes','10000'],['La Rochelle','17000'],['Annecy','74000'],['Dunkerque','59140'],
    ['Lorient','56100'],['Quimper','29000'],['Calais','62100'],['Béziers','34500'],
    ['Cannes','06400'],['Valence','26000'],['Colmar','68000'],['Montauban','82000'],
    ['Bayonne','64100'],['Bastia','20200'],['Ajaccio','20000'],['Bourges','18000'],
    ['Valenciennes','59300'],['Niort','79000'],['Cholet','49300'],['Belfort','90000'],
    ['Chartres','28000'],['Albi','81000'],['Angoulême','16000'],['Brive-la-Gaillarde','19100'],
    ['Saint-Brieuc','22000'],['Laval','53000'],['Évreux','27000'],['Saint-Nazaire','44600'],
    ['Mérignac','33700'],['Antibes','06600'],['Courbevoie','92400'],['Levallois-Perret','92300'],
    ['Rueil-Malmaison','92500'],['Colombes','92700'],['Aulnay-sous-Bois','93600'],
    ['Vitry-sur-Seine','94400'],['Champigny-sur-Marne','94500'],['Issy-les-Moulineaux','92130'],
    ['Noisy-le-Grand','93160'],['Asnières-sur-Seine','92600'],['Villeneuve-d\'Ascq','59650'],
    ['Cergy','95000'],['Évry','91000'],['La Seyne-sur-Mer','83500'],['Besançon','25000'],
    ['Charleville-Mézières','08000'],['Châlons-en-Champagne','51000'],['Auxerre','89000'],
    ['Chartres','28000'],['Cherbourg-en-Cotentin','50100'],['Colmar','68000'],
    ['Épinal','88000'],['Gap','05000'],['Mâcon','71000'],['Mont-de-Marsan','40000'],
    ['Privas','07000'],['Rodez','12000'],['Vesoul','70000'],
  ];
  db.exec('BEGIN');
  const seenCities = new Set();
  for (const [name, postal_code] of FRENCH_CITIES) {
    if (!seenCities.has(name)) { seenCities.add(name); insertCity.run(uuidv4(), name, postal_code, 'France'); }
  }
  db.exec('COMMIT');

  /* Seed cars */
  const insertCar = db.prepare(`
    INSERT INTO cars
      (id, make, model, year, color, license_plate, category,
       transmission, fuel_type, seats, doors,
       price_per_day, deposit_amount, description, features, images, city)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  db.exec('BEGIN');
  insertCar.run(uuidv4(), 'Skoda',  'Octavia',     2018, 'Gris Vert', 'SK-001-OCT', 'sedan',    'manual',    'diesel',   5, 4, 0, 0, 'Berline Skoda Octavia 1.6 TDI.',  '[]', '[]', 'Paris');
  insertCar.run(uuidv4(), 'Skoda',  'Kodiaq',      2020, 'Noir',      'SK-002-KOD', 'suv',      'automatic', 'petrol',   5, 5, 0, 0, 'SUV Skoda Kodiaq 1.5 TSI E85.',   '[]', '[]', 'Paris');
  insertCar.run(uuidv4(), 'Toyota', 'Corolla 180', 2020, 'Blanc',     'TY-001-C18', 'hybrid',   'automatic', 'hybrid',   5, 4, 0, 0, 'Toyota Corolla hybride 180ch.',    '[]', '[]', 'Lyon');
  insertCar.run(uuidv4(), 'Toyota', 'Corolla 122', 2019, 'Blanc',     'TY-002-C12', 'hybrid',   'automatic', 'hybrid',   5, 4, 0, 0, 'Toyota Corolla hybride 122ch.',    '[]', '[]', 'Lyon');
  insertCar.run(uuidv4(), 'Tesla',  'Model Y',     2024, 'Noir',      'TS-001-MY',  'electric', 'automatic', 'electric', 5, 5, 0, 0, 'Tesla Model Y 100% électrique.',   '[]', '[]', 'Marseille');
  db.exec('COMMIT');

  console.log('SQLite database initialised with schema and seed data.');
}

/* ── Migrations for existing databases ─────────────────────────────────── */
function runMigrations() {
  const addCol = (table, col, def) => {
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`); } catch {}
  };

  // User columns
  addCol('users', 'status',         "TEXT NOT NULL DEFAULT 'pending'");
  addCol('users', 'email_verified', 'INTEGER NOT NULL DEFAULT 0');
  addCol('users', 'phone_verified', 'INTEGER NOT NULL DEFAULT 0');

  // Reservation columns
  addCol('reservations', 'reason',           'TEXT');
  addCol('reservations', 'vehicle_location', 'TEXT');
  addCol('reservations', 'pickup_time',      'TEXT');
  addCol('reservations', 'return_time',      'TEXT');
  addCol('reservations', 'admin_note',       'TEXT');

  // Document status + verification engine columns
  addCol('documents', 'status',           "TEXT NOT NULL DEFAULT 'pending'");
  addCol('documents', 'extracted_text',   'TEXT');
  addCol('documents', 'extracted_data',   'TEXT');
  addCol('documents', 'confidence_score', 'REAL');
  addCol('documents', 'auto_status',      "TEXT NOT NULL DEFAULT 'pending_review'");
  addCol('documents', 'verification_log', 'TEXT');
  addCol('documents', 'admin_note',       'TEXT');

  // Deposit pre-authorisation columns on reservations
  addCol('reservations', 'deposit_stripe_intent_id', 'TEXT');
  addCol('reservations', 'deposit_status',           "TEXT NOT NULL DEFAULT 'none'");

  // Auto-approve admins, auto-verify admins and previously approved users
  try { db.exec("UPDATE users SET status = 'approved' WHERE role = 'admin' AND status = 'pending'"); } catch {}
  try { db.exec("UPDATE users SET email_verified = 1, phone_verified = 1 WHERE role = 'admin' OR status = 'approved'"); } catch {}

  // OTP table
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS otp_codes (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      type       TEXT NOT NULL,
      code       TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts   INTEGER NOT NULL DEFAULT 0,
      used       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
  } catch {}
  // Backfill attempts column on existing otp_codes tables
  addCol('otp_codes', 'attempts', 'INTEGER NOT NULL DEFAULT 0');

  // Cars city column
  addCol('cars', 'city', "TEXT NOT NULL DEFAULT 'Paris'");

  // Cities table + seed
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS cities (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country     TEXT NOT NULL DEFAULT 'France'
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name)');
  } catch {}
  try {
    const cityCount = db.prepare('SELECT COUNT(*) as cnt FROM cities').get();
    if (!cityCount || Number(cityCount.cnt) === 0) {
      const insertCity = db.prepare('INSERT INTO cities (id, name, postal_code, country) VALUES (?,?,?,?)');
      const FRENCH_CITIES = [
        ['Paris','75001'],['Marseille','13001'],['Lyon','69001'],['Toulouse','31000'],
        ['Nice','06000'],['Nantes','44000'],['Montpellier','34000'],['Strasbourg','67000'],
        ['Bordeaux','33000'],['Lille','59000'],['Rennes','35000'],['Reims','51100'],
        ['Le Havre','76600'],['Saint-Étienne','42000'],['Toulon','83000'],['Grenoble','38000'],
        ['Dijon','21000'],['Angers','49000'],['Nîmes','30000'],['Villeurbanne','69100'],
        ['Le Mans','72000'],['Aix-en-Provence','13100'],['Clermont-Ferrand','63000'],
        ['Brest','29200'],['Tours','37000'],['Amiens','80000'],['Limoges','87000'],
        ['Perpignan','66000'],['Metz','57000'],['Nancy','54000'],
        ['Boulogne-Billancourt','92100'],['Argenteuil','95100'],['Montreuil','93100'],
        ['Roubaix','59100'],['Tourcoing','59200'],['Avignon','84000'],['Nanterre','92000'],
        ['Créteil','94000'],['Poitiers','86000'],['Versailles','78000'],['Mulhouse','68100'],
        ['Pau','64000'],['Caen','14000'],['Orléans','45000'],['Rouen','76000'],
        ['Troyes','10000'],['La Rochelle','17000'],['Annecy','74000'],['Dunkerque','59140'],
        ['Lorient','56100'],['Quimper','29000'],['Calais','62100'],['Béziers','34500'],
        ['Cannes','06400'],['Valence','26000'],['Colmar','68000'],['Montauban','82000'],
        ['Bayonne','64100'],['Bastia','20200'],['Ajaccio','20000'],['Bourges','18000'],
        ['Valenciennes','59300'],['Niort','79000'],['Cholet','49300'],['Belfort','90000'],
        ['Chartres','28000'],['Albi','81000'],['Angoulême','16000'],['Brive-la-Gaillarde','19100'],
        ['Saint-Brieuc','22000'],['Laval','53000'],['Évreux','27000'],['Saint-Nazaire','44600'],
        ['Mérignac','33700'],['Antibes','06600'],['Courbevoie','92400'],['Levallois-Perret','92300'],
        ['Rueil-Malmaison','92500'],['Colombes','92700'],['Aulnay-sous-Bois','93600'],
        ['Vitry-sur-Seine','94400'],['Champigny-sur-Marne','94500'],['Issy-les-Moulineaux','92130'],
        ['Noisy-le-Grand','93160'],['Asnières-sur-Seine','92600'],["Villeneuve-d'Ascq",'59650'],
        ['Cergy','95000'],['Évry','91000'],['La Seyne-sur-Mer','83500'],['Besançon','25000'],
        ['Charleville-Mézières','08000'],['Châlons-en-Champagne','51000'],['Auxerre','89000'],
        ['Cherbourg-en-Cotentin','50100'],['Épinal','88000'],['Gap','05000'],
        ['Mâcon','71000'],['Mont-de-Marsan','40000'],['Rodez','12000'],['Vesoul','70000'],
      ];
      db.exec('BEGIN');
      const seen = new Set();
      for (const [name, postal_code] of FRENCH_CITIES) {
        if (!seen.has(name)) { seen.add(name); insertCity.run(uuidv4(), name, postal_code, 'France'); }
      }
      db.exec('COMMIT');
    }
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch {}
    console.error('Cities seed failed:', e.message);
  }

  // Indexes
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_otp_user ON otp_codes(user_id, type)'); } catch {}

  // Recreate documents table if old restrictive CHECK constraint is present
  const docRow = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='documents'").get();
  if (docRow && docRow.sql && docRow.sql.includes("CHECK (type IN")) {
    try {
      db.exec('BEGIN');
      db.exec(`CREATE TABLE documents_new (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        mime_type TEXT,
        file_size INTEGER,
        uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      db.exec('INSERT INTO documents_new SELECT id, user_id, type, file_name, file_path, mime_type, file_size, uploaded_at FROM documents');
      db.exec('DROP TABLE documents');
      db.exec('ALTER TABLE documents_new RENAME TO documents');
      db.exec('CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)');
      db.exec('COMMIT');
    } catch (e) {
      try { db.exec('ROLLBACK'); } catch {}
      console.error('Documents migration failed:', e.message);
    }
  }
}

runMigrations();

/* ── Dev-only: promote test account to admin ────────────────────────────── */
if (process.env.NODE_ENV === 'development') {
  const DEV_ADMIN_EMAIL = 'jeandupont@gmail.com';
  try {
    const result = db.prepare(
      "UPDATE users SET role = 'admin', status = 'approved', email_verified = 1, phone_verified = 1 WHERE email = ?"
    ).run(DEV_ADMIN_EMAIL);
    if (result.changes > 0) {
      console.log(`[DEV] User ${DEV_ADMIN_EMAIL} promoted to admin`);
    }
  } catch (e) {
    console.error('[DEV] Failed to promote dev admin:', e.message);
  }
}

/* ── Row normaliser ─────────────────────────────────────────────────────── */
const JSON_COLS = new Set(['features', 'images']);
const BOOL_COLS = new Set(['is_available', 'is_verified', 'email_verified', 'phone_verified']);

function normalizeRow(row) {
  if (!row) return null;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (JSON_COLS.has(k) && typeof v === 'string') {
      try { out[k] = JSON.parse(v); } catch { out[k] = v; }
    } else if (BOOL_COLS.has(k)) {
      out[k] = v === 1 || v === true;
    } else {
      out[k] = v;
    }
  }
  return out;
}

/* ── SQL helpers ────────────────────────────────────────────────────────── */

// PostgreSQL $1 $2 … → SQLite ?
const pgToSqlite = (sql) => sql.replace(/\$\d+/g, '?');

// Strip RETURNING clause, return whether one existed
function stripReturning(sql) {
  const idx = sql.search(/\s+RETURNING\b/i);
  return idx === -1
    ? { clean: sql, hasReturning: false }
    : { clean: sql.slice(0, idx).trim(), hasReturning: true };
}

// Add a generated UUID id column when the INSERT doesn't include one
function injectUUID(sql) {
  const m = sql.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)/i);
  if (!m) return sql;
  const cols = m[1].split(',').map((s) => s.trim().toLowerCase());
  if (cols.includes('id')) return sql;

  return sql
    .replace(/(INSERT\s+INTO\s+\w+\s*\()([^)]+\))/, `$1id, $2`)
    .replace(/VALUES\s*\(/, `VALUES ('${uuidv4()}', `);
}

/* ── Main query wrapper ─────────────────────────────────────────────────── */
function query(text, params = []) {
  try {
    const { clean: rawSql, hasReturning } = stripReturning(text);
    const sql   = pgToSqlite(rawSql);
    const upper = sql.trimStart().toUpperCase();

    /* SELECT ─────────────────────────────────────────────────────────────── */
    if (upper.startsWith('SELECT')) {
      if (/^\s*SELECT\s+COUNT\s*\(\s*\*?\s*\)\s*(?:as\s+\w+\s+)?FROM\b/i.test(sql)) {
        const row   = db.prepare(sql).get(...params);
        const count = row ? Object.values(row)[0] : 0;
        return Promise.resolve({ rows: [{ count: String(count) }] });
      }
      const rows = db.prepare(sql).all(...params).map(normalizeRow);
      return Promise.resolve({ rows });
    }

    /* INSERT ─────────────────────────────────────────────────────────────── */
    if (upper.startsWith('INSERT')) {
      const finalSql = injectUUID(sql);
      const info     = db.prepare(finalSql).run(...params);

      if (hasReturning) {
        const tm = finalSql.match(/INSERT\s+INTO\s+(\w+)/i);
        if (tm) {
          const row = db.prepare(`SELECT * FROM ${tm[1]} WHERE rowid = ?`).get(info.lastInsertRowid);
          return Promise.resolve({ rows: row ? [normalizeRow(row)] : [] });
        }
      }
      return Promise.resolve({ rows: [], rowCount: info.changes });
    }

    /* UPDATE ─────────────────────────────────────────────────────────────── */
    if (upper.startsWith('UPDATE')) {
      const info = db.prepare(sql).run(...params);

      if (hasReturning && info.changes > 0) {
        const tm     = sql.match(/UPDATE\s+(\w+)\s+SET/i);
        const whereM = sql.match(/WHERE\s+([\s\S]+)$/i);
        if (tm && whereM) {
          // Count ? marks in the SET portion to split params between SET and WHERE
          const setM      = sql.match(/SET\s+([\s\S]+?)\s+WHERE/i);
          const setQCount = setM ? (setM[1].match(/\?/g) || []).length : 0;
          const wherePrms = params.slice(setQCount);
          const row = db.prepare(`SELECT * FROM ${tm[1]} WHERE ${whereM[1]}`).get(...wherePrms);
          return Promise.resolve({ rows: row ? [normalizeRow(row)] : [] });
        }
      }

      return Promise.resolve({ rows: [], rowCount: info.changes });
    }

    /* DELETE / other ─────────────────────────────────────────────────────── */
    const info = db.prepare(sql).run(...params);
    return Promise.resolve({ rows: [], rowCount: info.changes });

  } catch (err) {
    return Promise.reject(err);
  }
}

process.on('exit',    () => db.close());
process.on('SIGINT',  () => { db.close(); process.exit(0); });
process.on('SIGTERM', () => { db.close(); process.exit(0); });

module.exports = { db, query };
