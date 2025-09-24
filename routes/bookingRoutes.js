const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/', bookingController.createBooking);
router.get('/', bookingController.getAllBookings);
router.put('/:id', bookingController.updateBooking);
router.get('/user/:user_id', bookingController.getBookingsByUser); // GET /api/bookings/user/:user_id
router.put('/:id/cancel', bookingController.cancelBooking); // Add this route for cancellation

module.exports = router;