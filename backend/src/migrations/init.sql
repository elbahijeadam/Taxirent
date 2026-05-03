-- Taxirent Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  place_of_birth VARCHAR(255),
  driver_license_number VARCHAR(100),
  professional_card_number VARCHAR(100),
  license_number VARCHAR(100),
  commune VARCHAR(255),
  reason_for_immobilization TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table (ID, passport, driver license, professional card)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('id_card', 'passport', 'driver_license', 'professional_card')),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100),
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cars table
CREATE TABLE IF NOT EXISTS cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(50),
  license_plate VARCHAR(20) UNIQUE NOT NULL,
  category VARCHAR(50) CHECK (category IN ('economy', 'compact', 'midsize', 'suv', 'luxury', 'van', 'sedan', 'electric', 'hybrid')),
  transmission VARCHAR(20) CHECK (transmission IN ('automatic', 'manual')),
  fuel_type VARCHAR(20) CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')),
  seats INTEGER DEFAULT 5,
  doors INTEGER DEFAULT 4,
  price_per_day DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  description TEXT,
  features JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  is_available BOOLEAN DEFAULT true,
  mileage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update category constraint for existing installs
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_category_check;
ALTER TABLE cars ADD CONSTRAINT cars_category_check
  CHECK (category IN ('economy', 'compact', 'midsize', 'suv', 'luxury', 'van', 'sedan', 'electric', 'hybrid'));

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pickup_location VARCHAR(255),
  dropoff_location VARCHAR(255),
  total_days INTEGER NOT NULL,
  price_per_day DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  payment_status VARCHAR(30) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'prepaid', 'paid', 'refunded')),
  stripe_payment_intent_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'eur',
  type VARCHAR(20) CHECK (type IN ('prepayment', 'full_payment', 'deposit', 'refund')),
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email notifications log
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  type VARCHAR(50),
  recipient VARCHAR(255),
  subject VARCHAR(500),
  status VARCHAR(20) DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reservations_car_id ON reservations(car_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_cars_available ON cars(is_available);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER cars_updated_at BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Replace car data
DELETE FROM cars;
INSERT INTO cars (make, model, year, color, license_plate, category, transmission, fuel_type, seats, doors, price_per_day, deposit_amount, description, features, images)
VALUES
  ('Skoda', 'Octavia', 2018, 'Gris Vert', 'SK-001-OCT', 'sedan', 'manual', 'diesel', 5, 4, 0.00, 0.00, 'Berline Skoda Octavia 1.6 TDI.', '[]', '[]'),
  ('Skoda', 'Kodiaq', 2020, 'Noir', 'SK-002-KOD', 'suv', 'automatic', 'petrol', 5, 5, 0.00, 0.00, 'SUV Skoda Kodiaq 1.5 TSI E85.', '[]', '[]'),
  ('Toyota', 'Corolla 180', 2020, 'Blanc', 'TY-001-C18', 'hybrid', 'automatic', 'hybrid', 5, 4, 0.00, 0.00, 'Toyota Corolla hybride 180ch.', '[]', '[]'),
  ('Toyota', 'Corolla 122', 2019, 'Blanc', 'TY-002-C12', 'hybrid', 'automatic', 'hybrid', 5, 4, 0.00, 0.00, 'Toyota Corolla hybride 122ch.', '[]', '[]'),
  ('Tesla', 'Model Y', 2024, 'Noir', 'TS-001-MY', 'electric', 'automatic', 'electric', 5, 5, 0.00, 0.00, 'Tesla Model Y 100% électrique.', '[]', '[]');
