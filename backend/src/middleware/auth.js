const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Also accept ?token= for direct browser navigation (e.g. contract download links)
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.split(' ')[1]
    : req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      `SELECT id, email, phone, role, status,
              first_name, last_name,
              email_verified, phone_verified
       FROM users WHERE id = $1`,
      [decoded.userId]
    );
    if (!result.rows[0]) return res.status(401).json({ error: 'User not found' });
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
