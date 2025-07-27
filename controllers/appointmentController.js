const db = require('../config/db');

// Book an appointment
const bookAppointment = async (req, res) => {
  try {
    const { mechanic_id, appointment_date, service_description } = req.body;
    const customer_id = req.user.id;
    
    // Check mechanic availability
    const [mechanics] = await db.query(
      'SELECT * FROM mechanics WHERE mechanic_id = ? AND is_available = TRUE',
      [mechanic_id]
    );
    
    if (mechanics.length === 0) {
      return res.status(400).json({ message: 'Mechanic is not available' });
    }
    
    // Insert appointment
    const [result] = await db.query(
      'INSERT INTO appointments (customer_id, mechanic_id, appointment_date, service_description) VALUES (?, ?, ?, ?)',
      [customer_id, mechanic_id, appointment_date, service_description]
    );
    
    res.status(201).json({ 
      message: 'Appointment booked successfully', 
      appointment_id: result.insertId 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all appointments for a customer
const getCustomerAppointments = async (req, res) => {
  try {
    const customer_id = req.user.id;
    
    const [appointments] = await db.query(
      `SELECT a.*, u.first_name, u.last_name, u.email, u.phone 
       FROM appointments a
       JOIN users u ON a.mechanic_id = u.user_id
       WHERE a.customer_id = ?`,
      [customer_id]
    );
    
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all appointments (admin)
const getAllAppointments = async (req, res) => {
  try {
    const [appointments] = await db.query(
      `SELECT a.*, 
       c.first_name AS customer_first_name, c.last_name AS customer_last_name,
       m.first_name AS mechanic_first_name, m.last_name AS mechanic_last_name
       FROM appointments a
       JOIN users c ON a.customer_id = c.user_id
       LEFT JOIN users m ON a.mechanic_id = m.user_id`
    );
    
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update appointment status (admin)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointment_id, status } = req.body;
    
    await db.query(
      'UPDATE appointments SET status = ? WHERE appointment_id = ?',
      [status, appointment_id]
    );
    
    // If completed, calculate actual cost
    if (status === 'completed') {
      // This would be more complex in reality, calculating based on services/parts
      await db.query(
        'UPDATE appointments SET actual_cost = estimated_cost WHERE appointment_id = ?',
        [appointment_id]
      );
    }
    
    res.json({ message: 'Appointment status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available mechanics
const getAvailableMechanics = async (req, res) => {
  try {
    const [mechanics] = await db.query(
      `SELECT u.user_id, u.first_name, u.last_name, m.specialization, m.hourly_rate
       FROM users u
       JOIN mechanics m ON u.user_id = m.mechanic_id
       WHERE m.is_available = TRUE`
    );
    
    res.json(mechanics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  bookAppointment, 
  getCustomerAppointments, 
  getAllAppointments, 
  updateAppointmentStatus,
  getAvailableMechanics
};