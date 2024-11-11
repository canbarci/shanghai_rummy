const { getDatabase, ref, set, get } = require("firebase-admin/database");

const db = getDatabase();

// Initialize game state
exports.initGame = async (req, res) => {
    try {
        const startedRef = db.ref(`game/started`);
        const cardsDealtRef = db.ref(`game/cardsDealt`);
        const turnRef = db.ref(`game/turn`);
    
        await startedRef.set(true);
        await cardsDealtRef.set(false);
        await turnRef.set(0);

        res.status(200).json({ message: "Game started successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to start the game" });
    }
};

// Get all player names
exports.getPlayerNames = async (req, res) => {
    try {
        const playersRef = db.ref(`game/players`);

        const snapshot = await playersRef.get()
        const playersData = snapshot.val();
        
        const playerNames = [];
        for (const key in playersData) {
            if (playersData[key].playerName) {
                playerNames.push(playersData[key].playerName);
            }
        }

        res.status(200).json(playerNames);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve player names" });
    }
};

// Get game status
exports.getGameStatus = async (req, res) => {
    try {
        const gameRef = db.ref(`game`);
        
        const snapshot = await gameRef.get();
        const gameData = snapshot.val();

        res.status(200).json(gameData);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve game status" });
    }
};
