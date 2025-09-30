const db = require('../config/db');

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
    const autoReply = 'Thank you for your feedback! We appreciate your response.';
    await db.query(
      'UPDATE feedback SET admin_reply = ?, is_resolved = TRUE WHERE feedback_id = ?',
      [autoReply, result.insertId]
    );
    // Notify user
    await db.query(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [user_id, autoReply, 'feedback']
    );
    res.status(201).json({ message: 'Feedback submitted and replied successfully', feedback_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// feedbackController.js
const getAllFeedback = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, u.name, u.email
      FROM feedback f
      LEFT JOIN users u ON f.customer_id = u.user_id
      ORDER BY f.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json([]);
  }
};

const replyToFeedback = async (req, res) => {
  const { feedback_id, user_id, reply } = req.body;
  try {
    await db.query('UPDATE feedbacks SET admin_reply = ? WHERE feedback_id = ?', [reply, feedback_id]);
    // This line sends a notification to the user:
    await db.query('INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)', [user_id, `Admin replied: ${reply}`, 'feedback']);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { submitFeedback, getAllFeedback, replyToFeedback };