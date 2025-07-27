const User = require('../models/user');
const { body, validationResult } = require('express-validator');

exports.validate = [
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').isMobilePhone().withMessage('Valid phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, phone, password } = req.body;

  try {
    // Check if user exists
    const existing = await User.findByEmail(email);
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    // Hash password
    const password_hash = await User.hashPassword(password);

    // Create user (include name and status)
    const userId = await User.create({
      name,
      email,
      password_hash,
      phone,
      user_type: 'customer',
      status: 'pending'
    });

    res.status(201).json({ message: 'Account created successfully', user_id: userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};