const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');


//none
router.post('/', bookingController.createBooking);
router.get('/', bookingController.getAllBookings);
router.put('/:id', bookingController.updateBooking);
router.get('/user/:user_id', bookingController.getBookingsByUser); // GET /api/bookings/user/:user_id
router.put('/:id/cancel', bookingController.cancelBooking); // Add this route for cancellation
router.get('/user/:user_id/completed', bookingController.getCompletedBookingsByUser); // Update the route for completed bookings

module.exports = router;