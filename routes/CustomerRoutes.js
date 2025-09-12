const express = require('express');
const router = express.Router();
const customerController = require('../controllers/CustomerController');

// Get all customers
router.get('/customers', customerController.getCustomers);

// Approve a customer
router.patch('/customers/:user_id/approve', customerController.approveCustomer);

// Delete a customer
router.delete('/customers/:user_id', customerController.deleteCustomer);

// Update a customer
router.put('/customers/:user_id', customerController.updateCustomer);

module.exports = router;