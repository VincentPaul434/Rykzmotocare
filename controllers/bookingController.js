const db = require('../config/db');

// Expanded allowed statuses
const ALLOWED_STATUSES = new Set([
  'Pending',
  'In Progress',
  'Waiting for Parts',   // added
  'Completed',
  'Cancelled',
  'Declined'             // added
]);

// Normalization map (incoming -> canonical)
const CANON = new Map([
  ['pending','Pending'],
  ['in progress','In Progress'],
  ['completed','Completed'],
  ['cancelled','Cancelled'],
  ['waiting for parts','Waiting for Parts'],
  ['waiting parts','Waiting for Parts'],
  ['declined','Declined'],
  // legacy synonyms
  ['confirmed','In Progress']
]);

// Create a new booking
const createBooking = async (req, res) => {
  try {
    let { user_id, vehicle_model, service_requested, mechanic_id } = req.body;
    if (!vehicle_model || !service_requested || !mechanic_id) {
      return res.status(400).json({ message: 'vehicle_model, service_requested, mechanic_id are required.' });
    }
    user_id = user_id ? Number(user_id) : null;

    // Optional: verify mechanic exists
    // const [m] = await db.query('SELECT mechanic_id FROM mechanics WHERE mechanic_id=? LIMIT 1',[mechanic_id]);
    // if (!m.length) return res.status(400).json({ message: 'Invalid mechanic_id' });

    const [result] = await db.query(
      `INSERT INTO bookings (user_id, vehicle_model, service_requested, mechanic_id, book_status, created_at)
       VALUES (?, ?, ?, ?, 'Pending', NOW())`,
      [user_id, vehicle_model, service_requested, mechanic_id]
    );

    res.status(201).json({ message: 'Booking created', booking_id: result.insertId });
  } catch (err) {
    console.error('createBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all bookings (admin)
const getAllBookings = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, u.name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.user_id
       ORDER BY b.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllBookings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get bookings for a specific user
const getBookingsByUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT b.*, u.name AS user_name, m.name AS mechanic_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.user_id
       LEFT JOIN mechanics m ON b.mechanic_id = m.mechanic_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getBookingsByUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCompletedBookingsByUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT * FROM bookings WHERE user_id = ? AND book_status = "Completed"',
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getCompletedBookingsByUser error:', err);
    res.status(500).json([]);
  }
};

// Update booking status
const updateBooking = async (req, res) => {
  const { id } = req.params;
  let { book_status } = req.body;

  if (!book_status) {
    return res.status(400).json({ message: 'book_status is required.' });
  }

  const normKey = book_status.trim().toLowerCase();
  if (CANON.has(normKey)) {
    book_status = CANON.get(normKey);
  }

  if (!ALLOWED_STATUSES.has(book_status)) {
    return res.status(400).json({ message: 'Invalid book_status value.' });
  }

  try {
    const [result] = await db.query(
      'UPDATE bookings SET book_status = ? WHERE booking_id = ?',
      [book_status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    res.json({ message: 'Booking status updated.', book_status });
  } catch (err) {
    console.error('updateBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE bookings SET book_status = "Cancelled" WHERE booking_id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    res.json({ message: 'Booking cancelled.' });
  } catch (err) {
    console.error('cancelBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingsByUser,
  getCompletedBookingsByUser,
  updateBooking,
  cancelBooking
};