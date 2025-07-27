const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/inventory', inventoryController.getItems);
router.post('/inventory', inventoryController.addItem);
router.put('/inventory/:item_id', inventoryController.updateItem);
router.delete('/inventory/:item_id', inventoryController.deleteItem);
router.post('/inventory/:item_id/sell', inventoryController.sellItem);

module.exports = router;