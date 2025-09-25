const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const crypto = require('crypto');
const db = require('../config/db');

function makeRef() {
  return 'PMT-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

// Start a payment for an order (gcash | bdo | paymaya)
exports.startPayment = async (req, res) => {
  const { order_id, user_id, method } = req.body || {};
  const allowed = new Set(['gcash', 'bdo', 'paymaya']);
  if (!order_id || !user_id || !method || !allowed.has(method)) {
    return res.status(400).json({ message: 'order_id, user_id and method (gcash|bdo|paymaya) are required' });
  }

  try {
    const [rows] = await db.query(
      'SELECT order_id, total_amount, status, payment_status FROM orders WHERE order_id = ? AND user_id = ? LIMIT 1',
      [order_id, user_id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const ord = rows[0];
    if (ord.status === 'Paid' || ord.payment_status === 'Paid') {
      return res.status(409).json({ message: 'Order already paid' });
    }

    const payment_ref = makeRef();
    await db.query(
      'UPDATE orders SET payment_method = ?, payment_status = "Pending", payment_ref = ? WHERE order_id = ? AND user_id = ?',
      [method, payment_ref, order_id, user_id]
    );

    const {
      GCASH_NUMBER, GCASH_NAME, GCASH_QR_URL,
      BDO_ACCOUNT_NAME, BDO_ACCOUNT_NUMBER, BDO_BRANCH,
      PAYMAYA_NUMBER, PAYMAYA_NAME
    } = process.env;

    const payload = {
      order_id,
      method,
      payment_ref,
      amount: Number(ord.total_amount),
      instructions: {}
    };

    if (method === 'gcash') {
      payload.instructions = {
        number: GCASH_NUMBER || '',
        name: GCASH_NAME || '',
        qr_url: GCASH_QR_URL || ''
      };
    } else if (method === 'bdo') {
      payload.instructions = {
        account_name: BDO_ACCOUNT_NAME || '',
        account_number: BDO_ACCOUNT_NUMBER || '',
        branch: BDO_BRANCH || ''
      };
    } else {
      payload.instructions = {
        number: PAYMAYA_NUMBER || '',
        name: PAYMAYA_NAME || ''
      };
    }

    return res.json(payload);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Upload receipt and mark order as Paid
exports.uploadReceiptAndMarkPaid = async (req, res) => {
  try {
    const { order_id, user_id } = req.body || {};
    if (!order_id || !user_id) {
      return res.status(400).json({ message: 'order_id and user_id are required' });
    }
    const receipt_url = req.file ? `/uploads/${req.file.filename}` : null;

    await db.query(
      'UPDATE orders SET status = "Paid", payment_status = "Paid", receipt_url = ? WHERE order_id = ? AND user_id = ?',
      [receipt_url, order_id, user_id]
    );
    res.json({ message: 'Payment recorded', receipt_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.listPayments = async (req, res) => {
  const { status } = req.query; // 'Paid' | 'Pending' | undefined
  const allowed = new Set(['Paid', 'Pending']);
  const where = allowed.has(status)
    ? 'WHERE o.payment_status = ?'
    : 'WHERE o.payment_status IN ("Paid","Pending")';
  const params = allowed.has(status) ? [status] : [];

  try {
    const [rows] = await db.query(
      `
      SELECT 
        o.order_id,
        o.user_id,
        o.total_amount,
        o.payment_status,
        o.payment_method,
        o.payment_ref,
        o.receipt_url,
        o.created_at
      FROM orders o
      ${where}
      ORDER BY o.created_at DESC
      `,
      params
    );

    const payments = rows.map(r => ({
      payment_id: r.order_id,
      payment_ref: r.payment_ref,
      order_id: r.order_id,
      user_id: r.user_id,
      method: r.payment_method,
      status: r.payment_status,
      amount: r.total_amount,
      receipt_url: r.receipt_url,
      created_at: r.created_at
    }));

    res.json(payments); // return array only
  } catch (err) {
    console.error(err);
    res.status(500).json([]); // empty array on error
  }
};

exports.listPaymentsByUser = async (req, res) => {
  const { user_id, status } = req.query;
  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }
  const allowed = new Set(['Paid', 'Pending']);
  const where = allowed.has(status)
    ? 'WHERE o.payment_status = ? AND o.user_id = ?'
    : 'WHERE o.payment_status IN ("Paid","Pending") AND o.user_id = ?';
  const params = allowed.has(status) ? [status, user_id] : [user_id];

  try {
    const [rows] = await db.query(
      `
      SELECT 
        o.order_id,
        o.user_id,
        o.total_amount,
        o.payment_status,
        o.payment_method,
        o.payment_ref,
        o.receipt_url,
        o.created_at
      FROM orders o
      ${where}
      ORDER BY o.created_at DESC
      `,
      params
    );

    const payments = rows.map(r => ({
      payment_id: r.order_id,
      payment_ref: r.payment_ref,
      order_id: r.order_id,
      user_id: r.user_id,
      method: r.payment_method,
      status: r.payment_status,
      amount: r.total_amount,
      receipt_url: r.receipt_url,
      created_at: r.created_at
    }));

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

