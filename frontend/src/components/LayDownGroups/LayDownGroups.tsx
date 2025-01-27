import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from "firebase/database";
import axios from "axios";
import { useDrop, useDrag } from 'react-dnd';
import { RoundConfigs } from '../../config/roundConfigs.tsx';
import LayDownGroup from '../LayDownGroup/LayDownGroup.tsx';
import './LayDownGroups.css';

interface CardType {
    value: string;
    suit: string;
    image: string;
}

interface LayDownGroupsProps {
    playerHand: CardType[];
    onGroupDrop: (index: number) => void;
    onHandDrop: (card: CardType) => void;
    onLayDown: (groups: Record<string, CardType[]>) => void;
    onCancel: () => void;
    isVisible: boolean;
}

const LayDownGroups: React.FC<LayDownGroupsProps> = ({
    playerHand,
    onGroupDrop,
    onHandDrop,
    onLayDown,
    onCancel,
    isVisible
}) => {
    const playerId = localStorage.getItem('playerId') ?? '';
    const db = getDatabase();
    const roundRef = ref(db, `game/round`);
    const groupsRef = ref(db, `game/players/${playerId}/groups`);
    const laidDownRef = ref(db, `game/players/${playerId}/laidDown`);
    const [currentRound, setCurrentRound] = useState('one');
    const [laidDown, setLaidDown] = useState(false);

    // Initialize groups based on round config
    const initializeGroups = (round: string) => {
        const roundConfig = RoundConfigs[round];
        return roundConfig.reduce((acc, config) => {
            for (let i = 0; i < config.maxGroups; i++) {
                acc[`${config.type}${i + 1}`] = [];
            }
            return acc;
        }, {} as Record<string, CardType[]>);
    };

    // Initialize groups state with the function
    const [groups, setGroups] = useState<Record<string, CardType[]>>(() => 
        initializeGroups(currentRound)
    );

    useEffect(() => {
        const roundListener = onValue(roundRef, (snapshot) => {
            const round = snapshot.val() || 'one';
            setCurrentRound(round);
            // Reset groups when round changes if not already set
            if (!snapshot.val()) {
                setGroups(initializeGroups(round));
            }
        });

        const groupsListener = onValue(groupsRef, (snapshot) => {
            const groupsData = snapshot.val();
            if (groupsData) {
                setGroups(groupsData);
            } else {
                // If no groups data exists, initialize with empty groups
                setGroups(initializeGroups(currentRound));
            }
        });

        const laidDownListener = onValue(laidDownRef, (snapshot) => {
            setLaidDown(snapshot.val() || false);
        });

        return () => {
            roundListener();
            groupsListener();
            laidDownListener();
        };
    }, [currentRound]);
    
    const formatGroupLabel = (groupKey: string) => {
        const type = groupKey.replace(/\d+$/, ''); 
        const number = groupKey.match(/\d+$/)?.[0];

        return `${type.charAt(0).toUpperCase() + type.slice(1)} ${number}`;
    };



    const handleConfirm = async () => {
        if (validateGroups(groups)) {
            onLayDown(groups);
            await axios.post(`http://localhost:3001/api/lay-down-groups/${playerId}/init`,
                { groups }
            );
            setLaidDown(true);
        }
    }

    const validateGroups = (groups: Record<string, CardType[]>): boolean => {
        return Object.entries(groups).every(([groupKey, cards]) => {
            if (cards.length === 0) return false;
            
            const jokerCount = cards.filter(card => card.value === 'JOKER').length;
            if (jokerCount > 1) {
                alert(`Invalid ${groupKey}. Only one joker allowed per group.`);
                return false;
            }
    
            return validateGroup(cards, groupKey);
        });
    };

    const validateGroup = (cards: CardType[], groupKey: string): boolean => {
        // Check minimum group size
        if (cards.length < (groupKey.includes('book') ? 3 : 4)) return false;
    
        // Filter out jokers
        const nonJokerCards = cards.filter(card => card.value !== 'JOKER');
        const jokerIndex = cards.findIndex(card => card.value === 'JOKER');
    
        // Book validation
        if (groupKey.includes('book')) {
            return nonJokerCards.every(card => card.value === nonJokerCards[0].value);
        }
    
        // Run validation
        // Check suit consistency
        const suit = nonJokerCards[0].suit;
        if (!nonJokerCards.every(card => card.suit === suit)) return false;
    
        // Convert card values, handling Ace specially
        const cardValues = nonJokerCards.map(card => {
            if (card.value === 'ACE') {
                const hasKing = nonJokerCards.some(c => c.value === 'KING');
                const hasTwo = nonJokerCards.some(c => c.value === '2');
                return hasKing ? 14 : hasTwo ? 1 : 1;
            }
            return cardValueToNumber(card.value);
        });
    
        // Allow one gap if joker is present
        let gapsAllowed = jokerIndex !== -1 ? 1 : 0;
    
        for (let i = 1; i < cardValues.length; i++) {
            console.log(cardValues[i])
            console.log(cardValues[i-1])
            const gap = Math.abs(cardValues[i] - cardValues[i-1]);
            console.log(gap)
            
            if (gap === 1) continue;
            if (gap === 2 && gapsAllowed > 0) {
                console.log("1")
                gapsAllowed--;
            } else {
                return false;
            }
        }
    
        return true;
    };
    
    const cardValueToNumber = (value: string): number => {
        const valueMap: {[key: string]: number} = {
            'ACE': 1, '2': 2, '3': 3, '4': 4, '5': 5, 
            '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 
            'JACK': 11, 'QUEEN': 12, 'KING': 13
        };
        return valueMap[value];
    };

    const removeCardFromGroup = (groupKey: string, cardIndex: number) => {
        setGroups(prevGroups => {
            const newGroups = { ...prevGroups };
            const card = newGroups[groupKey][cardIndex];
            newGroups[groupKey] = newGroups[groupKey].filter((_, i) => i !== cardIndex);
            
            axios.post(`http://localhost:3001/api/lay-down-groups/${playerId}/update`, {
                groups: newGroups
            });

            onHandDrop(card);
            return newGroups;
        });
    };



    if (!isVisible) {
        return null;
    }

    return (
        <div className="groups">
            {Object.keys(groups).map((groupKey) => (
                <div className="group" key={groupKey}>
                    <span className="group-label">{formatGroupLabel(groupKey)}</span>
                    <LayDownGroup
                        groupKey={groupKey}
                        groups={groups}
                        playerHand={playerHand}
                        playerId={playerId}
                        laidDown={laidDown}
                        setGroups={setGroups}
                        onCardRemove={removeCardFromGroup}
                        onGroupDrop={onGroupDrop}
                        onHandDrop={onHandDrop}
                    />
                </div>
            ))}
            <div className="group-actions">
                {!laidDown && (
                    <>
                        <button onClick={handleConfirm}>Confirm</button>
                        <button onClick={onCancel}>Cancel</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default LayDownGroups;