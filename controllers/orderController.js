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

// Create order and deduct stock atomically
exports.createOrder = async (req, res) => {
  const { user_id, items = [], service_type } = req.body || {};

  // Basic input validation
  if (!user_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'user_id and items[] required', code: 'INVALID_INPUT' });
  }
  for (const it of items) {
    const itemId = Number(it.item_id ?? it.id);
    const qty = Number(it.qty ?? 0);
    if (!itemId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Invalid item_id/qty', code: 'INVALID_INPUT' });
    }
  }

  // Normalize service_type to null if empty/undefined
  const svcType = (service_type === '' || service_type === undefined) ? null : service_type;

  let conn;
  try {
    // Acquire connection safely
    conn = await db.getConnection();
  } catch (err) {
    console.error('DB connection error:', err);
    return res.status(503).json({ message: 'Database unavailable', code: 'DB_UNAVAILABLE' });
  }

  try {
    await conn.beginTransaction();

    let total = 0;
    const normalized = [];

    for (const it of items) {
      const itemId = Number(it.item_id ?? it.id);
      const qty = Number(it.qty ?? 0);

      // Lock row
      const [rows] = await conn.query(
        'SELECT item_id, name, price, quantity FROM inventory WHERE item_id = ? FOR UPDATE',
        [itemId]
      );
      if (!rows.length) {
        throw Object.assign(new Error(`Item #${itemId} not found`), { status: 409, code: 'ITEM_NOT_FOUND' });
      }
      const row = rows[0];
      if (row.quantity < qty) {
        throw Object.assign(new Error(`Insufficient stock for ${row.name}`), { status: 409, code: 'OUT_OF_STOCK' });
      }

      await conn.query(
        'UPDATE inventory SET quantity = quantity - ? WHERE item_id = ?',
        [qty, itemId]
      );

      const price = Number(row.price);
      total += price * qty;
      normalized.push({ item_id: row.item_id, name: row.name, price, qty });
    }

    // Insert order
    const [r] = await conn.query(
      'INSERT INTO orders (user_id, total_amount, status, service_type) VALUES (?, ?, "Pending", ?)',
      [user_id, total, svcType]
    );
    const order_id = r.insertId;

    // Insert items
    for (const it of normalized) {
      await conn.query(
        'INSERT INTO order_items (order_id, item_id, name, price, qty) VALUES (?, ?, ?, ?, ?)',
        [order_id, it.item_id, it.name, it.price, it.qty]
      );
    }

    await conn.commit();
    return res.status(201).json({ order_id, total_amount: total, status: 'Pending' });
  } catch (err) {
    try {
      await conn.rollback();
    } catch (rbErr) {
      console.error('Rollback error:', rbErr);
    }
    console.error('createOrder error:', err);

    const status = err.status || (/Insufficient stock|not found|Invalid/.test(err.message) ? 409 : 500);
    const code =
      err.code ||
      (/Insufficient stock/.test(err.message) ? 'OUT_OF_STOCK'
        : /not found/.test(err.message) ? 'ITEM_NOT_FOUND'
        : /Invalid/.test(err.message) ? 'INVALID_INPUT'
        : 'SERVER_ERROR');

    return res.status(status).json({ message: err.message || 'Server error', code });
  } finally {
    if (conn) conn.release();
  }
};

// List orders for a user
exports.getOrdersByUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT order_id, user_id, total_amount, status, payment_status, payment_method,
              payment_ref, receipt_url, service_type, created_at
         FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC`,
      [user_id]
    );
    res.json({ orders: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ orders: [] });
  }
};

// (optional) Admin list all
exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT order_id, user_id, total_amount, status, payment_status, payment_method,
              payment_ref, receipt_url, service_type, created_at
         FROM orders
        ORDER BY created_at DESC`
    );
    res.json({ orders: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ orders: [] });
  }
};  