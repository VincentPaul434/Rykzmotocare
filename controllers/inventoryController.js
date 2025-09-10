const db = require('../config/db');

// Get all items
exports.getItems = async (req, res) => {
  try {
    const { category } = req.query;
    let query = "SELECT * FROM inventory";
    let params = [];
    if (category) {
      query += " WHERE category = ?";
      params.push(category);
    }
    const [items] = await db.query(query, params);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a new item
exports.addItem = async (req, res) => {
  const { name, brand, category, item_code, price, quantity, date_added } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    await db.query(
      'INSERT INTO inventory (name, brand, category, item_code, price, quantity, date_added, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, brand, category, item_code, price, quantity, date_added, image_url]
    );
    res.status(201).json({ message: 'Item added', image_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an item
exports.updateItem = async (req, res) => {
  const { item_id } = req.params;
  const { name, brand, category, item_code, price, quantity, date_added, image_url } = req.body;
  try {
    await db.query(
      'UPDATE inventory SET name=?, brand=?, category=?, item_code=?, price=?, quantity=?, date_added=?, image_url=? WHERE item_id=?',
      [name, brand, category, item_code, price, quantity, date_added, image_url, item_id]
    );
    res.json({ message: 'Item updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an item
exports.deleteItem = async (req, res) => {
  const { item_id } = req.params;
  try {
    await db.query('DELETE FROM inventory WHERE item_id=?', [item_id]);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Sell an item
exports.sellItem = async (req, res) => {
  const { item_id } = req.params;
  const { quantity_sold } = req.body;
  try {
    // Deduct the sold quantity from the inventory
    await db.query(
      'UPDATE inventory SET quantity = quantity - ? WHERE item_id = ? AND quantity >= ?',
      [quantity_sold, item_id, quantity_sold]
    );
    res.json({ message: 'Sale confirmed and quantity updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};