const db = require('../config/db');

// Create a new booking (now requires mechanic_id)
const createBooking = async (req, res) => {
  try {
    let { user_id, vehicle_model, service_requested, mechanic_id } = req.body;
    if (!vehicle_model || !service_requested || !mechanic_id) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Convert user_id to integer or set to null
    user_id = user_id !== undefined && user_id !== null && user_id !== '' ? Number(user_id) : null;

    const [result] = await db.query(
      `INSERT INTO bookings (user_id, vehicle_model, service_requested, mechanic_id, book_status, created_at)
       VALUES (?, ?, ?, ?, 'Pending', NOW())`,
      [user_id, vehicle_model, service_requested, mechanic_id]
    );

    res.status(201).json({
      message: 'Booking created successfully',
      booking_id: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all bookings (admin) with user name only
const getAllBookings = async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, u.name 
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.user_id
       ORDER BY b.created_at DESC`
    );
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get bookings for a specific user
const getBookingsByUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [bookings] = await db.query(
      `SELECT b.*, u.name 
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.user_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [user_id]
    );
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update booking status/progress
const updateBooking = async (req, res) => {
  const { id } = req.params;
  const { book_status } = req.body;
  try {
    const [result] = await db.query(
      `UPDATE bookings SET book_status = ? WHERE booking_id = ?`,
      [book_status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    res.json({ message: 'Booking status updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      `UPDATE bookings SET book_status = 'Cancelled' WHERE booking_id = ?`,
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    res.json({ message: 'Booking cancelled.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  updateBooking,
  getBookingsByUser,
  cancelBooking
};