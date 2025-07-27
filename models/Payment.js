const db = require('../config/db');

class Payment {
  static async create({ appointment_id, amount, payment_method, transaction_id }) {
    const [result] = await db.query(
      'INSERT INTO payments (appointment_id, amount, payment_method, transaction_id) VALUES (?, ?, ?, ?)',
      [appointment_id, amount, payment_method, transaction_id]
    );
    return result.insertId;
  }

  static async findByAppointment(appointment_id) {
    const [payments] = await db.query(
      'SELECT * FROM payments WHERE appointment_id = ?',
      [appointment_id]
    );
    return payments[0];
  }
}

module.exports = Payment;