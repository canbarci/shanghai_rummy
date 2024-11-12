const { getDatabase } = require("firebase-admin/database");
const axios = require('axios');

const db = getDatabase();

exports.getPlayerName = async (req, res) => {
    const { playerId } = req.params; // Get playerId from URL parameter

    try {        
        const nameRef = db.ref(`game/players/${playerId}/playerName`);
        const snapshot = await nameRef.get();
        let name = snapshot.val();

        if (!name) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.status(200).json({ name });
    } catch (error) {
        console.error("Error retrieving player name:", error);
        if (error.code === 'auth/argument-error') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: "Failed to retrieve player name" });
    }
};

exports.getPlayerHand = async (req, res) => {
    const { playerId, deckId } = req.body;

    try {
        const handRef = db.ref(`game/players/${playerId}/hand`);
        const remainingRef = db.ref(`game/deck/remaining`);

        const response = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=11`);
        const hand = response.data.cards;
        const remainingCards = response.data.remaining;

        await handRef.set(hand);
        await remainingRef.set(remainingCards);

        res.status(200).json({ hand });
    } catch (error) {
        console.error("Error retrieving player hand:", error);
        res.status(500).json({ error: "Failed to retrieve player hand" });
    }
}

exports.updatePlayerHand = async (req, res) => {
    const { playerId, newHand} = req.body;
    
    try {
        const handRef = db.ref(`game/players/${playerId}/hand`);

        await handRef.set(newHand);

        res.status(200).json({ message: 'Player hand updated successfully', playerId });
    } catch (error) {
        console.error("Error updating player hand:", error);
        res.status(500).json({ error: "Failed to update player hand" });
    }
}

