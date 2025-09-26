const express = require('express');
const router = express.Router();
const mechanicController = require('../controllers/mechanicController');
const multer = require('multer');
const path = require('path');

// uploads/mechanics folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads', 'mechanics'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '');
    cb(null, `mechanic_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// List (full details)
router.get('/mechanics', mechanicController.getAllMechanics);

// Available (name/id only) — place BEFORE :mechanic_id to avoid route collision
router.get('/mechanics/available', mechanicController.getMechanics);

// Details
router.get('/mechanics/:mechanic_id', mechanicController.getMechanicById);

// Create with photo
router.post('/mechanics', upload.single('photo'), mechanicController.addMechanic);

// Update (optional photo replace)
router.put('/mechanics/:mechanic_id', upload.single('photo'), mechanicController.updateMechanic);

// Delete
router.delete('/mechanics/:mechanic_id', mechanicController.deleteMechanic);


module.exports = router;