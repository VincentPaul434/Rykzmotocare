const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth'); // Correct path

// Simple test route to verify auth works
router.get('/test-auth', auth, (req, res) => {
  res.json({ message: 'Auth works!', user: req.user });
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/change-password', auth, authController.changePassword);

module.exports = router;