const express = require('express');
const router = express.Router();
const playerHandController = require('../controllers/playerHandController');

router.get('/:playerId/name', playerHandController.getPlayerName);
router.post('/:playerId/hand', playerHandController.initPlayerHand);
router.post('/:playerId/update', playerHandController.updatePlayerHand);
router.post('/:playerId/add-card', playerHandController.addCard);
router.post('/:playerId/discard-card/:index', playerHandController.discardCard);

module.exports = router;