const jwt = require('jsonwebtoken');
const db = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Use the correct property from your JWT payload
    const userId = decoded.userId || decoded.id;
    const [users] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = users[0];
    next();
  } catch (err) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

module.exports = auth;