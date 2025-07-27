const express = require('express');
const router = express.Router();
const { 
  bookAppointment, 
  getCustomerAppointments,
  getAvailableMechanics
} = require('../controllers/appointmentController');
const auth = require('../middleware/auth');

router.post('/', auth, bookAppointment);
router.get('/', auth, getCustomerAppointments);
router.get('/mechanics', auth, getAvailableMechanics);

module.exports = router;