const db = require('../config/db');

// Get all mechanics (only available)
exports.getMechanics = async (req, res) => {
  try {
    const [mechanics] = await db.query(
      'SELECT mechanic_id AS id, name, experience FROM mechanics WHERE status = "Available"'
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
    const [rows] = await db.query(
      'SELECT mechanic_id AS id, name, specialization, days_available, time_available, status, image_url, experience FROM mechanics'
    );
    res.json({ mechanics: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mechanics: [] });
  }
};

exports.getMechanicById = async (req, res) => {
  const { mechanic_id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT mechanic_id AS id, name, specialization, days_available, time_available, status, image_url, experience FROM mechanics WHERE mechanic_id = ? LIMIT 1',
      [mechanic_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Mechanic not found' });
    res.json({ mechanic: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mechanic: null });
  }
}

// Add a new mechanic (supports photo upload)
exports.addMechanic = async (req, res) => {
  const body = req.body || {};
  const { name, specialization, days_available, time_available, status = 'Available', experience = 0 } = body;

  if (!name || !specialization) {
    return res.status(400).json({ message: 'name and specialization are required' });
  }

  const image_url = req.file ? `/uploads/mechanics/${req.file.filename}` : body.image_url || null;

  try {
    await db.query(
      'INSERT INTO mechanics (name, specialization, days_available, time_available, status, image_url, experience) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, specialization, days_available, time_available, status, image_url, experience]
    );
    res.json({ message: 'Mechanic added', image_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update mechanic (supports replacing photo)
exports.updateMechanic = async (req, res) => {
  const { mechanic_id } = req.params;
  const body = req.body || {};
  const { name, specialization, days_available, time_available, status, experience = 0 } = body;

  let image_url = body.image_url || null;
  if (req.file) image_url = `/uploads/mechanics/${req.file.filename}`;

  try {
    await db.query(
      'UPDATE mechanics SET name=?, specialization=?, days_available=?, time_available=?, status=?, image_url=?, experience=? WHERE mechanic_id=?',
      [name, specialization, days_available, time_available, status, image_url, experience, mechanic_id]
    );
    res.json({ message: 'Mechanic updated', image_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete mechanic
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
    const [mechanics] = await db.query(
      'SELECT mechanic_id AS id, name, experience FROM mechanics WHERE specialization = ? AND status = "Available"',
      [service]
    );
    res.json({ mechanics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mechanics: [] });
  }
};

