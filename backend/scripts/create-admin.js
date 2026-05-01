#!/usr/bin/env node
'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const bcrypt      = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db }      = require('../src/config/database');

const email    = process.argv[2] || 'admin@autorent.fr';
const password = process.argv[3] || 'Admin1234!';

(async () => {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    console.log(`⚠️  A user with email "${email}" already exists.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  db.prepare(`
    INSERT INTO users
      (id, email, password_hash, first_name, last_name, role, status,
       is_verified, email_verified, phone_verified)
    VALUES (?, ?, ?, 'Admin', 'AutoRent', 'admin', 'approved', 1, 1, 1)
  `).run(uuidv4(), email, hash);

  console.log('✅ Admin account created successfully.');
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${password}`);
  console.log('');
  console.log('   Login at http://localhost:3000/auth/login');
  process.exit(0);
})();
