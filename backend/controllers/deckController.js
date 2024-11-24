const { getDatabase } = require("firebase-admin/database");
const axios = require('axios');

const db = getDatabase();

exports.initialize = async (req, res) => {
    try { 
        const cardsDealtRef = db.ref(`game/cardsDealt`);
        const deckRef = db.ref(`game/deck`);

        const { data: deckData } = await axios.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=2&jokers_enabled=true');

        await deckRef.set(deckData);
        await cardsDealtRef.set(true);

        await axios.post('http://localhost:3001/api/discard-pile/init');

        res.status(200).json({ 
            message: 'Deck initiazlized successfully', 
            deckData 
        });
    } catch (error) {
        console.error("Error initializing deck:", error);
        res.status(500).json({ error: 'Failed to initialize deck' });
    }
};

exports.getDeckID = async (req, res) => {
    try {
        const deckIdRef = db.ref('game/deck/deck_id');

        const snapshot = await deckIdRef.get();
        const deckId = snapshot.val();

        res.status(200).json(deckId);
    } catch (error) {
        console.error("Error retrieving deck id:", error);
        res.status(500).json({ error: "Failed to retrieve deck id" });
    }
};

exports.drawCard = async (req, res) => {
    const { deckId } = req.params;

    try { 
        const remainingRef = db.ref(`game/deck/remaining`);

        const { data: drawnCardData } = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`)

        const drawnCard = drawnCardData.cards[0];
        const remaining = drawnCardData.remaining;

        remainingRef.set(remaining);

        res.status(200).json({ 
            message: 'Card drawn successfully', 
            drawnCard
        });
    } catch (error) {
        console.error("Error drawing card:", error);
        res.status(500).json({ error: 'Failed to draw card' });
    }
};