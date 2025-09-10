const express = require('express');
const router = express.Router();
const shopControl = require('../controllers/shopControl');

router.get('/', shopControl.getShopStatus);
router.put('/', shopControl.setShopStatus);

module.exports = router;