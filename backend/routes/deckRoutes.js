const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deckController');

router.post('/init', deckController.initDeck);
router.post('/:deckId/draw', deckController.drawCard);

module.exports = router;