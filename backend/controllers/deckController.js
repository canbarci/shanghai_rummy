const { getDatabase, ref, set, get } = require("firebase-admin/database");
const axios = require('axios');

const db = getDatabase();

exports.initDeck = async (req, res) => {
    try { 
        const cardsDealtRef = db.ref(`game/cardsDealt`);
        const deckRef = db.ref(`game/deck`);

        const response = await axios.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=2&jokers_enabled=true');

        const deckData = response.data;

        await deckRef.set(deckData);
        await cardsDealtRef.set(true);

        res.status(200).json({ message: 'Deck initiazlized successfully'});
    } catch (error) {
        console.error("Error initializing deck:", error);
        res.status(500).json({ error: 'Failed to initialize deck' });
    }
};

exports.drawCard = async (req, res) => {
    try { 
        const deckRef = db.ref(`game/deck`);
        const remainingRef = db.ref(`game/deck/remaining`);

        const snapshot = await deckRef.get()
        const deckData = snapshot.val();

        const newCard = null;
        if (deckData) {
            const response = await axios.get(`https://deckofcardsapi.com/api/deck/${deckData.deck_id}/draw/?count=1`)

            newCard = response.data.cards[0];
            const remaining = response.data.remaining;

            remainingRef.set(remaining);
        } else {
            console.log("Deck not initialized yet");
        }

        res.status(200).json(newCard);
    } catch (error) {
        console.error("Error drawing card:", error);
        res.status(500).json({ error: 'Failed to draw card' });
    }
};

exports.updateHand = async (req, res) => {
    const { newCard } = req.body;

    try { 
        const handRef = db.ref(`players/${getAuth().currentUser?.uid}/hand`);

        const snapshot = await handRef.get()
        const handData = snapshot.val();

        const newHand = [...handData, newCard];

        await handRef.set(newHand);

        res.status(200).json({ message: 'Updated hand successfully'});
    } catch (error) {
        console.error("Error updating hand:", error);
        res.status(500).json({ error: 'Failed to update hand' });
    }
};

exports.cardsDealtStatus = async (req, res) => {
    try { 
        const cardsDealtRef = db.ref(`game/cardsDealt`);

        const snapshot = await cardsDealtRef.get()
        const cardsDealtData = snapshot.val();

        res.status(200).json(cardsDealtData);
    } catch (error) {
        console.error("Error updating hand:", error);
        res.status(500).json({ error: 'Failed to update hand' });
    }
};