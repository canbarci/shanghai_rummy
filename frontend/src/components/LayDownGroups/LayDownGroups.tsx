import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from "firebase/database";
import axios from "axios";
import { useDrop, useDrag } from 'react-dnd';
import { RoundConfigs } from '../../config/roundConfigs.tsx';
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
    const playerId = localStorage.getItem('playerId');
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



    const GroupCard = ({ card, groupKey, index, onRemoveCard, laidDown }: { 
        card: CardType; 
        groupKey: string; 
        index: number;
        onRemoveCard: (groupKey: string, index: number) => void;
        laidDown: boolean;
    }) => {
        const [{ isDragging }, drag] = useDrag({
            type: 'GROUP_CARD',
            item: { card, groupKey, index },
            canDrag: () => !laidDown,
            end: (item, monitor) => {
                if (!laidDown && monitor.didDrop()) { 
                    onRemoveCard(groupKey, index);
                }
            },
            collect: (monitor) => ({
                isDragging: !!monitor.isDragging(),
            }),
        });
    
        return (
            <img
                ref={drag}
                src={card.image}
                alt={`${card.value} of ${card.suit}`}
                className={`card ${isDragging ? 'dragging' : ''}`}
                style={{ opacity: isDragging ? 0.5 : 1 }}
            />
        );
    };

    const GroupPlaceholder = ({ groupKey }: { groupKey: string }) => {
        const [{ isOver }, drop] = useDrop({
            accept: 'CARD',
            drop: async (item: { index: number }) => {
                const droppedCard = playerHand[item.index];
                
                if (laidDown) {
                    const currentGroup = groups[groupKey];
                    const updatedGroups = { ...groups };
            
                    // If dropping a joker, always add it to the end
                    if (droppedCard.value === 'JOKER') {
                        updatedGroups[groupKey] = [...currentGroup, droppedCard];
                        setGroups(updatedGroups);
                        
                        await axios.post(`http://localhost:3001/api/lay-down-groups/${playerId}/update`, {
                            groups: updatedGroups
                        });
                        
                        onGroupDrop(item.index);
                        return { groupKey };
                    }
            
                    const jokerIndex = findJokerPosition(currentGroup);
            
                    // Joker replacement logic
                    if (jokerIndex !== -1 && validateDrop(droppedCard, groupKey, currentGroup)) {
                        const joker = currentGroup[jokerIndex];
                        updatedGroups[groupKey] = [
                            ...currentGroup.filter((_, i) => i !== jokerIndex), 
                            droppedCard
                        ];
                        
                        setGroups(updatedGroups);
            
                        await axios.post(`http://localhost:3001/api/lay-down-groups/${playerId}/update`, {
                            groups: updatedGroups
                        });
            
                        onGroupDrop(item.index);
                        onHandDrop(joker);
                    }
                    // Regular drop validation
                    else if (validateDrop(droppedCard, groupKey, currentGroup)) {
                        updatedGroups[groupKey] = [...currentGroup, droppedCard];
                        
                        setGroups(updatedGroups);
            
                        await axios.post(`http://localhost:3001/api/lay-down-groups/${playerId}/update`, {
                            groups: updatedGroups
                        });
            
                        onGroupDrop(item.index);
                    }
                } else {
                    // Before laying down, accept all drops without validation
                    setGroups(prevGroups => ({
                        ...prevGroups,
                        [groupKey]: [...prevGroups[groupKey], droppedCard]
                    }));
                    onGroupDrop(item.index);
                }
                return { groupKey };
            },
            collect: monitor => ({
                isOver: !!monitor.isOver(),
            }),
        });

        return (
            <div 
                ref={drop}
                className={`group-placeholder ${isOver ? 'drag-over' : ''}`}
            >
                {groups[groupKey].length === 0 ? (
                    <div className="placeholder-box">Drop cards here</div>
                ) : (
                    groups[groupKey].map((card, cardIndex) => (
                        <GroupCard
                            key={cardIndex}
                            card={card}
                            groupKey={groupKey}
                            index={cardIndex}
                            onRemoveCard={removeCardFromGroup}
                            laidDown={laidDown} 
                        />
                    ))
                )}
            </div>
        );
    };

    const findJokerPosition = (group: CardType[]): number => {
        return group.findIndex(card => card.value === 'JOKER');
    };

    const removeCardFromGroup = (groupKey: string, cardIndex: number) => {
        if (laidDown) {
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
        }
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
            const numValue = cardValueToNumber(card.value);
            return numValue === 1 ? 14 : numValue;
        });
    
        // Allow one gap if joker is present
        let gapsAllowed = jokerIndex !== -1 ? 1 : 0;
    
        for (let i = 1; i < cardValues.length; i++) {
            const gap = Math.abs(cardValues[i] - cardValues[i-1]);
            
            if (gap === 1) continue;
            
            if (gap === 2 && gapsAllowed > 0) {
                gapsAllowed--;
            } else {
                return false;
            }
        }
    
        return true;
    };
    
    const validateDrop = (droppedCard: CardType, groupKey: string, currentGroup: CardType[]): boolean => {
        const isBook = groupKey.includes('book');
        const nonJokers = currentGroup.filter(card => card.value !== 'JOKER');
    
        // Book drop validation
        if (isBook) {
            if (nonJokers.length > 0 && droppedCard.value !== nonJokers[0].value) {
                alert('Cards in a book must have the same value');
                return false;
            }
            return true;
        }
    
        // Run drop validation
        if (nonJokers.length > 0 && droppedCard.suit !== nonJokers[0].suit) {
            alert('Cards in a run must be of the same suit');
            return false;
        }
    
        const values = nonJokers.map(card => cardValueToNumber(card.value));
        const newValue = cardValueToNumber(droppedCard.value);
        
        // Special Ace handling
        if (droppedCard.value === 'A') {
            const canAddAceAsOne = values[0] === 2;
            const canAddAceFourteen = values[values.length - 1] === 13;
            return canAddAceAsOne || canAddAceFourteen;
        }
    
        // Check sequential or gap with joker
        if (Math.abs(newValue - values[0]) === 1 || 
            Math.abs(newValue - values[values.length - 1]) === 1) {
            return true;
        }
    
        if (currentGroup.some(card => card.value === 'JOKER')) {
            for (let i = 0; i < values.length - 1; i++) {
                if (Math.abs(values[i] - values[i + 1]) === 2 && 
                    newValue > values[i] && 
                    newValue < values[i + 1]) {
                    return true;
                }
            }
        }
    
        alert('Card must be sequential with existing cards');
        return false;
    };
    
    const cardValueToNumber = (value: string): number => {
        const valueMap: {[key: string]: number} = {
            'ACE': 1, '2': 2, '3': 3, '4': 4, '5': 5, 
            '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 
            'JACK': 11, 'QUEEN': 12, 'KING': 13
        };
        return valueMap[value] || (value === 'ACE' ? 14 : 0);
    };



    if (!isVisible) {
        return null;
    }

    return (
        <div className="groups">
            {Object.keys(groups).map((groupKey) => (
                <div className="group" key={groupKey}>
                    <span className="group-label">{formatGroupLabel(groupKey)}</span>
                    <GroupPlaceholder groupKey={groupKey} />
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