const { getDatabase } = require("firebase-admin/database");
const axios = require('axios');

const db = getDatabase();

exports.getPlayerName = async (req, res) => {
    const { playerId } = req.params; // Get playerId from URL parameter

    try {        
        const nameRef = db.ref(`game/players/${playerId}/playerName`);
        const snapshot = await nameRef.get();
        const name = snapshot.val();

        if (!name) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.status(200).json(name);
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
        const laidDownRef = db.ref(`game/players/${playerId}/laidDown`);
        const cardDrawnRef = db.ref(`game/players/${playerId}/cardDrawn`);
        const remainingRef = db.ref(`game/deck/remaining`);

        const { data: handData } = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=11`);
        
        const hand = handData.cards;
        const remainingCards = handData.remaining;

        await handRef.set(hand);
        await laidDownRef.set(false);
        await cardDrawnRef.set(false);
        await remainingRef.set(remainingCards);

        res.status(200).json({ 
            message: 'Player hand retrieved successfully', 
            hand 
        });
    } catch (error) {
        console.error("Error retrieving player hand:", error);
        res.status(500).json({ error: "Failed to retrieve player hand" });
    }
}

exports.getPlayerHand = async (req, res) => {
    const { playerId } = req.params; // Get playerId from URL parameter

    try {
        const handRef = db.ref(`game/players/${playerId}/hand`);
        const snapshot = await handRef.get();
        const playerHand = snapshot.val();

        if (!playerHand) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.status(200).json(playerHand);
    } catch (error) {
        console.error("Error getting player hand:", error);
        res.status(500).json({ error: "Failed to get player hand" });
    }
}

exports.getLaidDownStatus = async (req, res) => {
    const { playerId } = req.params; // Get playerId from URL parameter

    try {
        const laidDownRef = db.ref(`game/players/${playerId}/laidDown`);
        const snapshot = await laidDownRef.get();
        const laidDown = snapshot.val();

        if (!laidDown) {
            return res.status(404).json({ error: 'Status not found' });
        }

        res.status(200).json(laidDown);
    } catch (error) {
        console.error("Error getting status:", error);
        res.status(500).json({ error: "Failed to get status" });
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
        const cardDrawnRef = db.ref(`game/players/${playerId}/cardDrawn`);

        const snapshot = await handRef.get();
        const hand = snapshot.val()

        const newHand = [...hand, drawnCard]

        await handRef.set(newHand);
        await cardDrawnRef.set(true);

        res.status(200).json({ message: 'Added card successfully' });
    } catch (error) {
        console.error("Error adding card", error);
        res.status(500).json({ error: "Failed to add card" });
    }
}

exports.discardCard = async (req, res) => {
    const { playerId, index } = req.params; // Get playerId from URL parameter

    try {
        const handRef = db.ref(`game/players/${playerId}/hand`);
        const cardRef = db.ref(`game/players/${playerId}/hand/${index}`);
        const cardDrawnRef = db.ref(`game/players/${playerId}/cardDrawn`);

        const cardSnapshot = await cardRef.get();
        const card = cardSnapshot.val()

        await axios.post(`http://localhost:3001/api/discard-pile/add-card`,
            { card }
        );

        const handSnapshot = await handRef.get();
        const hand = handSnapshot.val()

        const newHand = [...hand];
        newHand.splice(index, 1);
        
        await handRef.set(newHand);
        await cardDrawnRef.set(false);

        res.status(200).json({ message: 'Added card successfully' });
    } catch (error) {
        console.error("Error adding card", error);
        res.status(500).json({ error: "Failed to add card" });
    }
}

exports.getCardDrawnStatus = async (req, res) => {
    const { playerId } = req.params;

    try {
        const cardDrawnRef = db.ref(`game/players/${playerId}/cardDrawn`);
        const snapshot = await cardDrawnRef.get();
        const cardDrawn = snapshot.val();

        if (!cardDrawn) {
            return res.status(404).json({ error: 'Status not found' });
        }

        res.status(200).json(cardDrawn);
    } catch (error) {
        console.error("Error getting status:", error);
        res.status(500).json({ error: "Failed to get status" });
    }
}




