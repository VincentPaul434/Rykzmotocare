const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// GET /api/payments
router.get('/', paymentController.listPayments);

// GET /api/payments/paid
router.get('/paid', (req, res, next) => {
  req.query.status = 'Paid';
  paymentController.listPayments(req, res, next);
});

// GET /api/payments/pending
router.get('/pending', (req, res, next) => {
  req.query.status = 'Pending';
  paymentController.listPayments(req, res, next);
});

module.exports = router;