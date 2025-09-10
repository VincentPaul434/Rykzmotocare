const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.get('/inventory', inventoryController.getItems);
router.post('/inventory', upload.single('image'), inventoryController.addItem);
router.put('/inventory/:item_id', inventoryController.updateItem);
router.delete('/inventory/:item_id', inventoryController.deleteItem);
router.post('/inventory/:item_id/sell', inventoryController.sellItem);

module.exports = router;