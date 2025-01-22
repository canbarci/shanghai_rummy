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
            canDrop: () => !laidDown,
            drop: (item: { index: number }) => {
                const droppedCard = playerHand[item.index];
                setGroups(prevGroups => ({
                    ...prevGroups,
                    [groupKey]: [...prevGroups[groupKey], droppedCard]
                }));
                onGroupDrop(item.index);
                return { groupKey };
            },
            collect: monitor => ({
                isOver: !!monitor.isOver(),
            }),
        });
    
        return (
            <div 
                ref={!laidDown ? drop : null}
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

    const removeCardFromGroup = (groupKey: string, cardIndex: number) => {
        if (!laidDown) {
            setGroups(prevGroups => {
                const newGroups = { ...prevGroups };
                const card = newGroups[groupKey][cardIndex];
                newGroups[groupKey] = newGroups[groupKey].filter((_, i) => i !== cardIndex);
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
            
            // Check for more than one joker
            const jokerCount = cards.filter(card => card.value === 'JOKER').length;
            if (jokerCount > 1) {
                alert(`Invalid ${groupKey}. Only one joker allowed per group.`);
                return false;
            }
    
            const isValid = groupKey.includes('book')
                ? validateBook(cards)
                : validateRun(cards);
    
            if (!isValid) {
                alert(`Invalid ${groupKey}.`);
                return false;
            }
    
            return true;
        });
    };
    
    const validateBook = (cards: CardType[]) => {
        if (cards.length < 3) return false;
        
        // Filter out joker if present
        const nonJokers = cards.filter(card => card.value !== 'JOKER');
        
        // Check if remaining cards have the same value
        return nonJokers.every(card => card.value === nonJokers[0].value);
    };
    
    const validateRun = (cards: CardType[]) => {
        if (cards.length < 4) return false;
    
        let prevValue = -1;
        const jokerIndex = cards.findIndex(card => card.value === 'JOKER');
        let suit = '';
    
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
    
            // Skip joker - we'll validate its position by checking the gap
            if (card.value === 'JOKER') continue;
    
            // Set initial suit
            if (suit === '') {
                suit = card.suit;
            } else if (card.suit !== suit) {
                return false;
            }
    
            const currentValue = cardValueToNumber(card.value);
            
            // Set initial value
            if (prevValue === -1) {
                prevValue = currentValue;
                continue;
            }
    
            // Check if there's a gap that needs a joker
            const gap = currentValue - prevValue;
    
            if (gap === 1) {
                prevValue = currentValue;
            } else if (gap === 2 && jokerIndex > -1 && jokerIndex === i - 1) {
                prevValue = currentValue;
            } else {
                return false;
            }
        }
    
        return true;
    };
    
    const cardValueToNumber = (value: string): number => {
        const valueMap: {[key: string]: number} = {
            'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, 
            '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 
            'J': 11, 'Q': 12, 'K': 13
        };
        return valueMap[value] || (value === 'A' ? 14 : 0);
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