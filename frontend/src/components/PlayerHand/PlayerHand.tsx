import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue} from "firebase/database"
import { DndProvider } from "react-dnd";
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from "axios";
import Card from "../Card/Card.tsx"; // Import Card component
import './PlayerHand.css';

interface CardType {
    value: string;
    suit: string;
    image: string;
}

const PlayerHand: React.FC = () => {
    const playerId = localStorage.getItem('playerId');
    const db = getDatabase();
    const cardsDealtRef = ref(db, `game/cardsDealt`);
    const playerHandRef = ref(db, `game/players/${playerId}/hand`);
    const currentPlayerRef = ref(db, `game/currentPlayer`);
    const cardDrawnRef = ref(db, `game/players/${playerId}/cardDrawn`);
    const [deckId, setDeckId] = useState(null);
    const [name, setName] = useState(null);
    const [playerHand, setPlayerHand] = useState<CardType[]>([]);
    const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [cardDrawn, setCardDrawn] = useState(false);

    useEffect(() => {
        const cardsDealtListener = onValue(cardsDealtRef, (snapshot) => {
            const cardsDealt = snapshot.val()
            if (cardsDealt === true) {
                getID();
                getName();
            }
        });

        const playerHandListener = onValue(playerHandRef, (snapshot) => {
            const hand = snapshot.val()
            if (hand) {
                setPlayerHand(hand);
            }
        });

        const currentPlayerListener = onValue(currentPlayerRef, (snapshot) => {
            setCurrentPlayer(snapshot.val())
        });

        const cardDrawnListener = onValue(cardDrawnRef, (snapshot) => {
            setCardDrawn(snapshot.val())
        });

        return () => {
            cardsDealtListener();
            playerHandListener();
            currentPlayerListener();
            cardDrawnListener();
        };
    }, []); // Empty dependency array to run the effect only once

    useEffect(() => {
        // Only fetch hand when deckId is available
        if (deckId) {
            initHand();
        }
    }, [deckId]); // This effect will run every time deckId changes

    const getID = async () => {
        try {
            const { data: deckId } = await axios.get('http://localhost:3001/api/deck/id');
            setDeckId(deckId)
        } catch (error) {
            console.error("Error fetching deck id:", error);
        }
    };

    const getName = async () => {
        try {
            const { data: name } = await axios.get(`http://localhost:3001/api/player-hand/${playerId}/name`);
            setName(name);
        } catch (error) {
            console.error("Error fetching player name:", error);
        }
    };

    const initHand = async () => {
        if (deckId) {
            try {
                const { data: handData } = await axios.post(`http://localhost:3001/api/player-hand/${playerId}/hand`,
                    { deckId }
                );
                setPlayerHand(handData.hand);
            } catch (error) {
                console.error("Error fetching player hand:", error);
            }
        }
    };

    const moveCard = async (dragIndex: number, hoverIndex: number) => {
        setActiveCardIndex(null);

        const newHand = [...playerHand];
        const draggedCard = newHand[dragIndex];

        // Reorder the cards
        newHand.splice(dragIndex, 1);
        newHand.splice(hoverIndex, 0, draggedCard);

        // Update the state with the new order
        setPlayerHand(newHand);

        // Update the database with the new order (if needed)
        await axios.post(`http://localhost:3001/api/player-hand/${playerId}/update`,
            { newHand }
        );
    };

    const handleCardClick = (index: number) => {
        if (playerId === currentPlayer) {
            setActiveCardIndex((prev) => (prev === index ? null : index)); // Toggle the button
        } else {
            setActiveCardIndex(null); // Disable the button
        }
    };

    const handleDiscard = async (index: number) => {
        if (!cardDrawn) {
            // You could use a toast library or add a state to show an error message
            alert("You must draw cards before discarding.");
            return;
        }

        if (playerId === currentPlayer) {
            await axios.post(`http://localhost:3001/api/player-hand/${playerId}/discard-card/${index}`);
            setActiveCardIndex(null); // Hide the button after discard
            updateTurn();
        }
    };

    const updateTurn = async () => {
        const { data: players } = await axios.get(`http://localhost:3001/api/game/players`);
        const playerIds = Object.keys(players);
        await axios.post(`http://localhost:3001/api/game/update-turn`, 
            { playerIds }
        );
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <main>
                <h1 className="player-name">{name}</h1>
                <div className="player-hand">
                    {playerHand.map((card: CardType, index: number) => (
                        <Card 
                            key={index} 
                            card={card} 
                            index={index} 
                            moveCard={moveCard} 
                            isActive={activeCardIndex === index} // Pass active state
                            onClick={() => handleCardClick(index)} // Handle click
                            onDiscard={() => handleDiscard(index)} // Handle discard
                        />
                    ))}
                </div>
            </main>
        </DndProvider>
    );
};

export default PlayerHand;