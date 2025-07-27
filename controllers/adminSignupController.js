const db = require('../config/db');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

exports.validate = [
  body('id_number')
    .matches(/^\d{2}-\d{4}-\d{3}$/)
    .withMessage('ID number must be in xx-xxxx-xxx format'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password min 6 chars'),
];

exports.signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { password, id_number } = req.body;

  try {
    // Check if admin with this ID number exists
    const [existing] = await db.query('SELECT * FROM admin WHERE id_number = ?', [id_number]);
    if (existing.length > 0) return res.status(400).json({ message: 'ID number already registered' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin user into admin table
    await db.query(
      'INSERT INTO admin (id_number, password) VALUES (?, ?)',
      [id_number, hashedPassword]
    );

    res.status(201).json({ message: 'Admin account created successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};