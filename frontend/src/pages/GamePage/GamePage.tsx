import "../../App.css"
import React from "react";
import axios from "axios";
import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue} from "firebase/database"
import Deck from '../../components/Deck/Deck.tsx'
import PlayerHand from "../../components/PlayerHand/PlayerHand.tsx";
import OtherPlayerHand from "../../components/OtherPlayerHand/OtherPlayerHand.tsx";
import DiscardPile from "../../components/DiscardPile/DiscardPile.tsx";
import './GamePage.css';
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";


const GamePage = () => {
    const currentUser = localStorage.getItem('playerId');
    const db = getDatabase();
    const cardsDealtRef = ref(db, 'game/cardsDealt');
    const [playerIds, setPlayerIds] = useState<string[]>([]); 
    const [playerHands, setPlayersHands] = useState<{ [playerId: string]: number }>({});

    useEffect(() => {
        const cardsDealtListener = onValue(cardsDealtRef, (snapshot) => {
            const cardsDealt = snapshot.val()
            if (cardsDealt === true) {
                getPlayerIds();
            }
        })

        return () => {
            cardsDealtListener();
        };
    }, []);

    useEffect(() => {
        if (playerIds.length > 0) {
            const listeners: { [playerId: string]: () => void } = {};

            playerIds.forEach(playerId => {
                const playerHandRef = ref(db, `game/players/${playerId}/hand`);
                
                const listener = onValue(playerHandRef, (snapshot) => {
                    const handData = snapshot.val();
                    if (handData) {
                        setPlayersHands(prevHands => ({
                            ...prevHands,
                            [playerId]: handData.length
                        }));
                    }
                });

                listeners[playerId] = listener;
            });

            return () => {
                Object.entries(listeners).forEach(([_, unsubscribe]) => unsubscribe());
            };
        }
    }, [playerIds]);

    const getPlayerIds = async () => {
        try {
            const { data: players } = await axios.get(`http://localhost:3001/api/game/players`);
            const playerIds = Object.keys(players);
            setPlayerIds(playerIds);
            setCurrentPlayer(playerIds);
        } catch (error) {
            console.error("Error fetching player name:", error);
        }
    };

    const setCurrentPlayer = async (playerIds: string[]) => {
        try {
            await axios.post(`http://localhost:3001/api/game/turn`, { playerIds });
        } catch (error) {
            console.error("Error setting turn order:", error);
        }
    }

    const getPlayerPosition = (index: number, totalPlayers: number): string => {
        if (totalPlayers === 1) return 'player-position-1'; // Only top
        if (totalPlayers === 2) {
            return index === 0 ? 'player-position-1' : 'player-position-2'; // Top and left
        }
        const positions = ['player-position-1', 'player-position-2', 'player-position-3'];
        return positions[index];
    };

    const otherPlayers = playerIds
        .filter(playerId => playerId !== currentUser)
        .map(playerId => ({
            playerId,
            cardCount: playerHands[playerId] || 0
        }));

    const getHandContainerClass = (position: string): string => {
        if (position === 'player-position-2') return 'hand-container-left';
        if (position === 'player-position-3') return 'hand-container-right';
        return '';
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="game">
                <div className="center">
                    <Deck />
                    <DiscardPile />
                </div>
                
                <div className="other-players">
                    {otherPlayers.map(({playerId, cardCount}, index) => {
                        const positionClass = getPlayerPosition(index, otherPlayers.length);
                        const containerClass = getHandContainerClass(positionClass);
                        
                        return (
                            <div 
                                key={playerId} 
                                className={positionClass}
                            >
                                <div className={containerClass}>
                                    <OtherPlayerHand 
                                        playerId={playerId} 
                                        cardsCount={cardCount} 
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="current-player">
                    <PlayerHand />
                </div>
            </div>
        </DndProvider>
    );
};

export default GamePage;