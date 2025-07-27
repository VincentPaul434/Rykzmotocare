const db = require('../config/db');

// Create customer account (admin)
const createCustomerAccount = async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone, address } = req.body;
    
    // Check if user exists
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    await db.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, phone, address, user_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, hashedPassword, phone, address, 'customer']
    );
    
    res.status(201).json({ message: 'Customer account created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset customer password (admin)
const resetCustomerPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await db.query(
      'UPDATE users SET password_hash = ? WHERE email = ? AND user_type = "customer"',
      [hashedPassword, email]
    );
    
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Manage mechanic availability
const updateMechanicAvailability = async (req, res) => {
  try {
    const { mechanic_id, is_available } = req.body;
    
    await db.query(
      'UPDATE mechanics SET is_available = ? WHERE mechanic_id = ?',
      [is_available, mechanic_id]
    );
    
    res.json({ message: 'Mechanic availability updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Manage shop items
const manageShopItem = async (req, res) => {
  try {
    const { item_id, name, description, price, category, stock_quantity, is_on_sale, discount_percentage } = req.body;
    const admin_id = req.user.id;
    
    if (item_id) {
      // Update existing item
      const [oldItem] = await db.query('SELECT * FROM shop_items WHERE item_id = ?', [item_id]);
      
      await db.query(
        `UPDATE shop_items SET 
         name = ?, description = ?, price = ?, category = ?, 
         stock_quantity = ?, is_on_sale = ?, discount_percentage = ?
         WHERE item_id = ?`,
        [name, description, price, category, stock_quantity, is_on_sale, discount_percentage, item_id]
      );
      
      // Log the update
      await db.query(
        `INSERT INTO inventory_logs 
         (item_id, admin_id, action_type, quantity_change, old_price, new_price, notes)
         VALUES (?, ?, 'update', ?, ?, ?, ?)`,
        [item_id, admin_id, stock_quantity - oldItem[0].stock_quantity, oldItem[0].price, price, 'Item updated by admin']
      );
      
      res.json({ message: 'Item updated successfully' });
    } else {
      // Create new item
      const [result] = await db.query(
        `INSERT INTO shop_items 
         (name, description, price, category, stock_quantity, is_on_sale, discount_percentage)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, description, price, category, stock_quantity, is_on_sale, discount_percentage]
      );
      
      // Log the addition
      await db.query(
        `INSERT INTO inventory_logs 
         (item_id, admin_id, action_type, quantity_change, new_price, notes)
         VALUES (?, ?, 'add', ?, ?, ?)`,
        [result.insertId, admin_id, stock_quantity, price, 'New item added by admin']
      );
      
      res.status(201).json({ message: 'Item added successfully', item_id: result.insertId });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Notify customer about payment
const notifyCustomerPayment = async (req, res) => {
  try {
    const { appointment_id, amount } = req.body;
    
    // Update appointment with estimated cost
    await db.query(
      'UPDATE appointments SET estimated_cost = ? WHERE appointment_id = ?',
      [amount, appointment_id]
    );
    
    // In a real app, you would send an email/notification here
    
    res.json({ message: 'Customer notified about payment' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  createCustomerAccount, 
  resetCustomerPassword, 
  updateMechanicAvailability, 
  manageShopItem,
  notifyCustomerPayment
};