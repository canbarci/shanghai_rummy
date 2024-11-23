import React, { useEffect, useState } from "react";
import axios from "axios";

interface OtherPlayerHandProps {
    playerId: string;
    cardsCount: number;
}

const OtherPlayerHand: React.FC<OtherPlayerHandProps> = ({ playerId, cardsCount }) => {
    const [name, setName] = useState<string | null>(null);
    
    useEffect(() => {
        const getName = async () => {
            try {
                const { data: nameData } = await axios.get(`http://localhost:3001/api/player-hand/${playerId}/name`);
                setName(nameData.name);
            } catch (error) {
                console.error("Error fetching player name:", error);
            }
        };

        getName();
    }, [playerId]); // Add playerId as dependency
    
    return (
        <main>
            <h1 className="player-name">{name}</h1>
            <div className="other-player-hand">
                {Array.from({ length: cardsCount }).map((_, index) => (
                    <img
                        key={index}
                        src="https://www.deckofcardsapi.com/static/img/back.png"
                        alt="Card back"
                    />
                ))}
            </div>
        </main>
    );
};

export default OtherPlayerHand;