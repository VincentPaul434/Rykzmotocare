const db = require('../config/db');

// Submit feedback
const submitFeedback = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const customer_id = req.user.id;
    
    await db.query(
      'INSERT INTO feedback (customer_id, subject, message) VALUES (?, ?, ?)',
      [customer_id, subject, message]
    );
    
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all feedback (admin)
const getAllFeedback = async (req, res) => {
  try {
    const [feedback] = await db.query(
      `SELECT f.*, u.first_name, u.last_name, u.email 
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