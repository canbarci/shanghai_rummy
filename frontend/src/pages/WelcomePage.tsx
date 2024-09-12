import "../App.css"
import React from "react";
import { ChangeEvent, useState } from 'react';
import {Link} from 'react-router-dom'
import { getDatabase, ref, set, onDisconnect } from "firebase/database"
import { getAuth, signInAnonymously } from "firebase/auth";

const WelcomePage = () => {
    const db = getDatabase();
    const auth = getAuth(); 
    const gameRef = ref(db, `game`);
    const gameStartRef = ref(db, `game/started`);
    let [newName, setName] = useState('');

    const addPlayer = () => {
        signInAnonymously(auth).catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        // ...
        console.log(errorCode, errorMessage);
        });

        auth.onAuthStateChanged((user) => {
        if (user) {
            const playerId = user.uid;
            const playerRef = ref(db, `players/${playerId}`);

            set(gameStartRef, false)
            
            set(playerRef, {
                playerName: newName
            })

            //Remove me from Firebase when I diconnect
            onDisconnect(gameRef).remove();
            onDisconnect(playerRef).remove();
        }
        })
    }

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
                <button onClick={addPlayer}>Join</button>
                </Link>
            </div>
        </main>
    )
}

export default WelcomePage