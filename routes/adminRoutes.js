const express = require('express');
const router = express.Router();
const { 
  createCustomerAccount,
  resetCustomerPassword,
  updateMechanicAvailability,
  manageShopItem,
  notifyCustomerPayment
} = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Appointment related
const { getAllAppointments, updateAppointmentStatus } = require('../controllers/appointmentController');
router.get('/appointments', auth, admin, getAllAppointments);
router.put('/appointments/status', auth, admin, updateAppointmentStatus);

// Feedback related
const { getAllFeedback, replyToFeedback } = require('../controllers/feedbackController');
router.get('/feedback', auth, admin, getAllFeedback);
router.put('/feedback/reply', auth, admin, replyToFeedback);

// User management
router.post('/customers', auth, admin, createCustomerAccount);
router.put('/customers/reset-password', auth, admin, resetCustomerPassword);

// Mechanic management
router.put('/mechanics/availability', auth, admin, updateMechanicAvailability);

// Shop management
router.post('/shop/items', auth, admin, manageShopItem);
router.put('/shop/items/:id', auth, admin, manageShopItem);

// Payments
router.post('/notify-payment', auth, admin, notifyCustomerPayment);

module.exports = router;