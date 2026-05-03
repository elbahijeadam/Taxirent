'use strict';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/taxirent',
  ssl: (process.env.DATABASE_URL || '').match(/localhost|127\.0\.0\.1/)
    ? false
    : { rejectUnauthorized: false },
});

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

/* ── Query wrapper ──────────────────────────────────────────────────────── */
async function query(text, params = []) {
  const result = await pool.query(text, params);
  return { ...result, rows: result.rows.map(normalizeRow) };
}

/* ── Schema ─────────────────────────────────────────────────────────────── */
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id                        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email                     TEXT UNIQUE NOT NULL,
        password_hash             TEXT NOT NULL,
        first_name                TEXT NOT NULL,
        last_name                 TEXT NOT NULL,
        phone                     TEXT,
        date_of_birth             TEXT,
        place_of_birth            TEXT,
        driver_license_number     TEXT,
        driver_license_date       TEXT,
        professional_card_number  TEXT,
        license_number            TEXT,
        commune                   TEXT,
        address                   TEXT,
        reason_for_immobilization TEXT,
        role           TEXT    NOT NULL DEFAULT 'user'
                               CHECK (role IN ('user','admin')),
        status         TEXT    NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','approved','rejected')),
        is_verified    SMALLINT NOT NULL DEFAULT 0,
        email_verified SMALLINT NOT NULL DEFAULT 0,
        phone_verified SMALLINT NOT NULL DEFAULT 0,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id          TEXT REFERENCES users(id) ON DELETE CASCADE,
        type             TEXT NOT NULL,
        file_name        TEXT NOT NULL,
        file_path        TEXT NOT NULL,
        mime_type        TEXT,
        file_size        INTEGER,
        status           TEXT NOT NULL DEFAULT 'pending',
        extracted_text   TEXT,
        extracted_data   TEXT,
        confidence_score REAL,
        auto_status      TEXT NOT NULL DEFAULT 'pending_review',
        verification_log TEXT,
        admin_note       TEXT,
        uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type       TEXT NOT NULL,
        code       TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        attempts   INTEGER  NOT NULL DEFAULT 0,
        used       SMALLINT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name        TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country     TEXT NOT NULL DEFAULT 'France'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        make           TEXT    NOT NULL,
        model          TEXT    NOT NULL,
        year           INTEGER NOT NULL,
        color          TEXT,
        license_plate  TEXT UNIQUE NOT NULL,
        category       TEXT CHECK (category IN
                         ('economy','compact','midsize','suv','van',
                          'sedan','electric','hybrid')),
        transmission   TEXT CHECK (transmission IN ('automatic','manual')),
        fuel_type      TEXT CHECK (fuel_type IN ('petrol','diesel','electric','hybrid')),
        seats          INTEGER  NOT NULL DEFAULT 5,
        doors          INTEGER  NOT NULL DEFAULT 4,
        price_per_day  REAL     NOT NULL DEFAULT 0,
        deposit_amount REAL     NOT NULL DEFAULT 0,
        description    TEXT,
        features       TEXT     NOT NULL DEFAULT '[]',
        images         TEXT     NOT NULL DEFAULT '[]',
        is_available   SMALLINT NOT NULL DEFAULT 1,
        mileage        INTEGER  NOT NULL DEFAULT 0,
        city           TEXT     NOT NULL DEFAULT 'Paris',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id                       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id                  TEXT REFERENCES users(id)  ON DELETE SET NULL,
        car_id                   TEXT REFERENCES cars(id)   ON DELETE SET NULL,
        start_date               TEXT NOT NULL,
        end_date                 TEXT NOT NULL,
        pickup_location          TEXT,
        dropoff_location         TEXT,
        pickup_time              TEXT,
        return_time              TEXT,
        reason                   TEXT,
        vehicle_location         TEXT,
        immobilized_plate        TEXT,
        total_days               INTEGER NOT NULL,
        price_per_day            REAL    NOT NULL,
        total_amount             REAL    NOT NULL,
        deposit_amount           REAL    NOT NULL DEFAULT 0,
        deposit_stripe_intent_id TEXT,
        deposit_status           TEXT    NOT NULL DEFAULT 'none',
        status         TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN
                              ('pending','confirmed','active','completed','cancelled')),
        payment_status TEXT NOT NULL DEFAULT 'unpaid'
                            CHECK (payment_status IN
                              ('unpaid','prepaid','paid','refunded')),
        stripe_payment_intent_id TEXT,
        notes      TEXT,
        admin_note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id                       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        reservation_id           TEXT REFERENCES reservations(id) ON DELETE SET NULL,
        user_id                  TEXT REFERENCES users(id)        ON DELETE SET NULL,
        stripe_payment_intent_id TEXT UNIQUE,
        amount     REAL NOT NULL,
        currency   TEXT NOT NULL DEFAULT 'eur',
        type       TEXT CHECK (type IN ('prepayment','full_payment','deposit','refund')),
        status     TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','succeeded','failed','refunded')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id        TEXT REFERENCES users(id)        ON DELETE SET NULL,
        reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
        type      TEXT,
        recipient TEXT,
        subject   TEXT,
        status    TEXT NOT NULL DEFAULT 'sent',
        sent_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Indexes
    for (const sql of [
      `CREATE INDEX IF NOT EXISTS idx_cities_name        ON cities(name)`,
      `CREATE INDEX IF NOT EXISTS idx_reservations_car   ON reservations(car_id)`,
      `CREATE INDEX IF NOT EXISTS idx_reservations_user  ON reservations(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date)`,
      `CREATE INDEX IF NOT EXISTS idx_documents_user     ON documents(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_cars_available     ON cars(is_available)`,
      `CREATE INDEX IF NOT EXISTS idx_users_status       ON users(status)`,
      `CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role)`,
      `CREATE INDEX IF NOT EXISTS idx_otp_user           ON otp_codes(user_id, type)`,
    ]) { await client.query(sql); }

    // Auto-update updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql
    `);
    for (const tbl of ['cars', 'users', 'reservations']) {
      await client.query(`DROP TRIGGER IF EXISTS ${tbl}_updated_at ON ${tbl}`);
      await client.query(`
        CREATE TRIGGER ${tbl}_updated_at
        BEFORE UPDATE ON ${tbl}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
      `);
    }

    // Migrate: replace legacy 'luxury' category with 'sedan'
    await client.query(`UPDATE cars SET category = 'sedan' WHERE category = 'luxury'`);

    // Migrate: drop old category CHECK constraint and recreate without 'luxury'
    await client.query(`ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_category_check`);
    await client.query(`ALTER TABLE cars ADD CONSTRAINT cars_category_check
      CHECK (category IN ('economy','compact','midsize','suv','van','sedan','electric','hybrid'))`);

    console.log('[DB] Schema ready');
  } finally {
    client.release();
  }

  /* ── Seed cities ────────────────────────────────────────────────────────── */
  const { rows: [{ count: cityCount }] } = await pool.query('SELECT COUNT(*) FROM cities');
  if (Number(cityCount) === 0) {
    const CITIES = [
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
    ];
    const seen = new Set();
    for (const [name, postal_code] of CITIES) {
      if (!seen.has(name)) {
        seen.add(name);
        await pool.query(
          'INSERT INTO cities (name, postal_code, country) VALUES ($1, $2, $3)',
          [name, postal_code, 'France']
        );
      }
    }
    console.log('[DB] Cities seeded');
  }

  /* ── Seed cars ──────────────────────────────────────────────────────────── */

  // Remove clone cars that were added in a previous seed run
  const CLONE_PLATES = ['SK-003-OCT','TY-004-C18','TY-005-C12','MB-002-CLE',
                        'SK-005-OCT','TY-007-C18','SK-006-KOD','TY-008-C12','TS-003-MY'];
  await pool.query(`DELETE FROM cars WHERE license_plate = ANY($1)`, [CLONE_PLATES]);

  const octaviaImg = JSON.stringify(['https://images.unsplash.com/photo-1528820846917-a476472ee6b3?auto=format&fit=crop&w=800&q=80']);
  const kodiacImg  = JSON.stringify(['https://images.unsplash.com/photo-1698413935252-04ed6377296d?auto=format&fit=crop&w=800&q=80']);
  const corollaImg = JSON.stringify(['https://images.unsplash.com/photo-1776043669128-b6b1f73bd8dd?auto=format&fit=crop&w=800&q=80']);
  const teslaImg   = JSON.stringify(['https://images.unsplash.com/photo-1678026039241-75a1becd25e5?auto=format&fit=crop&w=800&q=80']);
  const priusImg   = JSON.stringify(['https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=80']);
  const mercedesImg= JSON.stringify(['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80']);
  const peugeotImg = JSON.stringify(['https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&q=80']);
  const teslaM3Img = JSON.stringify(['https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80']);
  const renaultImg = JSON.stringify(['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80']);
  const hyundaiImg = JSON.stringify(['https://images.unsplash.com/photo-1629297696754-8f8b6cad0c23?auto=format&fit=crop&w=800&q=80']);
  const kiaImg     = JSON.stringify(['https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80']);

  // [make, model, year, color, license_plate, category, transmission, fuel_type,
  //  seats, doors, price_per_day, deposit_amount, description, features, images, city, is_available]
  const ALL_CARS = [
    // ── Paris ──────────────────────────────────────────────────────────────
    ['Skoda','Octavia',2018,'Noir','SK-001-OCT','sedan','manual','diesel',5,4,65,1500,
     "Berline Skoda Octavia 1.6 TDI équipée taxi. Lumignon, taximètre et séparation inclus. Idéale pour reprendre l'activité rapidement.",
     JSON.stringify(['Équipement taxi complet','Climatisation','GPS','Bluetooth','Régulateur de vitesse']),octaviaImg,'Paris',1],
    ['Skoda','Kodiaq',2020,'Noir','SK-002-KOD','suv','automatic','petrol',5,5,90,1500,
     'SUV Skoda Kodiaq équipé taxi, idéal pour les courses longues distances et aéroports. Grand coffre.',
     JSON.stringify(['Équipement taxi complet','Climatisation','GPS','Bluetooth','Caméra de recul']),kodiacImg,'Paris',1],
    ['Toyota','Corolla 180ch',2020,'Blanc','TY-001-C18','hybrid','automatic','hybrid',5,4,75,1500,
     'Toyota Corolla hybride 180ch équipée taxi. Faible consommation pour maximiser votre rentabilité. Très fiable.',
     JSON.stringify(['Équipement taxi complet','Climatisation','GPS','Bluetooth','Hybride']),corollaImg,'Paris',1],
    ['Toyota','Corolla 122ch',2019,'Blanc','TY-002-C12','hybrid','automatic','hybrid',5,4,70,1500,
     'Toyota Corolla hybride 122ch équipée taxi. Le choix des chauffeurs professionnels parisiens. Économique et fiable.',
     JSON.stringify(['Équipement taxi complet','Climatisation','GPS','Bluetooth','Hybride']),corollaImg,'Paris',1],
    ['Tesla','Model Y',2024,'Noir','TS-001-MY','electric','automatic','electric',5,5,120,1500,
     'Tesla Model Y 100% électrique équipée taxi. Autonomie 500km, recharge rapide. Zéro émission pour circuler en ZFE.',
     JSON.stringify(['Équipement taxi complet','Autopilot','GPS','Écran 15 pouces','Recharge rapide','Climatisation']),teslaImg,'Paris',1],
    ['Toyota','Prius',2021,'Argent','TY-003-PRI','hybrid','automatic','hybrid',5,4,72,1500,
     'Toyota Prius hybride équipée taxi. En maintenance préventive, disponible prochainement.',
     JSON.stringify(['Équipement taxi complet','Climatisation','GPS','Bluetooth','Hybride']),priusImg,'Paris',0],
    ['Tesla','Model 3',2023,'Blanc','TS-002-M3','electric','automatic','electric',5,4,110,1500,
     'Tesla Model 3 100% électrique équipée taxi. En attente de mise en service.',
     JSON.stringify(['Équipement taxi complet','Autopilot','GPS','Écran 15 pouces','Recharge rapide']),teslaM3Img,'Paris',0],

    // ── Boulogne-Billancourt ────────────────────────────────────────────────
    ['Mercedes','Classe E',2021,'Noir','MB-001-CLE','sedan','automatic','diesel',5,4,105,1500,
     'Mercedes Classe E 220d équipée taxi. En révision complète, retour en flotte sous 10 jours.',
     JSON.stringify(['Équipement taxi complet','Climatisation bi-zone','GPS','Bluetooth','Sièges cuir']),mercedesImg,'Boulogne-Billancourt',0],

    // ── Créteil ────────────────────────────────────────────────────────────
    ['Peugeot','508',2021,'Noir','PE-001-508','sedan','automatic','diesel',5,4,78,1500,
     'Peugeot 508 berline premium équipée taxi. Design élégant, confort supérieur et faible consommation.',
     JSON.stringify(['Équipement taxi complet','Climatisation','GPS','Bluetooth','Régulateur adaptatif','Caméra de recul']),peugeotImg,'Créteil',1],

    // ── Nanterre ───────────────────────────────────────────────────────────
    ['Renault','Talisman',2020,'Gris','RN-001-TAL','sedan','automatic','diesel',5,4,68,1500,
     'Renault Talisman berline équipée taxi. Spacieuse et confortable, idéale pour la Défense et les déplacements professionnels.',
     JSON.stringify(['Équipement taxi complet','Climatisation','GPS','Bluetooth','Régulateur de vitesse']),renaultImg,'Nanterre',1],
    ['Skoda','Superb',2020,'Noir','SK-004-SUP','sedan','automatic','diesel',5,4,82,1500,
     'Skoda Superb berline spacieuse équipée taxi. En révision, retour prévu prochainement.',
     JSON.stringify(['Équipement taxi complet','Climatisation','GPS','Bluetooth','Sièges chauffants','Grand coffre']),octaviaImg,'Nanterre',0],

    // ── Versailles ─────────────────────────────────────────────────────────
    ['Toyota','Prius',2022,'Blanc','TY-006-PRI','hybrid','automatic','hybrid',5,4,72,1500,
     'Toyota Prius hybride équipée taxi. Parfaite pour desservir Versailles, le 78 et au-delà.',
     JSON.stringify(['Équipement taxi complet','Climatisation','GPS','Bluetooth','Hybride']),priusImg,'Versailles',1],

    // ── Bobigny ────────────────────────────────────────────────────────────
    ['Hyundai','Ioniq',2021,'Blanc','HY-001-ION','hybrid','automatic','hybrid',5,4,70,1500,
     'Hyundai Ioniq hybride équipée taxi. Faibles émissions, idéale pour le 93 et les zones ZFE.',
     JSON.stringify(['Équipement taxi complet','Climatisation','GPS','Bluetooth','Hybride','Caméra de recul']),hyundaiImg,'Bobigny',1],

    // ── Évry ───────────────────────────────────────────────────────────────
    ['Peugeot','3008',2022,'Gris','PE-002-300','suv','automatic','hybrid',5,5,88,1500,
     'Peugeot 3008 hybride rechargeable équipé taxi. SUV moderne, idéal pour les transferts aéroport Orly.',
     JSON.stringify(['Équipement taxi complet','Climatisation','GPS','Bluetooth','Hybride rechargeable','Caméra 360°']),peugeotImg,'Évry',1],

    // ── Cergy ──────────────────────────────────────────────────────────────
    ['Kia','e-Niro',2022,'Blanc','KI-001-ENI','electric','automatic','electric',5,4,85,1500,
     'Kia e-Niro 100% électrique équipée taxi. Autonomie 455km, zéro émission. Idéale pour le Val-d\'Oise.',
     JSON.stringify(['Équipement taxi complet','Climatisation','GPS','Bluetooth','Électrique','Recharge rapide']),kiaImg,'Cergy',1],

    // ── Issy-les-Moulineaux ────────────────────────────────────────────────
    ['Mercedes','Classe E',2022,'Noir','MB-003-CLE','sedan','automatic','hybrid',5,4,110,1500,
     'Mercedes Classe E hybride équipée taxi. Confort et élégance pour vos déplacements professionnels.',
     JSON.stringify(['Équipement taxi complet','Climatisation bi-zone','GPS','Bluetooth','Sièges cuir','Hybride']),mercedesImg,'Issy-les-Moulineaux',1],
  ];

  let addedCars = 0;
  for (const [make,model,year,color,lp,cat,trans,fuel,seats,doors,ppd,dep,desc,feat,imgs,city,avail] of ALL_CARS) {
    const r = await pool.query(
      `INSERT INTO cars
         (make,model,year,color,license_plate,category,transmission,fuel_type,
          seats,doors,price_per_day,deposit_amount,description,features,images,city,is_available)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (license_plate) DO NOTHING`,
      [make,model,year,color,lp,cat,trans,fuel,seats,doors,ppd,dep,desc,feat,imgs,city,avail]
    );
    if (r.rowCount > 0) addedCars++;
  }
  if (addedCars > 0) console.log(`[DB] Cars seeded: ${addedCars} added`);

  /* ── Bootstrap admin ────────────────────────────────────────────────────── */
  const { rows: adminRows } = await pool.query(
    "SELECT id FROM users WHERE email = 'elbahijeadam@gmail.com' AND role = 'admin'"
  );
  if (adminRows.length === 0) {
    await pool.query('DELETE FROM email_logs');
    await pool.query('DELETE FROM otp_codes');
    await pool.query('DELETE FROM documents');
    await pool.query('UPDATE reservations SET user_id = NULL');
    await pool.query('DELETE FROM users');
    await pool.query(
      `INSERT INTO users
         (email, password_hash, first_name, last_name, phone, role, status, email_verified, phone_verified)
       VALUES ($1, $2, $3, $4, $5, 'admin', 'approved', 1, 1)`,
      [
        'elbahijeadam@gmail.com',
        '$2a$12$R8jrfOqcsneftp5z.sXPe.xQ7PLvASykQftBdqc25Xi380nDzC7US',
        'Adam', 'El Bahije', '+33606763589',
      ]
    );
    console.log('[DB] Admin bootstrapped: elbahijeadam@gmail.com');
  }
}

module.exports = { query, initDb, pool };
