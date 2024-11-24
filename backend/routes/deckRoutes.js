const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deckController');

router.get('/id', deckController.getDeckID);
router.post('/init', deckController.initialize);
router.post('/:deckId/draw', deckController.drawCard);

module.exports = router;