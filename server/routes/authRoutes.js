const express = require('express')
const authController = require('../controllers/authController')
const Schema = require('../models/auth')
const { registerValidator, loginValidator } = require('../validator/userValidator')
const router = express.Router();

// Register new user
router.post('/register', registerValidator, authController.register)

// Login user
router.post('/login', loginValidator, authController.login)

module.exports = router;