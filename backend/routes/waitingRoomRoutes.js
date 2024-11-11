const express = require('express');
const router = express.Router();
const waitingRoomController = require('../controllers/waitingRoomController');

router.post('/start', waitingRoomController.initGame);
router.get('/players', waitingRoomController.getPlayerNames);
router.get('/status', waitingRoomController.getGameStatus);

module.exports = router;