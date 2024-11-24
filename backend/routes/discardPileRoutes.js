const express = require('express');
const router = express.Router();
const discardPileController = require('../controllers/discardPileController');

router.post('/init', discardPileController.initializeDiscardPile);
router.post('/add-card', discardPileController.addCard);
router.get('/card/:index', discardPileController.getCard);
// router.post('/:deckId/draw', deckController.drawCard);

module.exports = router;