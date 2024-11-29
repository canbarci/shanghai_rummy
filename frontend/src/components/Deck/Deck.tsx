import React, { useEffect, useState, CSSProperties } from "react";
import axios from 'axios';
import { getDatabase, ref, onValue} from "firebase/database"
import "./Deck.css"

const Deck = () => {
    const playerId = localStorage.getItem('playerId');
    const db = getDatabase();
    const cardsDeltRef = ref(db, `game/cardsDealt`);
    const deckIdRef = ref(db, `game/deck/deck_id`);
    const currentPlayerRef = ref(db, `game/currentPlayer`);
    const cardDrawnRef = ref(db, `game/players/${playerId}/cardDrawn`);
    const [cardsDealt, setCardsDealt] = useState(false);
    const [deckId, setDeckId] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [cardDrawn, setCardDrawn] = useState(false);

    useEffect(() => {
        const cardsDealtListener = onValue(cardsDeltRef, (snapshot) => {
            setCardsDealt(snapshot.val());
        });

        const deckIdListener = onValue(deckIdRef, (snapshot) => {
            setDeckId(snapshot.val())
        });

        const currentPlayerListener = onValue(currentPlayerRef, (snapshot) => {
            setCurrentPlayer(snapshot.val())
        });

        const cardDrawnListener = onValue(cardDrawnRef, (snapshot) => {
            setCardDrawn(snapshot.val())
        });

        return () => {
            cardsDealtListener();
            deckIdListener();
            currentPlayerListener();
            cardDrawnListener();
        };
    }, []);

    const handleImageClick = async () => {
        console.log('Image clicked!');

        if (cardsDealt === false) {
            await initialize();
        } else if (playerId === currentPlayer && !cardDrawn) {
            await drawCard();
        } else {
            alert(cardDrawn
                ? "You've already drawn a card this turn." 
                : "It's not your turn to draw a card."
            );
        }
    };

    const initialize = async () => {
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

    const getPointerStyle = (): CSSProperties => {
        if (cardsDealt === false) {
            return {
                pointerEvents: 'auto'
            };
        }

        return {
            cursor: !cardDrawn ? 'pointer' : 'not-allowed',
            pointerEvents: !cardDrawn ? 'auto' : 'none'
        };
    };

    return (
        <main>
            <img 
                className={"card"}
                src="https://deckofcardsapi.com/static/img/back.png" 
                alt="Back of Card" 
                onClick={handleImageClick}
                style={getPointerStyle()}
            ></img>
        </main>
    );
}

export default Deck;