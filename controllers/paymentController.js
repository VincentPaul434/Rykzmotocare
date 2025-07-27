const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');

// View payment amount for an appointment
exports.getPaymentAmount = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ 
      amount: appointment.actual_cost || appointment.estimated_cost 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Process GCash payment
exports.processGCashPayment = async (req, res) => {
  try {
    const { appointmentId, gcashReference } = req.body;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Record payment
    await Payment.create({
      appointment_id: appointmentId,
      amount: appointment.actual_cost,
      payment_method: 'gcash',
      transaction_id: gcashReference
    });

    // Update appointment status
    await Appointment.updateStatus(appointmentId, 'completed');

    res.json({ 
      message: 'GCash payment successful', 
      transactionId: gcashReference 
    });
  } catch (err) {
    res.status(500).json({ message: 'Payment failed' });
  }
};