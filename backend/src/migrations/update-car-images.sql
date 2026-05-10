-- Migration : remplacement images Unsplash par images locales + correction couleurs Skoda
UPDATE cars SET images = '["/cars/skoda-octavia.png"]',  color = 'Gris Graphite' WHERE license_plate = 'SK-001-OCT';
UPDATE cars SET images = '["/cars/skoda-kodiaq.png"]',   color = 'Gris Graphite' WHERE license_plate = 'SK-002-KOD';
UPDATE cars SET images = '["/cars/skoda-superb.png"]'                             WHERE license_plate = 'SK-004-SUP';
UPDATE cars SET images = '["/cars/toyota-corolla.png"]'                           WHERE license_plate = 'TY-001-C18';
UPDATE cars SET images = '["/cars/toyota-corolla.png"]'                           WHERE license_plate = 'TY-002-C12';
UPDATE cars SET images = '["/cars/tesla-model-y.png"]'                            WHERE license_plate = 'TS-001-MY';
UPDATE cars SET images = '["/cars/tesla-model-3.png"]'                            WHERE license_plate = 'TS-002-M3';
UPDATE cars SET images = '["/cars/toyota-prius-argent.png"]'                      WHERE license_plate = 'TY-003-PRI';
UPDATE cars SET images = '["/cars/toyota-prius-blanc.png"]'                       WHERE license_plate = 'TY-006-PRI';
UPDATE cars SET images = '["/cars/mercedes-classe-e.png"]'                        WHERE license_plate = 'MB-001-CLE';
UPDATE cars SET images = '["/cars/mercedes-classe-e.png"]'                        WHERE license_plate = 'MB-003-CLE';
UPDATE cars SET images = '["/cars/peugeot-508.png"]'                              WHERE license_plate = 'PE-001-508';
UPDATE cars SET images = '["/cars/peugeot-3008.png"]'                             WHERE license_plate = 'PE-002-300';
UPDATE cars SET images = '["/cars/renault-talisman.png"]'                         WHERE license_plate = 'RN-001-TAL';
UPDATE cars SET images = '["/cars/hyundai-ioniq.png"]'                            WHERE license_plate = 'HY-001-ION';
UPDATE cars SET images = '["/cars/kia-e-niro.png"]'                               WHERE license_plate = 'KI-001-ENI';
