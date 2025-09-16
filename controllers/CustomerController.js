const db = require('../config/db');
const sendMail = require('../utils/sendMail');

exports.getCustomers = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT user_id, name, email, phone, user_type, created_at, status FROM users WHERE user_type = 'customer' AND status <> 'deleted'"
    );
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve customer
exports.approveCustomer = async (req, res) => {
  const { user_id } = req.params;
  try {
    await db.query("UPDATE users SET status = 'approved' WHERE user_id = ?", [user_id]);

    // Get customer email
    const [rows] = await db.query('SELECT email FROM users WHERE user_id = ?', [user_id]);
    if (rows.length > 0) {
      await sendMail(
        rows[0].email,
        'Account Approved',
        'Congratulations! Your account has been approved.'
      );
    }
    res.json({ message: 'Customer approved and notified.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCustomer = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT user_id, user_type, status FROM users WHERE user_id = ?",
      [user_id]
    );

    if (rows.length === 0 || rows[0].user_type !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (rows[0].status === 'deleted') {
      return res.status(200).json({ message: 'Customer already deleted' });
    }

    await db.query(
      "UPDATE users SET status = 'deleted' WHERE user_id = ? AND user_type = 'customer'",
      [user_id]
    );

    res.json({ message: 'Customer deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCustomer = async (req, res) => {
  const { user_id } = req.params;
  const { name, email, phone } = req.body;

  const fields = [];
  const values = [];

  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (email !== undefined) { fields.push('email = ?'); values.push(email); }
  if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }

  if (fields.length === 0) {
    return res.status(400).json({ message: 'No updatable fields provided' });
  }

  values.push(user_id);

  try {
    const [result] = await db.query(
      `UPDATE users SET ${fields.join(', ')} 
       WHERE user_id = ? AND user_type = 'customer' AND status <> 'deleted'`,
      values
    );

    if (result.affectedRows === 0) {
      // Determine why no row updated
      const [exists] = await db.query(
        "SELECT user_id, user_type, status FROM users WHERE user_id = ?",
        [user_id]
      );

      if (exists.length === 0 || exists[0].user_type !== 'customer') {
        return res.status(404).json({ message: 'Customer not found' });
      }
      if (exists[0].status === 'deleted') {
        return res.status(409).json({ message: 'Customer is deleted' });
      }

      // Row exists and is updatable, but data was identical
      const [rows] = await db.query(
        "SELECT user_id, name, email, phone, user_type, created_at, status FROM users WHERE user_id = ?",
        [user_id]
      );
      return res.status(200).json({ message: 'No changes', customer: rows[0] });
    }

    const [rows] = await db.query(
      "SELECT user_id, name, email, phone, user_type, created_at, status FROM users WHERE user_id = ?",
      [user_id]
    );

    res.json({ message: 'Customer updated', customer: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject customer
exports.rejectCustomer = async (req, res) => {
  const { user_id } = req.params;
  try {
    // Option 1: Set status to 'rejected'
    await db.query(
      "UPDATE users SET status = 'rejected' WHERE user_id = ? AND user_type = 'customer'",
      [user_id]
    );

    // Get customer email
    const [rows] = await db.query('SELECT email FROM users WHERE user_id = ?', [user_id]);
    if (rows.length > 0) {
      await sendMail(
        rows[0].email,
        'Account Rejected',
        'We are sorry, but your account has been rejected.'
      );
    }
    res.json({ message: 'Customer rejected and notified.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};