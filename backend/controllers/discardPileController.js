const { getDatabase } = require("firebase-admin/database");
const axios = require('axios');

const db = getDatabase();

exports.initializeDiscardPile = async (req, res) => {
    try { 
        const deckIdRef = db.ref(`game/deck/deck_id`);
        const discardCardRef = db.ref(`game/discardPile/0`);
        const totalRef = db.ref(`game/discardPile/total`);

        const snapshot = await deckIdRef.get();
        const deckId = snapshot.val();
        
        const { data: drawnCardData } = await axios.post(`http://localhost:3001/api/deck/${deckId}/draw`);

        const drawnCard = drawnCardData.drawnCard

        await discardCardRef.set(drawnCard);
        await totalRef.set(1);

        res.status(200).json({ 
            message: 'Discard pile initiazlized successfully', 
            drawnCard
        });
    } catch (error) {
        console.error("Error initializing discard pile:", error);
        res.status(500).json({ error: 'Failed to initialize discard pile' });
    }
};

exports.addCard = async (req, res) => {
    const { card } = req.body;

    try {
        const totalRef = db.ref(`game/discardPile/total`);

        const snapshot = await totalRef.get();
        const total = snapshot.val();

        const discardRef = db.ref(`game/discardPile/${total}`);

        await discardRef.set(card);
        await totalRef.set(total + 1);

        res.status(200).json({ message: 'Added card successfully' });
    } catch (error) {
        console.error("Error adding card", error);
        res.status(500).json({ error: "Failed to add card" });
    }
}

exports.getCard = async (req, res) => {
    const { index } = req.params;

    try { 
        const cardRef = db.ref(`game/discardPile/${index}`);

        const snapshot = await cardRef.get();
        const card = snapshot.val();

        res.status(200).json(card);
    } catch (error) {
        console.error("Error initializing discard pile:", error);
        res.status(500).json({ error: 'Failed to initialize discard pile' });
    }
};

exports.drawCard = async (req, res) => {
    try { 
        // const discardRef = db.ref(`game/discardPile`)
        const totalRef = db.ref(`game/discardPile/total`);

        const totalSnapshot = await totalRef.get();
        const total = totalSnapshot.val();

        const drawnCardRef = db.ref(`game/discardPile/${total - 1}`);

        const drawnCardSnapshot = await drawnCardRef.get();
        const drawnCard = drawnCardSnapshot.val();

        await drawnCardRef.remove();
        await totalRef.set(total - 1);

        res.status(200).json({ 
            message: 'Card drawn successfully', 
            drawnCard
        });
    } catch (error) {
        console.error("Error drawing card:", error);
        res.status(500).json({ error: 'Failed to draw card' });
    }
};