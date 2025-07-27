const express = require('express');
const router = express.Router();
const customerController = require('../controllers/CustomerController');

router.get('/users/customers', customerController.getCustomers);
router.patch('/customers/:user_id/approve', customerController.approveCustomer);

module.exports = router;