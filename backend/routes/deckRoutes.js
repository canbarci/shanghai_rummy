const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deckController');

router.post('/init', deckController.initDeck);
router.get('/draw', deckController.drawCard);
router.post('/update-hand', deckController.updateHand);
router.get('/status', deckController.cardsDealtStatus);

module.exports = router;