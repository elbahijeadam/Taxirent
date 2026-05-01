'use strict';
// Resets the SQLite database: deletes the existing file then triggers auto-init.
const fs   = require('fs');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../../data/car_rental.db');

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('Removed existing database.');
}

require('../config/database');
console.log('Migration complete.');
process.exit(0);
