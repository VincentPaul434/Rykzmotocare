const db = require('../config/db');

// Get all mechanics
exports.getMechanics = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM mechanics');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a new mechanic (no admin_id required)
exports.addMechanic = async (req, res) => {
  const { name, specialization, days_available, time_available, status, availability } = req.body;
  try {
    await db.query(
      'INSERT INTO mechanics (name, specialization, days_available, time_available, status, availability) VALUES (?, ?, ?, ?, ?, ?)',
      [name, specialization, days_available, time_available, status, availability]
    );
    res.status(201).json({ message: 'Mechanic added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update mechanic (no admin_id required)
exports.updateMechanic = async (req, res) => {
  const { mechanic_id } = req.params;
  const { name, specialization, days_available, time_available, status, availability } = req.body;
  try {
    await db.query(
      'UPDATE mechanics SET name=?, specialization=?, days_available=?, time_available=?, status=?, availability=? WHERE mechanic_id=?',
      [name, specialization, days_available, time_available, status, availability, mechanic_id]
    );
    res.json({ message: 'Mechanic updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete mechanic (no admin_id required)
exports.deleteMechanic = async (req, res) => {
  const { mechanic_id } = req.params;
  try {
    await db.query('DELETE FROM mechanics WHERE mechanic_id=?', [mechanic_id]);
    res.json({ message: 'Mechanic removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};