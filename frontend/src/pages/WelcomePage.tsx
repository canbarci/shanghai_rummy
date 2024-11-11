import "../App.css"
import React from "react";
import { ChangeEvent, useState } from 'react';
import {Link} from 'react-router-dom'
import axios from "axios";
import { set } from "firebase/database";

const WelcomePage = () => {
    let [newName, setName] = useState('');

    const addPlayer = async (playerName: string) => {
        try {
            const response = await axios.post('http://localhost:3001/api/welcome/add-player', { 
                playerName 
            });
            // Store playerId in localStorage
            localStorage.setItem('playerId', response.data.playerId);
        } catch (error) {
            console.error("Error adding player:", error);
        }
    };

    return (
        <main>
            <h1>Welcome to Shanghai Rummy!</h1>
            <h2>Please enter your name</h2>
            <div className="add-values">
                <p>Name: </p>
                <input
                    value={newName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setName(e.target.value); }}
                />
                <Link to="/waitingroom">
                    <button onClick={() => addPlayer(newName)}>Join</button>
                </Link>
            </div>
        </main>
    )
}

export default WelcomePage