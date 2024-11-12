import "../App.css"
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const WaitingRoomPage = () => {
    const navigate = useNavigate();
    const [allNames, setAllNames] = useState([]);
    const [gameStarted, setGameStarted] = useState(false);

    useEffect(() => {
        // Poll for game status every few seconds
        const intervalId = setInterval(async () => {
            getPlayerNames();
            const { data: gameData } = await axios.get('http://localhost:3001/api/waiting-room/status');
            if (gameData.started) {
                setGameStarted(true);
                clearInterval(intervalId);
            }
        }, 1000);

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, []); // Empty dependency array to run the effect only once

    useEffect(() => {
        if (gameStarted) {
            navigate('/game');
        }
    }, [gameStarted, navigate]);

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
            await axios.post('http://localhost:3001/api/waiting-room/start-game');
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