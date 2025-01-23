import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { useDrop } from "react-dnd";
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
    const laidDownRef = ref(db, `game/players/${playerId}/laidDown`);
    const [deckId, setDeckId] = useState(null);
    const [name, setName] = useState(null);
    const [cardsDealt, setCardsDealt] = useState(false);
    const [playerHand, setPlayerHand] = useState<CardType[]>([]);
    const [backupHand, setBackupHand] = useState<CardType[]>([]);
    const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [cardDrawn, setCardDrawn] = useState(false);
    const [layingDown, setLayingDown] = useState(false);
    const [laidDown, setLaidDown] = useState(false);
    const [showLayDownGroups, setShowLayDownGroups] = useState(false);

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

        const laidDownRefListener = onValue(laidDownRef, (snapshot) => {
            console.log(snapshot.val())
            setLaidDown(snapshot.val())
        });

        return () => {
            cardsDealtListener();
            playerHandListener();
            currentPlayerListener();
            cardDrawnListener();
            laidDownRefListener();
        };
    }, []);

    useEffect(() => {
        if (deckId) {
            initHand();
        }
    }, [deckId]);

    useEffect(() => {
        setShowLayDownGroups(
            (playerId === currentPlayer && layingDown) || // Show to current player while laying down
            laidDown // Show to everyone after confirmed
        );
    }, [playerId, currentPlayer, layingDown, laidDown]);

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

    const updateTurn = async () => {
        const { data: players } = await axios.get(`http://localhost:3001/api/game/players`);
        const playerIds = Object.keys(players);
        await axios.post(`http://localhost:3001/api/game/update-turn`, 
            { playerIds }
        );
    };



    const handleCardClick = (index: number) => {
        if (playerId === currentPlayer && !layingDown) {
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



    const handleLayDown = async (groups: Record<string, CardType[]>) => {
        setLayingDown(false);

        await axios.post(`http://localhost:3001/api/player-hand/${playerId}/update`, {
            newHand: [...playerHand]
        })
    };

    const handleLayingDown = () => {
        setActiveCardIndex(null);
        setBackupHand(playerHand);
        setLayingDown(true);
    };

    const handleCancel = () => {
        setPlayerHand(backupHand);
        setLayingDown(false);
    }

    const [{ isOver }, drop] = useDrop({
        accept: 'GROUP_CARD',
        canDrop: () => !laidDown,
        drop: (item: { card: CardType; groupKey: string; index: number }) => {
            if (!laidDown) {
                console.log(laidDown)
                const { card } = item;
                setPlayerHand(prev => [...prev, card]);
    
                axios.post(`http://localhost:3001/api/player-hand/${playerId}/update`, {
                    newHand: [...playerHand, card]
                });
            }
        },
        collect: monitor => ({
            isOver: !!monitor.isOver()
        })
    });

    const handleGroupDrop = async (index: number) => {
        const updatedHand = playerHand.filter((_, i) => i !== index);
        setPlayerHand(updatedHand);
    
        if (laidDown) {
            await axios.post(`http://localhost:3001/api/player-hand/${playerId}/update`, {
                newHand: updatedHand
            });
        }
    };
    
    const handleHandDrop = async (card: CardType) => {
        const updatedHand = [...playerHand, card];
        setPlayerHand(updatedHand);
    
        if (laidDown) {
            await axios.post(`http://localhost:3001/api/player-hand/${playerId}/update`, {
                newHand: updatedHand
            });
        }
    };



    return (
        <main>
            <h1 className="player-name">{name}</h1>
            {showLayDownGroups && cardsDealt && (
                <LayDownGroups
                    playerHand={playerHand}
                    onGroupDrop={handleGroupDrop}
                    onHandDrop={handleHandDrop}
                    onLayDown={handleLayDown}
                    onCancel={handleCancel}
                    isVisible={showLayDownGroups}
                />
            )}
            <div 
                className={`player-hand ${isOver ? 'drag-over' : ''}`}
                ref={drop}
            >
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
            {cardsDealt && !layingDown && !laidDown && (
                <button 
                    onClick={handleLayingDown}
                    disabled={!cardDrawn || playerId !== currentPlayer}
                >
                    Lay Down
                </button>
            )}
        </main>
    );
};

export default PlayerHand;