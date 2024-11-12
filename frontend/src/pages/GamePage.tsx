import "../App.css"
import React from "react";
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue } from "firebase/database"
import Deck from '../components/Deck.tsx'
import PlayerHand from "../components/PlayerHand/PlayerHand.tsx";
import OtherPlayerHand from "../components/OtherPlayerHand.tsx";
import { DeckProvider } from "../contexts/DeckContext.tsx";
import { PlayerHandProvider } from "../contexts/PlayerHandContext.tsx";

const GamePage = () => {
    // const db = getDatabase();
    // const playersRef = ref(db, 'players');
    // const [playerIds, setPlayerIds] = useState<string[]>([]);  // Store number of cards for each player
    // const currentUser = getAuth().currentUser?.uid;
    // const [playersHands, setPlayersHands] = useState<{ [playerId: string]: number }>();  // Store number of cards for each player

    // useEffect(() => {
    //     onValue(playersRef, (snapshot) => {
    //         const playersData = snapshot.val();
    //         if (playersData) {
    //             // const updatedHands: { [playerId: string]: number } = {};
    //             // Object.keys(playersData).forEach(playerId => {
    //             //     updatedHands[playerId] = playersData[playerId].hand.length;
    //             // });
    //             // setPlayersHands(updatedHands);
    //             setPlayerIds(Object.keys(playersData));
    //         }
    //         console.log(playersData)
    //     });
    // }, []);

    return (
        <div>
            <DeckProvider>
                <PlayerHandProvider>
                    <div>
                        <Deck />
                        <PlayerHand />
                    </div>
                </PlayerHandProvider>
            </DeckProvider>
        </div>
    );
};

export default GamePage