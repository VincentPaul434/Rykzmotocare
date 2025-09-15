const db = require('../config/db');

// Get all mechanics
exports.getMechanics = async (req, res) => {
  try {
    const [mechanics] = await db.query(
      'SELECT mechanic_id AS id, name FROM mechanics WHERE status = "Available"'
    );
    res.json({ mechanics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mechanics: [] });
  }
};

// Get all mechanics (no status filter)
exports.getAllMechanics = async (req, res) => {
  try {
    const [mechanics] = await db.query(
      'SELECT mechanic_id AS id, name, specialization, days_available, time_available, status, availability FROM mechanics'
    );
    res.json({ mechanics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mechanics: [] });
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

exports.getMechanicAvailability = async (req, res) => {
  const { service } = req.query;
  try {
    // Match service to specialization and status to 'Available'
    const [mechanics] = await db.query(
      'SELECT mechanic_id AS id, name FROM mechanics WHERE specialization = ? AND status = "Available"',
      [service]
    );
    res.json({ mechanics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mechanics: [] });
  }
};