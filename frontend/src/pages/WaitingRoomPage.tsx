import "../App.css"
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue} from "firebase/database"
import axios from 'axios';

const WaitingRoomPage = () => {
    const navigate = useNavigate();
    const db = getDatabase();
    const gameRef = ref(db, `game`);
    const playersRef = ref(db, `game/players`);
    const [allNames, setAllNames] = useState([]);

    useEffect(() => {
        // Game status listener
        const gameListener = onValue(gameRef, (snapshot) => {
            const gameData = snapshot.val();
                
            if (gameData && gameData.started === true) {
                navigate('/game');
            }
        });

        // Players listener
        const playersListener = onValue(playersRef, () => {
            getPlayerNames();
        });

        // Cleanup function
        return () => {
            gameListener();
            playersListener();
        };
    }, [navigate]); // Add navigate to dependency array

    const getPlayerNames = async () => {
        try {
            const { data: names } = await axios.get('http://localhost:3001/api/waiting-room/players');
            setAllNames(names);
        } catch (error) {
            console.error("Error fetching player names:", error);
        }
    };

    const initGame = async () => {
        try {
            await axios.post('http://localhost:3001/api/waiting-room/start');
        } catch (error) {
            console.error("Error starting the game:", error);
        }
    };
        
    return (
        <main>
            <h1>Waiting till everyone joins...</h1>
            <h2 className="label">Players</h2>
            <ol>
                {allNames.map((name, index) => (<li key={index}>{name}</li>))}
            </ol>
            <button onClick={initGame}>Start Game</button>
        </main>
    )
}

export default WaitingRoomPage