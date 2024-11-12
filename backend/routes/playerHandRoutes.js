const express = require('express');
const router = express.Router();
const playerHandController = require('../controllers/playerHandController');

router.get('/name/:playerId', playerHandController.getPlayerName);
router.post('/hand', playerHandController.getPlayerHand)
router.post('/update', playerHandController.updatePlayerHand)

module.exports = router;