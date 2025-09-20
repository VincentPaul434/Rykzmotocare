const db = require('../config/db');

// Validate cart items against current inventory
exports.validateCart = async (req, res) => {
  const { items = [] } = req.body || {};
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ ok: false, issues: ['Cart is empty'] });
  }

  const issues = [];
  const details = [];

  try {
    for (const it of items) {
      const itemId = Number(it.item_id || it.id);
      const qtyReq = Number(it.qty || 0);
      if (!itemId || qtyReq <= 0) {
        issues.push(`Invalid item or qty for entry: ${JSON.stringify(it)}`);
        continue;
      }
      const [rows] = await db.query(
        'SELECT item_id, name, price, quantity FROM inventory WHERE item_id = ?',
        [itemId]
      );
      if (!rows.length) {
        issues.push(`Item #${itemId} not found`);
        continue;
      }
      const row = rows[0];
      if (row.quantity < qtyReq) {
        issues.push(`Insufficient stock for ${row.name}: have ${row.quantity}, need ${qtyReq}`);
      }
      details.push({
        item_id: row.item_id,
        name: row.name,
        price: Number(row.price),
        requested: qtyReq,
        available: row.quantity,
        subtotal: Number(row.price) * qtyReq
      });
    }

    const total = details.reduce((a, d) => a + d.subtotal, 0);
    res.json({ ok: issues.length === 0, issues, details, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, issues: ['Server error'] });
  }
};

// Create order with inventory deduction (atomic)
exports.createOrder = async (req, res) => {
  const { user_id, items = [], service_type = null } = req.body || {};
  if (!user_id || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'user_id and items[] required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Lock and verify each item, compute totals from DB values
    let total = 0;
    const normalized = [];

    for (const it of items) {
      const itemId = Number(it.item_id || it.id);
      const qtyReq = Number(it.qty || 0);
      if (!itemId || qtyReq <= 0) {
        throw new Error('Invalid item_id/qty in cart');
      }

      // Lock row to prevent race conditions
      const [rows] = await conn.query(
        'SELECT item_id, name, price, quantity FROM inventory WHERE item_id = ? FOR UPDATE',
        [itemId]
      );
      if (!rows.length) {
        throw new Error(`Item #${itemId} not found`);
      }
      const row = rows[0];
      if (row.quantity < qtyReq) {
        throw new Error(`Insufficient stock for ${row.name}: have ${row.quantity}, need ${qtyReq}`);
      }

      // Deduct stock
      await conn.query(
        'UPDATE inventory SET quantity = quantity - ? WHERE item_id = ?',
        [qtyReq, itemId]
      );

      const subtotal = Number(row.price) * qtyReq;
      total += subtotal;
      normalized.push({
        item_id: row.item_id,
        name: row.name,
        price: Number(row.price),
        qty: qtyReq,
        subtotal
      });
    }

    // Create order
    const [orderRes] = await conn.query(
      'INSERT INTO orders (user_id, total_amount, status, service_type) VALUES (?, ?, "Pending", ?)',
      [user_id, total, service_type]
    );
    const orderId = orderRes.insertId;

    // Insert order items
    for (const it of normalized) {
      await conn.query(
        'INSERT INTO order_items (order_id, item_id, name, price, qty) VALUES (?, ?, ?, ?, ?)',
        [orderId, it.item_id, it.name, it.price, it.qty]
      );
    }

    await conn.commit();
    res.status(201).json({
      order_id: orderId,
      total_amount: total,
      status: 'Pending',
      items: normalized
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    // Return 409 for stock conflicts
    const status = /Insufficient stock|not found|Invalid item_id\/qty/.test(err.message) ? 409 : 500;
    res.status(status).json({ message: err.message || 'Server error' });
  } finally {
    conn.release();
  }
};