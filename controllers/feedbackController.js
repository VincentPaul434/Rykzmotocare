const db = require('../config/db');

// Submit feedback (customer)
const submitFeedback = async (req, res) => {
  try {
    const { booking_id, user_id, rating, comment } = req.body;
    // Check if feedback already exists for this booking/user
    const [existing] = await db.query(
      'SELECT feedback_id FROM feedback WHERE booking_id = ? AND customer_id = ? LIMIT 1',
      [booking_id, user_id]
    );
    if (existing.length) {
      return res.status(409).json({ message: 'Feedback already submitted for this booking.' });
    }
    // Insert feedback
    const [result] = await db.query(
      'INSERT INTO feedback (customer_id, booking_id, rating, message) VALUES (?, ?, ?, ?)',
      [user_id, booking_id, rating, comment]
    );
    // Auto-reply from admin for this feedback only
    await db.query(
      'UPDATE feedback SET admin_reply = ?, is_resolved = TRUE WHERE feedback_id = ?',
      ['Thank you for your feedback! We appreciate your response.', result.insertId]
    );
    res.status(201).json({ message: 'Feedback submitted and replied successfully', feedback_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all feedback (admin)
const getAllFeedback = async (req, res) => {
  try {
    const [feedback] = await db.query(
      `SELECT f.*, u.name, u.email 
       FROM feedback f
       JOIN users u ON f.customer_id = u.user_id
       ORDER BY f.created_at DESC`
    );
    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reply to feedback (admin)
const replyToFeedback = async (req, res) => {
  try {
    const { feedback_id, admin_reply } = req.body;
    await db.query(
      'UPDATE feedback SET admin_reply = ?, is_resolved = TRUE WHERE feedback_id = ?',
      [admin_reply, feedback_id]
    );
    res.json({ message: 'Reply submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { submitFeedback, getAllFeedback, replyToFeedback };