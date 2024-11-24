import "../../App.css"
import React from "react";
import axios from "axios";
import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue} from "firebase/database"
import { getAuth } from "firebase/auth";
import Deck from '../../components/Deck.tsx'
import PlayerHand from "../../components/PlayerHand/PlayerHand.tsx";
import OtherPlayerHand from "../../components/OtherPlayerHand/OtherPlayerHand.tsx";
import DiscardPile from "../../components/DiscardPile.tsx";
import './GamePage.css';


const GamePage = () => {
    const currentUser = localStorage.getItem('playerId');
    const db = getDatabase();
    const cardsDealtRef = ref(db, 'game/cardsDealt');
    const [playerIds, setPlayerIds] = useState<string[]>([]);  // Store number of cards for each player
    const [playerHands, setPlayersHands] = useState<{ [playerId: string]: number }>();  // Store number of cards for each player

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
    }, []); // Empty dependency array to run the effect only once

    // Set up individual listeners for each player's hand
    useEffect(() => {
        if (playerIds) {
            // Create an object to store unsubscribe functions
            const listeners: { [playerId: string]: () => void } = {};

            // Set up a listener for each player's hand
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

                listener[playerId] = listeners;
            });

            // Cleanup function to remove all listeners
            return () => {
                Object.values(listeners).forEach(listener => listener());
            };
        }
    }, [playerIds]);

    const getPlayerIds = async () => {
        try {
            const { data: players } = await axios.get(`http://localhost:3001/api/game/players`);
            const playerIds = Object.keys(players);
            setPlayerIds(playerIds)
        } catch (error) {
            console.error("Error fetching player name:", error);
        }
    };

    return (
        <div className="game">
            {<Deck />}
            {<DiscardPile />}
            <PlayerHand />
            {playerHands && Object.entries(playerHands).map(([playerId, cardCount]) => {
                // Skip rendering if this is the current user
                if (playerId === currentUser) return null;
                
                return (
                    <div key={playerId}>
                        <OtherPlayerHand playerId={playerId} cardsCount={cardCount} />
                    </div>
                );
            })}
        </div>
    );
};

export default GamePage