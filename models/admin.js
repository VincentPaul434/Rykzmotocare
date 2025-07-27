const db = require('../config/db');

class Admin {
  static async findByIdNumber(id_number) {
    const [admins] = await db.query('SELECT * FROM admin WHERE id_number = ?', [id_number]);
    return admins[0];
  }
}

module.exports = Admin;