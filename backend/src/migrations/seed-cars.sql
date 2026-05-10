-- Update category constraint to support new categories
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_category_check;
ALTER TABLE cars ADD CONSTRAINT cars_category_check
  CHECK (category IN ('economy', 'compact', 'midsize', 'suv', 'luxury', 'van', 'sedan', 'electric', 'hybrid'));

-- Replace all cars
DELETE FROM cars;

INSERT INTO cars (make, model, year, color, license_plate, category, transmission, fuel_type, seats, doors, price_per_day, deposit_amount, description, features, images)
VALUES
  ('Skoda', 'Octavia',    2018, 'Gris Graphite', 'SK-001-OCT', 'sedan',    'manual',    'diesel',   5, 4, 0, 0, 'Berline Skoda Octavia 1.6 TDI.',       '[]', '[]'),
  ('Skoda', 'Kodiaq',     2020, 'Gris Graphite', 'SK-002-KOD', 'suv',      'automatic', 'petrol',   5, 5, 0, 0, 'SUV Skoda Kodiaq 1.5 TSI E85.',        '[]', '[]'),
  ('Toyota','Corolla 180',2020, 'Blanc',     'TY-001-C18', 'hybrid',   'automatic', 'hybrid',   5, 4, 0, 0, 'Toyota Corolla hybride 180ch.',         '[]', '[]'),
  ('Toyota','Corolla 122',2019, 'Blanc',     'TY-002-C12', 'hybrid',   'automatic', 'hybrid',   5, 4, 0, 0, 'Toyota Corolla hybride 122ch.',         '[]', '[]'),
  ('Tesla', 'Model Y',    2024, 'Noir',      'TS-001-MY',  'electric', 'automatic', 'electric', 5, 5, 0, 0, 'Tesla Model Y 100% électrique.',        '[]', '[]');
