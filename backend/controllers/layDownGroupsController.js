const { getDatabase } = require("firebase-admin/database");
const axios = require('axios');

const db = getDatabase();

exports.initialize = async (req, res) => {
    const { groups } = req.body;
    const { playerId } = req.params; // Get playerId from URL parameter

    try { 
        const groupsRef = db.ref(`game/players/${playerId}/groups`);
        const laidDownRef = db.ref(`game/players/${playerId}/laidDown`);

        await groupsRef.set(groups);
        await laidDownRef.set(true);

        res.status(200).json({ message: 'Groups intialized successfully' });
    } catch (error) {
        console.error("Error initializing groups:", error);
        res.status(500).json({ error: 'Failed to initialize groups' });
    }
};

exports.update = async (req, res) => {
    const { groups } = req.body;
    const { playerId } = req.params; // Get playerId from URL parameter

    try { 
        const groupsRef = db.ref(`game/players/${playerId}/groups`);

        await groupsRef.set(groups);

        res.status(200).json({ message: 'Groups updated successfully' });
    } catch (error) {
        console.error("Error updating groups:", error);
        res.status(500).json({ error: 'Failed to update groups' });
    }
};