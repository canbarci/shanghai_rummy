const express = require('express');
const router = express.Router();
const welcomeController = require('../controllers/welcomeController');

router.post('/add-player', welcomeController.addPlayer);

module.exports = router;