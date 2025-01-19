import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import axios from "axios";
import Card from "../Card/Card.tsx"; // Import Card component
import './PlayerHand.css';
import LayDownGroups from "../LayDownGroups/LayDownGroups.tsx";

interface CardType {
    value: string;
    suit: string;
    image: string;
}

export interface GroupConfig {
    type: 'book' | 'run';
    minCards: number;
    maxGroups: number;
}

const PlayerHand = () => {
    const playerId = localStorage.getItem('playerId');
    const db = getDatabase();
    const cardsDealtRef = ref(db, `game/cardsDealt`);
    const playerHandRef = ref(db, `game/players/${playerId}/hand`);
    const currentPlayerRef = ref(db, `game/currentPlayer`);
    const cardDrawnRef = ref(db, `game/players/${playerId}/cardDrawn`);
    const [deckId, setDeckId] = useState(null);
    const [name, setName] = useState(null);
    const [cardsDealt, setCardsDealt] = useState(false);
    const [playerHand, setPlayerHand] = useState<CardType[]>([]);
    const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [cardDrawn, setCardDrawn] = useState(false);
    const [layingDown, setLayingDown] = useState(false);

    useEffect(() => {
        const cardsDealtListener = onValue(cardsDealtRef, (snapshot) => {
            const cardsDealt = snapshot.val()
            if (cardsDealt === true) {
                getID();
                getName();
                setCardsDealt(true);
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
    }, []);

    useEffect(() => {
        if (deckId) {
            initHand();
        }
    }, [deckId]);

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

        newHand.splice(dragIndex, 1);
        newHand.splice(hoverIndex, 0, draggedCard);

        setPlayerHand(newHand);

        await axios.post(`http://localhost:3001/api/player-hand/${playerId}/update`,
            { newHand }
        );
    };

    const handleCardClick = (index: number) => {
        if (playerId === currentPlayer) {
            setActiveCardIndex((prev) => (prev === index ? null : index));
        } else {
            setActiveCardIndex(null);
        }
    };

    const handleDiscard = async (index: number) => {
        if (!cardDrawn) {
            alert("You must draw cards before discarding.");
            return;
        }

        if (playerId === currentPlayer) {
            await axios.post(`http://localhost:3001/api/player-hand/${playerId}/discard-card/${index}`);
            setActiveCardIndex(null);
            updateTurn();
        }
    };

    const updateTurn = async () => {
        const { data: players } = await axios.get(`http://localhost:3001/api/game/players`);
        const playerIds = Object.keys(players);
        await axios.post(`http://localhost:3001/api/game/update-turn`, 
            { playerIds }
        );
    };

    const handleLayDown = async (groups: Record<string, CardType[]>) => {
        // Implement lay down logic here
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <main>
                <h1 className="player-name">{name}</h1>
                {cardsDealt && (
                    <LayDownGroups
                        onLayDown={handleLayDown}
                        onCancel={() => setLayingDown(false)}
                        playerHand={playerHand}  // Add this prop
                    />
                )}
                <div className="player-hand">
                    {playerHand.map((card: CardType, index: number) => (
                        <Card 
                            key={index} 
                            card={card} 
                            index={index} 
                            moveCard={moveCard} 
                            isActive={activeCardIndex === index} 
                            onClick={() => handleCardClick(index)} 
                            onDiscard={() => handleDiscard(index)} 
                        />
                    ))}
                </div>
                {playerId === currentPlayer && (
                    <button 
                        onClick={() => setLayingDown(true)}
                        disabled={!cardDrawn}
                    >
                        Lay Down
                    </button>
                )}
            </main>
        </DndProvider>
    );
};

export default PlayerHand;