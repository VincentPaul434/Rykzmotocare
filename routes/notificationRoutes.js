const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const multer = require('multer');
const path = require('path');

// Custom storage to keep original extension
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/invoices/');
  },
  filename: function (req, file, cb) {
    // Get original extension
    const ext = path.extname(file.originalname);
    // Use unique name + extension
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});
const upload = multer({ storage });

router.post('/notifications', upload.single('invoice'), notificationController.createNotification);
router.get('/notifications/:user_id', notificationController.getNotifications);
router.delete('/:notification_id', notificationController.deleteNotification);

module.exports = router;