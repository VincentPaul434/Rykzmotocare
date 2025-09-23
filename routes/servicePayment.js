const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const servicePayment = require('../controllers/servicePaymentController');

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

// List
router.get('/', servicePayment.list);
router.get('/paid', (req, res, next) => { req.query.status = 'Paid'; servicePayment.list(req, res, next); });
router.get('/pending', (req, res, next) => { req.query.status = 'Pending'; servicePayment.list(req, res, next); });

// Start and upload
router.post('/start', servicePayment.start);
router.post('/upload', upload.single('receipt'), servicePayment.upload);

module.exports = router;