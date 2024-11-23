const { getDatabase } = require("firebase-admin/database");
const axios = require('axios');

const db = getDatabase();

exports.initDeck = async (req, res) => {
    try { 
        const cardsDealtRef = db.ref(`game/cardsDealt`);
        const deckRef = db.ref(`game/deck`);

        const response = await axios.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=2&jokers_enabled=true');

        const deckData = response.data;

        await deckRef.set(deckData);
        await cardsDealtRef.set(true);

        res.status(200).json({ message: 'Deck initiazlized successfully', deckData });
    } catch (error) {
        console.error("Error initializing deck:", error);
        res.status(500).json({ error: 'Failed to initialize deck' });
    }
};

exports.drawCard = async (req, res) => {
    const { deckId } = req.params;

    try { 
        const remainingRef = db.ref(`game/deck/remaining`);

        const response = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`)

        const drawnCard = response.data.cards[0];
        const remaining = response.data.remaining;

        remainingRef.set(remaining);

        res.status(200).json({ message: 'Card drawn successfully', drawnCard});
    } catch (error) {
        console.error("Error drawing card:", error);
        res.status(500).json({ error: 'Failed to draw card' });
    }
};