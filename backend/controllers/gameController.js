const { getDatabase } = require("firebase-admin/database");
const axios = require('axios');

const db = getDatabase();

exports.getPlayers = async (req, res) => { 
    try { 
        const playersRef = db.ref(`game/players`);

        const snapshot = await playersRef.get();
        const players = snapshot.val();

        res.status(200).json(players);
    } catch (error) {
        console.error("Error initializing deck:", error);
        res.status(500).json({ error: 'Failed to initialize deck' });
    }
};

exports.setCurrentPlayer = async (req, res) => {
    const { playerIds } = req.body;

    try {
        const currentPlayerRef = db.ref(`game/currentPlayer`);

        await currentPlayerRef.set(playerIds[0]);

        res.status(200).json({ message: 'Set current player successfully' });
    } catch (error) {
        console.error("Error setting current player:", error);
        res.status(500).json({ error: 'Failed to set current player' });
    }
};

exports.updateTurn = async (req, res) => {
    const { playerIds } = req.body;

    try {
        const currentPlayerRef = db.ref(`game/currentPlayer`);
        const turnRef = db.ref(`game/turn`);

        const snapshot = await turnRef.get();
        const turn = snapshot.val();

        await currentPlayerRef.set(playerIds[(turn + 1) % playerIds.length]);
        await turnRef.set((turn + 1) % playerIds.length);

        res.status(200).json({ message: 'Updated turn successfully' });
    } catch (error) {
        console.error("Error updating turn:", error);
        res.status(500).json({ error: 'Failed to update turn' });
    }
}