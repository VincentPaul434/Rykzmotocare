const db = require('../config/db');

exports.getCustomers = async (req, res) => {
  try {
    const [users] = await db.query("SELECT user_id, name, email, phone, user_type, created_at, status FROM users WHERE user_type = 'customer'");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveCustomer = async (req, res) => {
  const { user_id } = req.params;
  try {
    await db.query("UPDATE users SET status = 'approved' WHERE user_id = ?", [user_id]);
    res.json({ message: 'Customer approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};