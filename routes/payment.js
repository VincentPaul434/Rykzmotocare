const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.png';
    cb(null, `receipt_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

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

// POST /api/payments/start
router.post('/start', paymentController.startPayment);

// POST /api/payments/upload
router.post('/upload', upload.single('receipt'), paymentController.uploadReceiptAndMarkPaid);

// GET /api/payments/user
router.get('/user', paymentController.listPaymentsByUser);

module.exports = router;