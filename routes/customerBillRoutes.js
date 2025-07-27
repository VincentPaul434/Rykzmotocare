const express = require('express');
const router = express.Router();
const customerBillController = require('../controllers/customerBillController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 

router.post('/', upload.single('invoice'), customerBillController.createBill);
router.get('/', customerBillController.getAllBills);

module.exports = router;