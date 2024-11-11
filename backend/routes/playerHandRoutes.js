const express = require('express');
const router = express.Router();
const playerHandController = require('../controllers/playerHandController');

router.get('/status', playerHandController.getCardsDealtStatus);
router.get('/deck', playerHandController.getDeckID);
router.get('/name/:playerId', playerHandController.getPlayerName);
router.post('/hand/:playerId', playerHandController.getPlayerHand)
router.post('/update/:playerId', playerHandController.updatePlayerHand)

module.exports = router;