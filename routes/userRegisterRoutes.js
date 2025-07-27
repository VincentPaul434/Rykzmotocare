const express = require('express');
const router = express.Router();
const userRegister = require('../controllers/userRegisterController');

router.post('/user/register', userRegister.validate, userRegister.register);

module.exports = router;