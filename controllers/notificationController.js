const db = require('../config/db');

// Create a notification
exports.createNotification = async (req, res) => {
  const { user_id, message, type = 'info' } = req.body;
  try {
    await db.query(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [user_id, message, type]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get notifications for a user
exports.getNotifications = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ notifications: [] });
  }
};