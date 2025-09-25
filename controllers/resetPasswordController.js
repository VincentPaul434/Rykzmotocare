const db = require('../config/db');
const bcrypt = require('bcrypt');

// POST /api/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required.' });
    }

    // Hash the new password
    const hash = await bcrypt.hash(newPassword, 10);

    // Update password in users table
    const [result] = await db.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hash, email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};