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
            
            const isValid = groupKey.includes('book')
                ? validateBook(cards)
                : validateRun(cards);
    
            if (!isValid) {
                alert(`Invalid ${formatGroupLabel(groupKey)}.`);
                return false;
            }
    
            return true;
        });
    };

    const validateBook = (cards: CardType[]) => {
        return cards.length >= 3 && 
               cards.every(card => card.value === cards[0].value);
    };

    const validateRun = (cards: CardType[]) => {
        if (cards.length < 3) return false;

        // Sort cards by value
        const sortedCards = cards.sort((a, b) => 
            cardValueToNumber(a.value) - cardValueToNumber(b.value)
        );

        // Check if all cards are same suit and consecutive
        return sortedCards.every((card, index) => 
            index === 0 || 
            (card.suit === sortedCards[0].suit && 
             cardValueToNumber(card.value) === cardValueToNumber(sortedCards[index-1].value) + 1)
        );
    };

    const cardValueToNumber = (value: string): number => {
        const valueMap: {[key: string]: number} = {
            'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, 
            '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 
            'J': 11, 'Q': 12, 'K': 13
        };
        return valueMap[value] || 0;
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