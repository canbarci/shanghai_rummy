const { getDatabase } = require("firebase-admin/database");
const axios = require('axios');

const db = getDatabase();

exports.getPlayers = async (req, res) => { 
    try { 
        const playersRef = db.ref(`game/players`);

        const snapshot = await playersRef.get();
        const players = snapshot.val();

        res.json({ players });
    } catch (error) {
        console.error("Error initializing deck:", error);
        res.status(500).json({ error: 'Failed to initialize deck' });
    }
};