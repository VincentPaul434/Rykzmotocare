const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const paymentController = require('../controllers/paymentController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `receipt_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Start payment (gcash | bdo | paymaya)
router.post('/start', paymentController.startPayment);

// Upload receipt to confirm payment
router.post('/receipt', upload.single('receipt'), paymentController.uploadReceiptAndMarkPaid);


module.exports = router;