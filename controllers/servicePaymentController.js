const crypto = require('crypto');
const db = require('../config/db');

function makeRef() {
  return 'PMT-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

function parseAmount(val) {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  if (!s) return null
  const n = Number(s.replace(/[^0-9.-]/g, '')) // strip ₱, commas, spaces
  return Number.isFinite(n) ? Math.max(0, n) : null
}

// POST /api/service-payments/start
exports.start = async (req, res) => {
  const { booking_id, user_id, method, amount } = req.body || {}
  const allowed = new Set(['gcash', 'bdo', 'paymaya'])
  if (!booking_id || !user_id || !method || !allowed.has(method)) {
    return res.status(400).json({ message: 'booking_id, user_id and method (gcash|bdo|paymaya) are required' })
  }

  const amt = parseAmount(amount)

  try {
    const [rows] = await db.query(
      `SELECT booking_id, user_id, service_requested, total_amount, payment_status
         FROM bookings
        WHERE booking_id = ? AND user_id = ?
        LIMIT 1`,
      [booking_id, user_id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' })

    const b = rows[0]
    if (b.payment_status === 'Paid') return res.status(409).json({ message: 'Booking already paid' })

    const payment_ref = makeRef()

    const sets = ['payment_method = ?', "payment_status = 'Pending'", 'payment_ref = ?']
    const params = [method, payment_ref]
    if (amt !== null) { sets.push('total_amount = ?'); params.push(amt) }
    params.push(booking_id, user_id)

    const [r] = await db.query(
      `UPDATE bookings SET ${sets.join(', ')} WHERE booking_id = ? AND user_id = ?`,
      params
    )

    const effectiveAmount = amt !== null ? amt : Number(b.total_amount ?? 0)

    const {
      GCASH_NUMBER, GCASH_NAME, GCASH_QR_URL,
      BDO_ACCOUNT_NAME, BDO_ACCOUNT_NUMBER, BDO_BRANCH,
      PAYMAYA_NUMBER, PAYMAYA_NAME
    } = process.env

    const instructions =
      method === 'gcash'
        ? { number: GCASH_NUMBER || '', name: GCASH_NAME || '', qr_url: GCASH_QR_URL || '' }
        : method === 'bdo'
        ? { account_name: BDO_ACCOUNT_NAME || '', account_number: BDO_ACCOUNT_NUMBER || '', branch: BDO_BRANCH || '' }
        : { number: PAYMAYA_NUMBER || '', name: PAYMAYA_NAME || '' }

    return res.json({
      booking_id: Number(booking_id),
      user_id: Number(user_id),
      method,
      payment_ref,
      amount: effectiveAmount,
      service_requested: b.service_requested,
      instructions,
      affected: r.affectedRows
    })
  } catch (err) {
    console.error('servicePayment.start error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/service-payments/upload
exports.upload = async (req, res) => {
  try {
    const { booking_id, user_id, amount } = req.body || {}
    if (!booking_id || !user_id) {
      return res.status(400).json({ message: 'booking_id and user_id are required' })
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Receipt image is required' })
    }

    const [rows] = await db.query(
      `SELECT booking_id, total_amount
         FROM bookings
        WHERE booking_id = ? AND user_id = ?
        LIMIT 1`,
      [booking_id, user_id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' })

    const receipt_url = `/uploads/${req.file.filename}`
    const amt = parseAmount(amount)
    const currentTotal = rows[0].total_amount == null ? null : Number(rows[0].total_amount)

    const sets = ["receipt_url = ?", "payment_status = 'Paid'"]
    const params = [receipt_url]

    // If amount provided, persist it (overwrite null/0)
    if (amt !== null && (currentTotal === null || currentTotal === 0 || currentTotal !== amt)) {
      sets.push('total_amount = ?')
      params.push(amt)
    }

    params.push(booking_id, user_id)

    const [r] = await db.query(
      `UPDATE bookings SET ${sets.join(', ')} WHERE booking_id = ? AND user_id = ?`,
      params
    )

    return res.json({
      ok: true,
      booking_id: Number(booking_id),
      receipt_url,
      payment_status: 'Paid',
      total_amount: amt !== null ? amt : rows[0].total_amount,
      affected: r.affectedRows
    })
  } catch (err) {
    console.error('servicePayment.upload error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/service-payments
exports.list = async (req, res) => {
  const { status } = req.query;
  const allowed = new Set(['Paid', 'Pending']);
  const where = allowed.has(status)
    ? 'WHERE b.payment_status = ?'
    : 'WHERE b.payment_status IN ("Paid","Pending")';
  const params = allowed.has(status) ? [status] : [];

  try {
    const [rows] = await db.query(
      `
      SELECT
        b.booking_id,
        b.user_id,
        b.service_requested,
        COALESCE(b.total_amount, 0) AS total_amount,
        b.payment_status AS status,
        b.payment_method AS method,
        b.payment_ref,
        b.receipt_url,
        b.created_at,
        b.updated_at
      FROM bookings b
      ${where}
      ORDER BY b.updated_at DESC, b.created_at DESC
      `,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('servicePayment.list error:', err);
    res.status(500).json([]);
  }
};