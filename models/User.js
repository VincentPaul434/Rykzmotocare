const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  // Check if user exists by email
  static async findByEmail(email) {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return users[0];
  }

  static async findById(id) {
    const [users] = await db.query('SELECT * FROM users WHERE user_id = ?', [id]);
    return users[0];
  }

  // Create a new user (only use existing columns)
  static async create({ name, email, password_hash, phone, user_type, status }) {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, phone, user_type, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, password_hash, phone, user_type, status]
    );
    return result.insertId;
  }

  // Update password
  static async updatePassword(user_id, password_hash) {
    await db.query(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [password_hash, user_id]
    );
  }

  // Compare password
  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  // Hash password
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }
}

module.exports = User;