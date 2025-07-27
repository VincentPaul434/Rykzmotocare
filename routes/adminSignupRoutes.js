const express = require('express');
const router = express.Router();
const adminSignup = require('../controllers/adminSignupController');

// Only use adminSignup.validate (no email validation)
router.post('/admin/signup', adminSignup.validate, adminSignup.signup);

module.exports = router;