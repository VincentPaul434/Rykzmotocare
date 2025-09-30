const db = require('../config/db');

// Create a notification (supports invoice upload)
exports.createNotification = async (req, res) => {
  const { user_id, message, type = 'info' } = req.body || {};
  let invoice_url = '';
  if (req.file) {
    invoice_url = `/uploads/invoices/${req.file.filename}`;
  }
  if (!user_id || !message) {
    return res.status(400).json({ success: false, error: 'user_id and message are required' });
  }
  try {
    await db.query(
      'INSERT INTO notifications (user_id, message, type, invoice_url) VALUES (?, ?, ?, ?)',
      [user_id, message, type, invoice_url]
    );
    res.json({ success: true, invoice_url });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get notifications for a user
exports.getNotifications = async (req, res) => {
  const { user_id } = req.params;
  if (!user_id || user_id === 'undefined') {
    return res.status(400).json({ notifications: [], error: 'Valid user_id is required' });
  }
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

// Get unread notifications for a user
exports.getUnreadNotifications = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? AND is_read = 0', [user_id]);
    res.json({ notifications: rows });
  } catch (err) {
    res.status(500).json({ notifications: [] });
  }
};

// Mark all notifications as read for a user
exports.markAllRead = async (req, res) => {
  const { user_id } = req.params;
  if (!user_id || user_id === 'undefined') {
    return res.status(400).json({ success: false, error: 'Valid user_id is required' });
  }
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [user_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Mark a single notification as read
exports.markAsRead = async (req, res) => {
  const { notification_id } = req.params;
  if (!notification_id || notification_id === 'undefined') {
    return res.status(400).json({ success: false, error: 'Valid notification_id is required' });
  }
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ?',
      [notification_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete a notification by id
exports.deleteNotification = async (req, res) => {
  const { notification_id } = req.params;
  if (!notification_id || notification_id === 'undefined') {
    return res.status(400).json({ success: false, error: 'Valid notification_id is required' });
  }
  try {
    await db.query(
      'DELETE FROM notifications WHERE notification_id = ?',
      [notification_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};