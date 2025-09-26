const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.post('/notifications', notificationController.createNotification);
router.get('/notifications/:user_id', notificationController.getNotifications);
router.delete('/:notification_id', notificationController.deleteNotification);

module.exports = router;