const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Mark all notifications as read for a user
router.patch('/:user_id/read', notificationController.markAllRead);

// Mark a single notification as read
router.patch('/:notification_id/readone', notificationController.markAsRead);

// Get unread notifications for a user
router.get('/:user_id/unread', notificationController.getUnreadNotifications);

module.exports = router;    