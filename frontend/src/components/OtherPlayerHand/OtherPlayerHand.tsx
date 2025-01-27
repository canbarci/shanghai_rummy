import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import axios from "axios";
import LayDownGroup from '../LayDownGroup/LayDownGroup.tsx';
import './OtherPlayerHand.css';

interface CardType {
    value: string;
    suit: string;
    image: string;
}

interface OtherPlayerHandProps {
    playerId: string;
    cardsCount: number;
    currentPlayerId: string;
    // onGroupDrop: (groupKey: string, index: number, targetPlayerId: string) => void; // Add this prop
}

const OtherPlayerHand: React.FC<OtherPlayerHandProps> = ({ 
    playerId, 
    cardsCount,
    currentPlayerId,
    // onGroupDrop
}) => {
    const db = getDatabase();
    const laidDownRef = ref(db, `game/players/${playerId}/laidDown`);
    const currentPlayerHandRef = ref(db, `game/players/${currentPlayerId}/hand`);
    const groupsRef = ref(db, `game/players/${playerId}/groups`);
    const [name, setName] = useState<string | null>(null);
    const [currentPlayerHand, setCurrentPlayerHand] = useState<CardType[]>([]);
    const [laidDown, setLaidDown] = useState(false);
    const [groups, setGroups] = useState<Record<string, CardType[]>>({});
    
    useEffect(() => {
        const getName = async () => {
            try {
                const { data: name } = await axios.get(`http://localhost:3001/api/player-hand/${playerId}/name`);
                setName(name);
            } catch (error) {
                console.error("Error fetching player name:", error);
            }
        };

        const currentPlayerHandListener = onValue(currentPlayerHandRef, (snapshot) => {
            const handData = snapshot.val();
            if (handData) {
                setCurrentPlayerHand(handData);
            }
        });

        const laidDownListener = onValue(laidDownRef, (snapshot) => {
            setLaidDown(snapshot.val() || false);
        });

        const groupsListener = onValue(groupsRef, (snapshot) => {
            const groupsData = snapshot.val();
            if (groupsData) {
                setGroups(groupsData);
            }
        });

        getName();

        return () => {
            laidDownListener();
            groupsListener();
            currentPlayerHandListener();
        };
    }, [playerId, db]);

    const formatGroupLabel = (groupKey: string) => {
        const type = groupKey.replace(/\d+$/, ''); 
        const number = groupKey.match(/\d+$/)?.[0];
        return `${type.charAt(0).toUpperCase() + type.slice(1)} ${number}`;
    };

    return (
        <main>
            <h1 className="other-player-name">{name}</h1>
            <div className="other-player-hand">
                <div className="card-container">
                    <img
                        src="https://www.deckofcardsapi.com/static/img/back.png"
                        alt="Card back"
                        className="card-image"
                    />
                    <div className="card-count">{cardsCount}</div>
                </div>
            </div>
            {laidDown && (
                <div className="groups">
                    {Object.entries(groups).map(([groupKey, cards]) => (
                        <div className="group" key={groupKey}>
                            <span className="group-label">{formatGroupLabel(groupKey)}</span>
                            <LayDownGroup
                                groupKey={groupKey}
                                groups={groups}
                                playerHand={currentPlayerHand}
                                playerId={playerId}
                                laidDown={true} // Always true for other players
                                setGroups={async (updatedGroups) => {
                                    await axios.post(`http://localhost:3001/api/lay-down-groups/${playerId}/update`, {
                                        groups: updatedGroups
                                    });
                                }} // No-op for other players
                                onCardRemove={() => { } } 
                                onGroupDrop={async (cardIndex) => { 
                                    const updatedHand = [...currentPlayerHand];
                                    updatedHand.splice(cardIndex, 1);

                                    await axios.post(`http://localhost:3001/api/player-hand/${currentPlayerId}/update`, {
                                        newHand: updatedHand
                                    });
                                }}
                                // FIX PHANTOM JOKER
                                onHandDrop={async (card) => { 
                                    const updatedHand = [...currentPlayerHand, card];

                                    await axios.post(`http://localhost:3001/api/player-hand/${currentPlayerId}/update`, {
                                        newHand: updatedHand
                                    });
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
};

export default OtherPlayerHand;