const { getDatabase, ref, set, get } = require("firebase-admin/database");

const db = getDatabase();
const admin = require("firebase-admin");

exports.addPlayer = async (req, res) => {
    const { playerName } = req.body;

    try {
        // Sign in anonymously with Firebase Auth
        const authUser = await admin.auth().createUser({ displayName: playerName })
        
        const playerId = authUser.uid;
        
        const gameRef = db.ref('game');
        const playerRef = db.ref(`game/players/${playerId}`);
        const gameStartRef = db.ref('game/started');

        // Set initial data in Firebase Realtime Database
        await gameStartRef.set(false); // Ensure game is marked as not started
        await playerRef.set({ playerName });

        // Set up onDisconnect behavior to remove player and game data
        gameRef.onDisconnect().remove();

        res.status(200).json({ 
            message: 'Player added successfully', 
            playerId 
        });
    } catch (error) {
        console.error("Error adding player:", error);
        res.status(500).json({ error: 'Failed to add player' });
    }
};
