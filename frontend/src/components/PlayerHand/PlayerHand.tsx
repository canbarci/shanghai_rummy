import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from "axios";
import Card from "../Card.tsx"; // Import Card component
import './PlayerHand.css';

interface CardType {
    value: string;
    suit: string;
    image: string;
}

const PlayerHand: React.FC = () => {
    const playerId = localStorage.getItem('playerId');
    const [deckId, setDeckId] = useState(null);
    const [name, setName] = useState(null);
    const [hand, setHand] = useState<CardType[]>([]);

    useEffect(() => {
        const intervalId = setInterval(async () => {
            const { data: cardsDealt } = await axios.get('http://localhost:3001/api/player-hand/status');
            if (cardsDealt.cardsDealt === true) {
                getID();
                getName();
                clearInterval(intervalId);
            }
        }, 1000);
    }, []); // Empty dependency array to run the effect only once

    useEffect(() => {
        // Only fetch hand when deckId is available
        if (deckId) {
            getHand();
        }
    }, [deckId]); // This effect will run every time deckId changes

    const getID = async () => {
        try {
            const { data: deckId } = await axios.get('http://localhost:3001/api/player-hand/deck');
            setDeckId(deckId.deckId)
        } catch (error) {
            console.error("Error fetching deck id:", error);
        }
    };

    const getName = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/api/player-hand/name/${playerId}`);
            setName(response.data.name);
        } catch (error) {
            console.error("Error fetching player name:", error);
        }
    };

    const getHand = async () => {
        if (deckId) {
            console.log(deckId)
            try {
                const { data: hand } = await axios.post(`http://localhost:3001/api/player-hand/hand/${playerId}`,
                    { deckId: deckId }
                );
                setHand(hand.hand);
            } catch (error) {
                console.error("Error fetching player hand:", error);
            }
        }
    };

    const moveCard = async (dragIndex: number, hoverIndex: number) => {
        const newHand = [...hand];
        const draggedCard = newHand[dragIndex];

        // Reorder the cards
        newHand.splice(dragIndex, 1);
        newHand.splice(hoverIndex, 0, draggedCard);

        // Update the state with the new order
        setHand(newHand);

        // Update the database with the new order (if needed)
        await axios.post(`http://localhost:3001/api/player-hand/update/${playerId}`,
            { newHand: newHand }
        );
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <main>
                <h1 className="player-name">{name}</h1>
                <div className="player-hand">
                    {hand.map((card: CardType, index: number) => (
                        <Card key={index} card={card} index={index} moveCard={moveCard} />
                    ))}
                </div>
            </main>
        </DndProvider>
    );
};

export default PlayerHand;