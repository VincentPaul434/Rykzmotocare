const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Fixed path (added ..)
const { validationResult } = require('express-validator');

// Register a new user
const register = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, email, password, phone, address, user_type } = req.body;
    
    // Validate user type
    if (!['customer', 'mechanic'].includes(user_type)) {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' }); // 409 Conflict
    }
    
    // Hash password
    const hashedPassword = await User.hashPassword(password);
    
    // Create user
    const userId = await User.create({
      first_name,
      last_name,
      email,
      password_hash: hashedPassword,
      phone,
      address,
      user_type
    });
    
    // Handle mechanic registration
    if (user_type === 'mechanic') {
      const { specialization, hourly_rate } = req.body;
      
      if (!specialization || !hourly_rate) {
        return res.status(400).json({ message: 'Specialization and hourly rate are required for mechanics' });
      }
      
      await User.createMechanic(userId, { specialization, hourly_rate });
    }
    
    // Generate token for immediate login
    const token = jwt.sign(
      { id: userId, user_type },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user_id: userId,
      user_type
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' }); // 401 Unauthorized
    }
    
    // Compare passwords
    const isMatch = await User.comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT secret not configured');
    }
    
    // Create token
    const token = jwt.sign(
      { id: user.user_id, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ 
      token,
      user_type: user.user_type,
      user_id: user.user_id,
      expires_in: 3600 // 1 hour in seconds
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate passwords
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different' });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await User.comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    const hashedPassword = await User.hashPassword(newPassword);
    await User.updatePassword(userId, hashedPassword);
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ 
      message: 'Password change failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = { register, login, changePassword };