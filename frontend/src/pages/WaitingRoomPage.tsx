import "../App.css"
import React from "react";
import { useEffect, useState } from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { getDatabase, ref, set, onValue} from "firebase/database"

const WaitingRoomPage = () => {
  const db = getDatabase();
  const gameRef = ref(db, `game`);
  const playersRef = ref(db, `players`);
  const names: string[] = [];
  const navigate = useNavigate();
  const [allNames, setAllNames] = useState(names);

  useEffect(() => {
    onValue(gameRef, (snapshot) => {
      const gameData = snapshot.val();
      handleStart(gameData, navigate);
    });

    onValue(playersRef, (snapshot) => {
      const playersData = snapshot.val();
      getNames(playersData);
    });
  }, []); // Empty dependency array to run the effect only once

  const getNames = (playersData: any) => {
    const playersNames: string[] = [];
    Object.keys(playersData).forEach((key) => {
      let playerInfo = playersData[key];
      Object.keys(playerInfo).forEach((innerKey) => {
        if (innerKey === "playerName") {
          playersNames.push(String(playerInfo[innerKey]));
        }
      });
    });
    setAllNames(playersNames);
  }

  const init = () => {
    const db = getDatabase();
    const gameRef = ref(db, `game`);

    set(gameRef, { 
      started: true,
      cardsDelt: false,
      turn: 0
    });
  }

  const handleStart = (gameData: any, navigate: NavigateFunction) => {
    if (gameData.started === true) {
      navigate('/game');
    }
  }
      
  return (
    <main>
        <h1>Waiting till everyone joins...</h1>
        <h2 className="label">Players</h2>
        <ol>
            {allNames.map((name) => (<li>{name}</li>))}
        </ol>
        <button onClick={init}>Start Game</button>
    </main>
  )
}

export default WaitingRoomPage