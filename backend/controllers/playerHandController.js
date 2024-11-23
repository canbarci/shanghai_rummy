const { getDatabase } = require("firebase-admin/database");
const axios = require('axios');

const db = getDatabase();

exports.getDeckID = async (req, res) => {
    try {
        const deckIdRef = db.ref('game/deck/deck_id');

        const snapshot = await deckIdRef.get();
        const deckId = snapshot.val();

        res.json({ deckId });
    } catch (error) {
        console.error("Error retrieving deck id:", error);
        res.status(500).json({ error: "Failed to retrieve deck id" });
    }
};

exports.getPlayerName = async (req, res) => {
    const { playerId } = req.params; // Get playerId from URL parameter

    try {        
        const nameRef = db.ref(`game/players/${playerId}/playerName`);
        const snapshot = await nameRef.get();
        const name = snapshot.val();

        if (!name) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.json({ name });
    } catch (error) {
        console.error("Error retrieving player name:", error);
        res.status(500).json({ error: "Failed to retrieve player name" });
    }
};

exports.initPlayerHand = async (req, res) => {
    const { deckId } = req.body;
    const { playerId } = req.params; // Get playerId from URL parameter

    try {
        const handRef = db.ref(`game/players/${playerId}/hand`);
        const remainingRef = db.ref(`game/deck/remaining`);

        const response = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=11`);
        const hand = response.data.cards;
        const remainingCards = response.data.remaining;

        await handRef.set(hand);
        await remainingRef.set(remainingCards);

        res.json({ hand });
    } catch (error) {
        console.error("Error retrieving player hand:", error);
        res.status(500).json({ error: "Failed to retrieve player hand" });
    }
}

exports.updatePlayerHand = async (req, res) => {
    const { newHand } = req.body;
    const { playerId } = req.params; // Get playerId from URL parameter

    try {
        const handRef = db.ref(`game/players/${playerId}/hand`);

        await handRef.set(newHand);

        res.status(200).json({ message: 'Player hand updated successfully' });
    } catch (error) {
        console.error("Error updating player hand:", error);
        res.status(500).json({ error: "Failed to update player hand" });
    }
}

exports.addCard = async (req, res) => {
    const { drawnCard } = req.body;
    const { playerId } = req.params; // Get playerId from URL parameter

    try {
        const handRef = db.ref(`game/players/${playerId}/hand`);

        const snapshot = await handRef.get();
        const hand = snapshot.val()

        const newHand = [...hand, drawnCard]

        await handRef.set(newHand);

        res.status(200).json({ message: 'Added card successfully' });
    } catch (error) {
        console.error("Error adding card", error);
        res.status(500).json({ error: "Failed to add card" });
    }
}



