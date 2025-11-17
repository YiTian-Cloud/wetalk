// middleware/auth.js
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Not logged in – we allow this; some routes might still work for guests
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch (err) {
    console.error('JWT verify error:', err.message);
    req.user = null;
    next(); // continue but as guest
  }
}

module.exports = auth;
