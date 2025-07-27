const db = require('../config/db');

// Create and notify customer bill
exports.createBill = async (req, res) => {
  try {
    const { booking_id, amount_due, due_date, payment_status, message, invoice_url } = req.body;
    if (!booking_id || !amount_due || !due_date || !payment_status) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const [result] = await db.query(
      `INSERT INTO customer_bills (booking_id, amount_due, due_date, payment_status, message, invoice_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [booking_id, amount_due, due_date, payment_status, message, invoice_url || null]
    );

    // Here you can trigger notification logic (email, SMS, etc.)

    res.status(201).json({ message: 'Customer bill created and notification sent.', bill_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all bills (for admin)
exports.getAllBills = async (req, res) => {
  try {
    const [bills] = await db.query(
      `SELECT cb.*, b.user_id, u.name, b.service_requested
       FROM customer_bills cb
       JOIN bookings b ON cb.booking_id = b.booking_id
       LEFT JOIN users u ON b.user_id = u.user_id
       ORDER BY cb.created_at DESC`
    );
    res.json(bills);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};