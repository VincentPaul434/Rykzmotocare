const express = require('express');
const router = express.Router();
const mechanicController = require('../controllers/mechanicController');

router.get('/mechanics', mechanicController.getMechanics);
router.post('/mechanics', mechanicController.addMechanic);
router.put('/mechanics/:mechanic_id', mechanicController.updateMechanic);
router.delete('/mechanics/:mechanic_id', mechanicController.deleteMechanic);
router.get('/mechanics/all', mechanicController.getAllMechanics);

module.exports = router;