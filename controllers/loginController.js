const db = require('../config/db');
const User = require('../models/user');
const Admin = require('../models/admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Identifier and password are required' });
  }

  let user;
  let passwordHash;
  let role;

  if (identifier.includes('@')) {
    // User login by email
    user = await User.findByEmail(identifier);
    passwordHash = user ? user.password_hash : null;
    role = 'user';
  } else {
    // Admin login by id_number
    user = await Admin.findByIdNumber(identifier);
    passwordHash = user ? user.password : null;
    role = 'admin';
  }

  if (!user || !passwordHash) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, passwordHash);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    {
      userId: user.user_id || user.admin_id,
      role,
      email: user.email || null,
      id_number: user.id_number || null
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  // --- THIS IS THE IMPORTANT PART ---
  if (role === 'user') {
    // If user status is pending, redirect to pending-approval page
    if (user.status === 'pending') {
      return res.json({ 
        token, 
        role, 
        status: user.status, 
        user_id: user.user_id,         // <-- add this
        name: user.name,               // <-- add this
        redirect: '/pending-approval' 
      });
    }
    // Send status for customers
    res.json({ 
      token, 
      role, 
      status: user.status, 
      user_id: user.user_id,           // <-- add this
      name: user.name                  // <-- add this
    });
  } else {
    // Admins don't need status
    res.json({ token, role, admin_id: user.admin_id });
  }
};