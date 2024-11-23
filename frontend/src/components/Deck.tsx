import "../App.css"
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { getDatabase, ref, onValue} from "firebase/database"

const Deck = () => {
    const playerId = localStorage.getItem('playerId');
    const db = getDatabase();
    const cardsDeltRef = ref(db, `game/cardsDealt`);
    const deckIdRef = ref(db, `game/deck/deck_id`);
    const [cardsDealt, setCardsDealt] = useState(false);
    const [deckId, setDeckId] = useState(null);

    interface Card {
        value: string;
        suit: string;
        image: string;
    }

    useEffect(() => {
        const cardsDealtListener = onValue(cardsDeltRef, (snapshot) => {
            setCardsDealt(snapshot.val());
        });

        const deckIdListener = onValue(deckIdRef, (snapshot) => {
            setDeckId(snapshot.val())
        });

        return () => {
            cardsDealtListener();
            deckIdListener();
        };
    }, []);

    const handleImageClick = async () => {
        console.log('Image clicked!');

        if (cardsDealt === false) {
            initializeDeck();
        } else {
            drawCard()
        }
    };

    const initializeDeck = async () => {
        try {
            await axios.post('http://localhost:3001/api/deck/init');
        } catch (error) {
            console.error("Error initializing deck:", error);
        }
    };

    const drawCard = async () => {
        try {
            const { data: drawnCardData } = await axios.post(`http://localhost:3001/api/deck/${deckId}/draw`);

            const drawnCard = drawnCardData.drawnCard

            await axios.post(`http://localhost:3001/api/player-hand/${playerId}/add-card`,
                { drawnCard }
            );
        } catch (error) {
            console.error("Error drawing new card:", error);
        }
    }

    return (
        <main>
            <img className="card" src="https://deckofcardsapi.com/static/img/back.png" alt="Back of Card" onClick={handleImageClick}></img>
        </main>
    );
}

export default Deck;