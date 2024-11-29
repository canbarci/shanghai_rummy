const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.get('/players', gameController.getPlayers);
router.post('/turn', gameController.setCurrentPlayer);
router.post('/update-turn', gameController.updateTurn);

module.exports = router;