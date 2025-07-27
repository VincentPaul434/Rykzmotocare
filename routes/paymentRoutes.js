const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// View payment amount for an appointment
router.get('/:appointmentId', auth, paymentController.getPaymentAmount);

// Process GCash payment
router.post('/gcash', auth, paymentController.processGCashPayment);

module.exports = router;